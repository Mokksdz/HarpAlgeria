import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Admin credentials from environment variables (REQUIRED)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

// Validate required environment variables at startup
if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
    console.warn("⚠️ ADMIN_EMAIL and ADMIN_PASSWORD_HASH must be set in environment variables");
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: "admin-login",
            name: "Admin Login",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                // Check if admin credentials are configured
                if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
                    console.error("Admin credentials not configured in environment");
                    return null;
                }

                // Check admin credentials
                const isValidEmail = credentials.email === ADMIN_EMAIL;
                const isValidPassword = await bcrypt.compare(
                    credentials.password,
                    ADMIN_PASSWORD_HASH
                );

                if (isValidEmail && isValidPassword) {
                    return {
                        id: "admin-1",
                        email: credentials.email,
                        name: "Admin Harp",
                        role: "admin"
                    };
                }

                return null;
            }
        }),
        CredentialsProvider({
            id: "magic-link",
            name: "Magic Link",
            credentials: {
                token: { label: "Token", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.token) return null;
                try {
                    const { verifyMagicLink } = await import("@/lib/auth/auto-email.service");
                    const result = await verifyMagicLink(credentials.token);
                    if (result && result.user) {
                        return {
                            id: result.user.id,
                            email: result.user.email,
                            name: result.user.name || "User",
                            role: "USER"
                        };
                    }
                    return null;
                } catch (e) {
                    console.error("Magic link auth failed:", e);
                    return null;
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    pages: {
        signIn: "/auth/magic-link-request", // Default sign in page for users
        // Admin login still accessible at /admin/login via custom page logic
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.id = (user as any).id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};
