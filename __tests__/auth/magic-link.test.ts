import { createOrGetUserByEmail, issueMagicLink } from "@/lib/auth/auto-email.service";
import { prisma } from "@/lib/prisma";

// Mock the email sending to avoid needing RESEND_API_KEY in tests
jest.mock("@/lib/email/magic-link", () => ({
  sendMagicLinkEmail: jest.fn().mockResolvedValue(undefined),
}));

describe("Auto Email Auth Service", () => {
  const testEmail = `test-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Cleanup
    await prisma.magicLinkToken.deleteMany({ where: { email: testEmail } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  afterAll(async () => {
    await prisma.magicLinkToken.deleteMany({ where: { email: testEmail } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it("should create a user", async () => {
    const user = await createOrGetUserByEmail(testEmail, { name: "Tester" });
    expect(user).toBeDefined();
    expect(user.email).toBe(testEmail);
    expect(user.isEmailVerified).toBe(false);
  });

  it("should issue a magic link", async () => {
    const result = await issueMagicLink(testEmail);
    expect(result.sent).toBe(true);
    expect(result.expiresAt).toBeDefined();
    expect(result.expiresAt).toBeInstanceOf(Date);
  });
});
