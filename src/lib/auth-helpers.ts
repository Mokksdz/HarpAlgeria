import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiLogger } from "@/lib/logger";

/**
 * Custom error class for auth/app errors
 */
export class AuthError extends Error {
  status: number;
  code: string;

  constructor(
    message: string,
    status: number = 401,
    code: string = "AUTH_ERROR",
  ) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
  }
}

export class AppError extends Error {
  status: number;
  code: string;

  constructor(
    message: string,
    status: number = 400,
    code: string = "APP_ERROR",
  ) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Session user type
 */
export interface SessionUser {
  id?: string;
  email?: string | null;
  name?: string | null;
  role?: string;
}

export interface AdminSession {
  user: SessionUser;
}

/**
 * Require admin authentication for API routes
 * Uses NextAuth getServerSession for secure server-side auth check
 *
 * SECURITY: No bypass allowed - all routes must authenticate
 */
export async function requireAdmin(
  _req?: Request | NextRequest | null,
): Promise<AdminSession> {
  const session = await getServerSession(authOptions);

  if (!session) {
    // No session found
    throw new AuthError("Non authentifié", 401, "NOT_AUTHENTICATED");
  }

  const user = session.user as SessionUser | undefined;
  const role = user?.role;

  if (role !== "admin") {
    throw new AuthError(
      "Accès refusé : privilèges insuffisants",
      403,
      "NOT_ADMIN",
    );
  }

  return {
    user: {
      id: user?.id,
      email: session.user?.email,
      name: session.user?.name,
      role,
    },
  };
}

/**
 * Wrapper for API handlers with admin auth
 */
export function withAdmin(
  handler: (req: NextRequest, context: Record<string, unknown>) => Promise<NextResponse>,
) {
  return async (req: NextRequest, context: Record<string, unknown>) => {
    try {
      await requireAdmin(req);
      return await handler(req, context);
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          { success: false, error: error.message, code: error.code },
          { status: error.status },
        );
      }
      if (error instanceof AppError) {
        return NextResponse.json(
          { success: false, error: error.message, code: error.code },
          { status: error.status },
        );
      }
      apiLogger.error("Unexpected error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur interne du serveur",
          code: "INTERNAL_ERROR",
        },
        { status: 500 },
      );
    }
  };
}

/**
 * Standard error handler for API routes
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { success: false, error: error.message, code: error.code },
      { status: error.status },
    );
  }
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: error.message, code: error.code },
      { status: error.status },
    );
  }
  console.error("Unexpected error:", error);
  return NextResponse.json(
    {
      success: false,
      error: "Erreur interne du serveur",
      code: "INTERNAL_ERROR",
    },
    { status: 500 },
  );
}
