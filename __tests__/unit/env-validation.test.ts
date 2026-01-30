/**
 * Tests for environment variable validation
 */

describe("Environment Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should throw in production when required vars are missing", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.DATABASE_URL;
    delete process.env.NEXTAUTH_SECRET;

    expect(() => {
      const { validateEnv } = require("@/lib/env");
      validateEnv();
    }).toThrow("FATAL: Missing required environment variables");
  });

  it("should not throw in development when vars are missing", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    delete process.env.DATABASE_URL;

    expect(() => {
      const { validateEnv } = require("@/lib/env");
      validateEnv();
    }).not.toThrow();
  });

  it("should pass when all required vars are set", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.DATABASE_URL = "postgresql://localhost/test";
    process.env.NEXTAUTH_SECRET = "test-secret";
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    process.env.ADMIN_EMAIL = "admin@test.com";
    process.env.ADMIN_PASSWORD_HASH = "$2b$10$hash";
    process.env.MAGIC_LINK_JWT_SECRET = "magic-secret";

    expect(() => {
      const { validateEnv } = require("@/lib/env");
      validateEnv();
    }).not.toThrow();
  });
});
