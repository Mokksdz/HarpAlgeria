import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { syncGuestWishlistToUser } from "@/lib/auth/auto-email.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const schema = z.object({
  items: z.array(z.object({
    productId: z.string()
  })),
  guestKey: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const validation = schema.safeParse(body);
    
    if (!validation.success) {
        return NextResponse.json({ success: false, error: "Format invalide" }, { status: 400 });
    }

    const { items, guestKey } = validation.data;
    const userId = (session.user as any).id;

    await syncGuestWishlistToUser(guestKey || "manual_sync", userId, items);

    return NextResponse.json({ success: true, message: "Wishlist synchronisée" });
  } catch (err) {
    console.error("Wishlist sync error:", err);
    return NextResponse.json({ success: false, error: "Erreur de synchronisation" }, { status: 500 });
  }
}
