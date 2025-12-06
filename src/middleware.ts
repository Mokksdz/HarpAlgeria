import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    const isAdminLogin = req.nextUrl.pathname === "/admin/login";
    
    // Allow access to admin login page without auth
    if (isAdminLogin) {
      return NextResponse.next();
    }
    
    // For admin routes, check if user has admin role
    if (isAdminRoute && token?.role !== "admin") {
      // Redirect non-admin users to admin login
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow admin login page without auth
        if (req.nextUrl.pathname === "/admin/login") {
          return true;
        }
        // For other admin routes, require token
        return !!token;
      },
    },
    pages: {
      signIn: "/admin/login", // Redirect to admin login for admin routes
    },
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};
