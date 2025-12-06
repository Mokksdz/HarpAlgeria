import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientExportSchema } from "@/lib/schemas/admin.schemas";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";
import { generateCSV } from "@/lib/utils/csv";

// Rate limit: simple in-memory store (for production, use Redis)
const exportRateLimit = new Map<string, number>();
const RATE_LIMIT_MS = 60 * 1000; // 1 minute between exports

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const adminEmail = session.user.email || "unknown";

    // Simple rate limiting
    const lastExport = exportRateLimit.get(adminEmail);
    const now = Date.now();
    if (lastExport && now - lastExport < RATE_LIMIT_MS) {
      const waitSeconds = Math.ceil(
        (RATE_LIMIT_MS - (now - lastExport)) / 1000,
      );
      return NextResponse.json(
        {
          success: false,
          error: `Veuillez attendre ${waitSeconds}s avant un nouvel export`,
        },
        { status: 429 },
      );
    }
    exportRateLimit.set(adminEmail, now);

    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const q = clientExportSchema.parse(query);

    // Build where clause
    const where: any = {};
    if (q.search) {
      where.OR = [
        { email: { contains: q.search } },
        { name: { contains: q.search } },
        { phone: { contains: q.search } },
      ];
    }
    if (q.vipLevel && q.vipLevel !== "ALL") {
      where.vipLevel = q.vipLevel;
    }

    // Fetch all matching users (limit to 100k for safety)
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100000,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        loyaltyPoints: true,
        vipLevel: true,
        isEmailVerified: true,
        _count: {
          select: { orders: true },
        },
      },
    });

    // Log export for audit
    await prisma.auditLog.create({
      data: {
        action: "EXPORT",
        entity: "User",
        entityId: "bulk",
        userEmail: adminEmail,
        metadata: JSON.stringify({
          format: q.format,
          filters: { vipLevel: q.vipLevel, search: q.search },
          count: users.length,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    // Transform data
    const exportData = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name || "",
      phone: u.phone || "",
      createdAt: u.createdAt.toISOString(),
      loyaltyPoints: u.loyaltyPoints,
      vipLevel: u.vipLevel,
      isVerified: u.isEmailVerified ? "Oui" : "Non",
      orderCount: u._count.orders,
    }));

    if (q.format === "json") {
      return NextResponse.json({
        success: true,
        exportedAt: new Date().toISOString(),
        count: exportData.length,
        items: exportData,
      });
    }

    // Generate CSV
    const csv = generateCSV(exportData, [
      { label: "ID", value: "id" },
      { label: "Email", value: "email" },
      { label: "Nom", value: "name" },
      { label: "Téléphone", value: "phone" },
      { label: "Date inscription", value: "createdAt" },
      { label: "Points fidélité", value: "loyaltyPoints" },
      { label: "Niveau VIP", value: "vipLevel" },
      { label: "Email vérifié", value: "isVerified" },
      { label: "Nb commandes", value: "orderCount" },
    ]);

    const filename = `harp_clients_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
