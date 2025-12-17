import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";

// Allowed origins for CORS (restrict in production)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "https://harp-dz.com",
  "https://www.harp-dz.com",
];

// Protected API routes that require admin authentication
const PROTECTED_API_ROUTES = [
  "/api/accounting",
  "/api/v3/compta",
  "/api/v3/site/settings",
  "/api/v3/site/hero",
  "/api/v3/site/upload",
];

// Public API routes (no auth required)
const PUBLIC_API_ROUTES = [
  "/api/products",
  "/api/collections",
  "/api/health",
  "/api/v3/auth",
  "/api/v3/loyalty",
  "/api/v3/wishlist",
  "/api/shipping",
];

function addCorsHeaders(response: NextResponse, origin: string | null) {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

function isProtectedApiRoute(pathname: string): boolean {
  return PROTECTED_API_ROUTES.some((route) => pathname.startsWith(route));
}

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
}

// Combined auth middleware
export default withAuth(
  function authMiddleware(req: NextRequestWithAuth) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const origin = req.headers.get("origin");

    // Handle CORS preflight
    if (req.method === "OPTIONS" && pathname.startsWith("/api/")) {
      const response = new NextResponse(null, { status: 204 });
      return addCorsHeaders(response, origin);
    }

    // Allow admin login page
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    // Protect admin routes
    if (pathname.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    // Protect sensitive API routes - require admin role
    if (isProtectedApiRoute(pathname)) {
      if (!token || token.role !== "admin") {
        return NextResponse.json(
          { error: "Unauthorized - Admin access required" },
          { status: 401 },
        );
      }
    }

    // Add CORS headers to API responses
    if (pathname.startsWith("/api/")) {
      const response = NextResponse.next();
      return addCorsHeaders(response, origin);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Always allow admin login page
        if (pathname === "/admin/login") {
          return true;
        }

        // Public API routes don't require auth
        if (isPublicApiRoute(pathname)) {
          return true;
        }

        // Protected routes require token
        if (pathname.startsWith("/admin") || isProtectedApiRoute(pathname)) {
          return !!token;
        }

        // Default: allow
        return true;
      },
    },
    pages: {
      signIn: "/admin/login",
    },
  },
);

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
