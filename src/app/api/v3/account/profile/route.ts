import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UpdateProfileSchema } from "@/lib/validations/profile";

// GET - Récupérer le profil (crée l'utilisateur s'il n'existe pas)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Upsert: create user if not exists
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      create: {
        email: session.user.email,
        name: session.user.name || null
      },
      update: {}, // No updates on GET
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthDate: true,
        loyaltyPoints: true,
        vipLevel: true,
        createdAt: true
      }
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH - Mettre à jour le profil (crée l'utilisateur s'il n'existe pas)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rawBody = await req.json();
    const parsed = UpdateProfileSchema.safeParse(rawBody);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation échouée" },
        { status: 400 }
      );
    }
    
    const body = parsed.data;
    
    // Build update data
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.birthDate !== undefined) {
      data.birthDate = body.birthDate ? new Date(body.birthDate) : null;
    }

    // Upsert: create user if not exists, update if exists
    const updated = await prisma.user.upsert({
      where: { email: session.user.email },
      create: {
        email: session.user.email,
        name: session.user.name || body.name || null,
        ...data
      },
      update: data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthDate: true,
        loyaltyPoints: true,
        vipLevel: true
      }
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Profile PATCH error:", error);
    
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
