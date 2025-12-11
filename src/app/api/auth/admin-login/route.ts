import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * Rate-limited admin login endpoint
 * This wraps the NextAuth signIn flow with rate limiting protection
 */
export async function POST(req: NextRequest) {
  // Apply strict rate limiting: 5 attempts per 15 minutes
  const rateLimited = withRateLimit(req, RATE_LIMITS.AUTH, "admin-login");
  if (rateLimited) return rateLimited;

  // Pass through to NextAuth - actual auth is handled by NextAuth
  return NextResponse.json({ 
    success: true, 
    message: "Rate limit check passed, proceed with NextAuth signIn" 
  });
}
