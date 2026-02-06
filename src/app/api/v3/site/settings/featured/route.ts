import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getSiteSettings,
  updateFeaturedSettings,
} from "@/lib/site/settings.service";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const settings = await getSiteSettings();

    return NextResponse.json({
      featuredImageUrl: settings.featuredImageUrl,
      featuredImagePublicId: settings.featuredImagePublicId,
      featuredBadgeFr: settings.featuredBadgeFr,
      featuredBadgeAr: settings.featuredBadgeAr,
      featuredTitleFr: settings.featuredTitleFr,
      featuredTitleAr: settings.featuredTitleAr,
      featuredDescFr: settings.featuredDescFr,
      featuredDescAr: settings.featuredDescAr,
      featuredCtaUrl: settings.featuredCtaUrl,
    });
  } catch (error) {
    console.error("Error fetching featured settings:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();

    const { updated } = await updateFeaturedSettings(
      {
        featuredImageUrl: body.featuredImageUrl ?? null,
        featuredImagePublicId: body.featuredImagePublicId ?? null,
        featuredBadgeFr: body.featuredBadgeFr ?? null,
        featuredBadgeAr: body.featuredBadgeAr ?? null,
        featuredTitleFr: body.featuredTitleFr ?? null,
        featuredTitleAr: body.featuredTitleAr ?? null,
        featuredDescFr: body.featuredDescFr ?? null,
        featuredDescAr: body.featuredDescAr ?? null,
        featuredCtaUrl: body.featuredCtaUrl ?? null,
      },
      (session.user as any)?.id,
    );

    revalidatePath("/");

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating featured settings:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 },
    );
  }
}
