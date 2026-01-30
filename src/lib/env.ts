/**
 * Environment variable validation — imported early in the app lifecycle.
 * Throws in production if required variables are missing.
 */

interface EnvConfig {
  DATABASE_URL: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD_HASH: string;
  MAGIC_LINK_JWT_SECRET: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  YALIDINE_API_ID?: string;
  YALIDINE_API_TOKEN?: string;
  ZR_EXPRESS_TOKEN?: string;
  ZR_EXPRESS_KEY?: string;
}

const REQUIRED_IN_PRODUCTION: (keyof EnvConfig)[] = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD_HASH",
  "MAGIC_LINK_JWT_SECRET",
];

const RECOMMENDED: (keyof EnvConfig)[] = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

export function validateEnv(): void {
  const isProduction = process.env.NODE_ENV === "production";
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const key of REQUIRED_IN_PRODUCTION) {
    if (!process.env[key]) {
      if (isProduction) {
        missing.push(key);
      } else {
        warnings.push(key);
      }
    }
  }

  for (const key of RECOMMENDED) {
    if (!process.env[key]) {
      warnings.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `FATAL: Missing required environment variables in production:\n  ${missing.join("\n  ")}`,
    );
  }

  if (warnings.length > 0) {
    console.warn(
      `Missing recommended environment variables:\n  ${warnings.join("\n  ")}`,
    );
  }
}

// Run validation on import in production
if (process.env.NODE_ENV === "production") {
  validateEnv();
}
