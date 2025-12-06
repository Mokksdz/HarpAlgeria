import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all suppliers
export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: {
          select: { purchases: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 },
    );
  }
}

// POST create new supplier
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Generate supplier code if not provided
    let code = data.code;
    if (!code) {
      const last = await prisma.supplier.findFirst({
        where: { code: { startsWith: "FRN-" } },
        orderBy: { code: "desc" },
        select: { code: true },
      });
      let seq = 1;
      if (last?.code) {
        const lastSeq = parseInt(last.code.split("-").pop() || "0");
        seq = lastSeq + 1;
      }
      code = `FRN-${seq.toString().padStart(3, "0")}`;
    }

    const supplier = await prisma.supplier.create({
      data: {
        code,
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        notes: data.notes,
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 },
    );
  }
}
