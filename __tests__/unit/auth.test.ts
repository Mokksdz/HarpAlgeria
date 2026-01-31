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

  it("should load without error even when admin credentials are missing", () => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;

    expect(() => {
      require("@/lib/auth");
    }).not.toThrow();
  });

  it("should export authOptions with JWT session strategy", () => {
    process.env.ADMIN_EMAIL = "admin@test.com";
    process.env.ADMIN_PASSWORD = "test-password";
    process.env.NEXTAUTH_SECRET = "test-secret";

    const { authOptions } = require("@/lib/auth");

    expect(authOptions).toBeDefined();
    expect(authOptions.session.strategy).toBe("jwt");
    expect(authOptions.session.maxAge).toBe(86400);
    expect(authOptions.providers).toHaveLength(2);
  });
});
