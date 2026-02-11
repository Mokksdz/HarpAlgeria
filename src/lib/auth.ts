import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Admin credentials — read lazily at runtime to avoid build-time issues
function getAdminEmail(): string | undefined {
  return process.env.ADMIN_EMAIL;
}

// Validation happens at runtime inside authorize()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "admin-login",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;

        // Read env vars at runtime (not build time)
        const adminEmail = getAdminEmail();
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
          console.error("Admin credentials not configured in environment");
          return null;
        }

        // Check admin credentials
        const isValidEmail = email === adminEmail.trim().toLowerCase();
        if (!isValidEmail) return null;

        // Compare password — strip backslashes that Vercel shell escaping may add
        const cleanPassword = adminPassword.trim().replace(/\\/g, "");
        const isValidPassword = password === cleanPassword;

        if (isValidPassword) {
          return {
            id: "admin-1",
            email: email,
            name: "Admin Harp",
            role: "admin",
          };
        }

        return null;
      },
    }),
    CredentialsProvider({
      id: "magic-link",
      name: "Magic Link",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;
        try {
          const { verifyMagicLink } =
            await import("@/lib/auth/auto-email.service");
          const result = await verifyMagicLink(credentials.token);
          if (result && result.user) {
            return {
              id: result.user.id,
              email: result.user.email,
              name: result.user.name || "User",
              role: "USER",
            };
          }
          return null;
        } catch (e) {
          console.error("Magic link auth failed:", e);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    // Force NextAuth to send unauthorized flows (ex: /admin) to the admin login screen
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string; id?: string }).role =
          token.role as string;
        (session.user as { role?: string; id?: string }).id =
          token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
