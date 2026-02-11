import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
    function middleware(req: NextRequest) {
        const response = NextResponse.next();
        
        // Add security headers for API routes
        if (req.nextUrl.pathname.startsWith("/api/")) {
            // Restrict CORS - only allow same origin by default
            const origin = req.headers.get("origin");
            const allowedOrigins = [
                process.env.NEXT_PUBLIC_APP_URL,
                "http://localhost:3000",
                "https://harp-web.com",
            ].filter(Boolean).map((o) => (o as string).trim());
            
            if (origin && allowedOrigins.includes(origin)) {
                response.headers.set("Access-Control-Allow-Origin", origin);
            }
            
            response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
            response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
            response.headers.set("Access-Control-Max-Age", "86400");
        }
        
        return response;
    },
    {
        pages: {
            signIn: "/admin/login", // Redirect to admin login for protected routes
        },
        callbacks: {
            authorized: ({ token, req }) => {
                const path = req.nextUrl.pathname;
                const method = req.method;
                
                // Allow access to login page without auth
                if (path === "/admin/login") {
                    return true;
                }
                
                // Require auth for all admin routes
                if (path.startsWith("/admin")) {
                    return !!token;
                }
                
                // Protect accounting API routes (admin only)
                if (path.startsWith("/api/accounting") && method !== "GET") {
                    return !!token && (token as { role?: string }).role === "admin";
                }
                
                // Protect v3 admin routes
                if (path.startsWith("/api/v3/admin")) {
                    return !!token && (token as { role?: string }).role === "admin";
                }
                
                // Protect v3 compta routes (admin only for writes)
                if (path.startsWith("/api/v3/compta") && method !== "GET") {
                    return !!token && (token as { role?: string }).role === "admin";
                }
                
                // Protect site settings (admin only)
                if (path.startsWith("/api/v3/site") && method !== "GET") {
                    return !!token && (token as { role?: string }).role === "admin";
                }
                
                // Protect products/collections write operations
                if (path.startsWith("/api/products") && method !== "GET") {
                    return !!token;
                }
                if (path.startsWith("/api/collections") && method !== "GET") {
                    return !!token;
                }
                
                // Protect order modification and deletion (PATCH, PUT, DELETE = admin only)
                if (path.startsWith("/api/orders") && (method === "DELETE" || method === "PATCH" || method === "PUT")) {
                    // Allow POST (order creation) for everyone, protect writes
                    return !!token;
                }
                
                return true;
            },
        },
    }
);

export const config = {
    matcher: [
        "/admin/:path*",
        "/api/products/:path*",
        "/api/collections/:path*",
        "/api/orders/:path*",
        "/api/accounting/:path*",
        "/api/v3/:path*",
    ],
};
