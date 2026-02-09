import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getSiteSettings,
  updateAboutSettings,
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
      aboutImage1Url: settings.aboutImage1Url,
      aboutImage2Url: settings.aboutImage2Url,
      aboutImage3Url: settings.aboutImage3Url,
      aboutHeroTitle: settings.aboutHeroTitle,
      aboutHeroSubtitle: settings.aboutHeroSubtitle,
      aboutStoryTitle: settings.aboutStoryTitle,
      aboutStoryP1: settings.aboutStoryP1,
      aboutStoryP2: settings.aboutStoryP2,
      aboutStoryP3: settings.aboutStoryP3,
      aboutQuote: settings.aboutQuote,
      aboutQuoteAuthor: settings.aboutQuoteAuthor,
    });
  } catch (error) {
    console.error("Error fetching about settings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();

    const { updated } = await updateAboutSettings(
      {
        aboutImage1Url: body.aboutImage1Url ?? null,
        aboutImage2Url: body.aboutImage2Url ?? null,
        aboutImage3Url: body.aboutImage3Url ?? null,
        aboutHeroTitle: body.aboutHeroTitle ?? null,
        aboutHeroSubtitle: body.aboutHeroSubtitle ?? null,
        aboutStoryTitle: body.aboutStoryTitle ?? null,
        aboutStoryP1: body.aboutStoryP1 ?? null,
        aboutStoryP2: body.aboutStoryP2 ?? null,
        aboutStoryP3: body.aboutStoryP3 ?? null,
        aboutQuote: body.aboutQuote ?? null,
        aboutQuoteAuthor: body.aboutQuoteAuthor ?? null,
      },
      (session.user as any)?.id,
    );

    revalidatePath("/about");

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating about settings:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 },
    );
  }
}
