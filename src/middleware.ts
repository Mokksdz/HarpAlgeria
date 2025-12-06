import { withAuth } from "next-auth/middleware";
import { NextResponse, NextRequest } from "next/server";

// Allowed origins for CORS (restrict in production)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "https://harp-dz.com",
  "https://www.harp-dz.com",
];

function addCorsHeaders(response: NextResponse, origin: string | null) {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

// Handle preflight requests
export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const pathname = request.nextUrl.pathname;

  // Handle CORS preflight for API routes
  if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
    const response = new NextResponse(null, { status: 204 });
    return addCorsHeaders(response, origin);
  }

  // Add CORS headers to API responses
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    return addCorsHeaders(response, origin);
  }

  return NextResponse.next();
}

// Auth middleware for admin routes
export default withAuth(
  function authMiddleware(req) {
    const token = req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    const isAdminLogin = req.nextUrl.pathname === "/admin/login";

    if (isAdminLogin) {
      return NextResponse.next();
    }

    if (isAdminRoute && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname === "/admin/login") {
          return true;
        }
        return !!token;
      },
    },
    pages: {
      signIn: "/admin/login",
    },
  },
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/:path*",
    "/api/v3/:path*",
    "/api/accounting/:path*",
    "/api/shipping/:path*",
  ],
};
