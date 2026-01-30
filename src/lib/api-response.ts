import { NextResponse } from "next/server";

/**
 * Standardized API response format.
 * All API routes should use these helpers for consistent responses.
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: string[];
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Return a success response with consistent format
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ success: true, data } as ApiSuccessResponse<T>, {
    status,
  });
}

/**
 * Return an error response with consistent format
 */
export function apiError(
  message: string,
  status: number = 400,
  code: string = "BAD_REQUEST",
  details?: string[],
): NextResponse {
  const body: ApiErrorResponse = {
    success: false,
    error: message,
    code,
  };
  if (details && details.length > 0) {
    body.details = details;
  }
  return NextResponse.json(body, { status });
}

/**
 * Common error responses
 */
export const ApiErrors = {
  unauthorized: () => apiError("Non authentifié", 401, "UNAUTHORIZED"),
  forbidden: () => apiError("Accès refusé", 403, "FORBIDDEN"),
  notFound: (resource: string = "Ressource") =>
    apiError(`${resource} non trouvé(e)`, 404, "NOT_FOUND"),
  validationFailed: (details: string[]) =>
    apiError("Validation échouée", 400, "VALIDATION_ERROR", details),
  internal: () =>
    apiError("Erreur interne du serveur", 500, "INTERNAL_ERROR"),
  rateLimited: () =>
    apiError("Trop de requêtes", 429, "RATE_LIMITED"),
} as const;
