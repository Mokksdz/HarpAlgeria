import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createOrGetUserByEmail,
  issueMagicLink,
} from "@/lib/auth/auto-email.service";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/auth-helpers";

const schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  guestKey: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    // Rate limit: 5 requests per hour per IP
    if (!checkRateLimit(`magic-link-${ip}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json(
        {
          success: false,
          error: "Trop de demandes. Veuillez réessayer plus tard.",
        },
        { status: 429 },
      );
    }

    const body = await req.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Données invalides",
          details: validation.error.errors,
        },
        { status: 400 },
      );
    }

    const { email, name, guestKey } = validation.data;

    // 1. Ensure user exists (created via AUTO_EMAIL if new)
    await createOrGetUserByEmail(email, { name, guestKey });

    // 2. Issue link
    const result = await issueMagicLink(email, "login", guestKey);

    return NextResponse.json({
      success: true,
      message: "Lien de connexion envoyé par email.",
      expiresAt: result.expiresAt,
    });
  } catch (err) {
    console.error("Auto-Auth Error:", err);
    // Return the actual error message for email-related errors
    if (err instanceof Error && (
      err.message.includes("email") ||
      err.message.includes("Email") ||
      err.message.includes("Échec") ||
      err.message.includes("domaine") ||
      err.message.includes("configuré")
    )) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 503 },
      );
    }
    return handleApiError(err);
  }
}
