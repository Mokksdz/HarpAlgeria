/**
 * Tests for authentication configuration
 */

describe("Auth Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should throw in production when admin credentials are missing", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD_HASH;

    expect(() => {
      require("@/lib/auth");
    }).toThrow("FATAL: ADMIN_EMAIL and ADMIN_PASSWORD_HASH must be set");
  });

  it("should warn in development when admin credentials are missing", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD_HASH;
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();

    require("@/lib/auth");

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("admin login disabled"),
    );
    warnSpy.mockRestore();
  });

  it("should export authOptions with JWT session strategy", () => {
    process.env.ADMIN_EMAIL = "admin@test.com";
    process.env.ADMIN_PASSWORD_HASH = "$2b$10$hash";
    process.env.NEXTAUTH_SECRET = "test-secret";

    const { authOptions } = require("@/lib/auth");

    expect(authOptions).toBeDefined();
    expect(authOptions.session.strategy).toBe("jwt");
    expect(authOptions.session.maxAge).toBe(86400);
    expect(authOptions.providers).toHaveLength(2);
  });
});
