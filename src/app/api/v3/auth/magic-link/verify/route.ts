import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLink } from "@/lib/auth/auto-email.service";
import { handleApiError } from "@/lib/auth-helpers";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limit magic link verification attempts
    const rateLimited = withRateLimit(
      req,
      RATE_LIMITS.MAGIC_LINK,
      "magic-verify",
    );
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Token manquant",
        },
        { status: 400 },
      );
    }

    const result = await verifyMagicLink(token);

    // In a full NextAuth setup, we might normally use the NextAuth `signIn` flow.
    // Here we verify manually. We return the user.
    // The frontend can use this response to set a context or redirect.

    return NextResponse.json({
      success: true,
      user: result.user,
      isNewUser: result.isNewUser,
      guestKey: result.guestKey,
      message: "Connexion réussie",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
