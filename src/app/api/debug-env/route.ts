import { NextResponse } from "next/server";

export async function GET() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const nextauthUrl = process.env.NEXTAUTH_URL;

  return NextResponse.json({
    hasAdminEmail: !!adminEmail,
    adminEmailValue: adminEmail ? adminEmail.substring(0, 5) + "***" : "MISSING",
    hasAdminPassword: !!adminPassword,
    adminPasswordLength: adminPassword ? adminPassword.length : 0,
    adminPasswordFirst3: adminPassword ? adminPassword.substring(0, 3) + "***" : "MISSING",
    nextauthUrl: nextauthUrl || "MISSING",
    nodeEnv: process.env.NODE_ENV,
  });
}
