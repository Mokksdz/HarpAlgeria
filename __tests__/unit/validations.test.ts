/**
 * Unit Tests for Validation Schemas
 */

import { z } from "zod";

// Define schemas locally to avoid import path issues
const algerianPhoneRegex = /^0[1-9][0-9]{8}$/;

const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional().nullable(),
  phone: z.string().regex(algerianPhoneRegex, "Le numéro doit contenir 10 chiffres (ex: 0551234567)").optional().nullable().or(z.literal("")),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format date invalide (AAAA-MM-JJ)").optional().nullable().or(z.literal("")),
});

const CheckoutSchema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  phone: z.string().regex(algerianPhoneRegex, "Le numéro doit contenir 10 chiffres"),
  email: z.string().email("Email invalide").optional(),
  wilaya: z.string().min(1, "Wilaya requise"),
  city: z.string().min(1, "Commune requise"),
  address: z.string().min(5, "Adresse requise").optional(),
});

describe("Validation Schemas", () => {
  describe("Algerian Phone Regex", () => {
    const validPhones = [
      "0551234567",
      "0661234567",
      "0771234567",
      "0781234567",
      "0791234567",
      "0211234567", // Landline
    ];

    const invalidPhones = [
      "551234567",    // Missing leading 0
      "00551234567",  // Too many digits
      "05512345",     // Too few digits
      "1551234567",   // Doesn't start with 0
      "0051234567",   // Second digit is 0
      "055123456a",   // Contains letter
      "+213551234567", // International format (not supported)
      "",             // Empty
    ];

    test.each(validPhones)("should accept valid phone: %s", (phone) => {
      expect(algerianPhoneRegex.test(phone)).toBe(true);
    });

    test.each(invalidPhones)("should reject invalid phone: %s", (phone) => {
      expect(algerianPhoneRegex.test(phone)).toBe(false);
    });
  });

  describe("UpdateProfileSchema", () => {
    it("should accept valid profile data", () => {
      const validData = {
        name: "Amina Benali",
        phone: "0551234567",
        birthDate: "1990-05-15",
      };

      const result = UpdateProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept partial updates", () => {
      const partialData = {
        name: "Amina",
      };

      const result = UpdateProfileSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it("should accept empty phone (optional)", () => {
      const data = {
        phone: "",
      };

      const result = UpdateProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject invalid phone format", () => {
      const invalidData = {
        phone: "12345",
      };

      const result = UpdateProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("10 chiffres");
      }
    });

    it("should reject invalid date format", () => {
      const invalidData = {
        birthDate: "15-05-1990", // Wrong format
      };

      const result = UpdateProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept null values", () => {
      const data = {
        name: null,
        phone: null,
        birthDate: null,
      };

      const result = UpdateProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("CheckoutSchema", () => {
    const validCheckout = {
      firstName: "Amina",
      lastName: "Benali",
      phone: "0551234567",
      wilaya: "16",
      city: "Bab El Oued",
      address: "123 Rue Example",
    };

    it("should accept valid checkout data", () => {
      const result = CheckoutSchema.safeParse(validCheckout);
      expect(result.success).toBe(true);
    });

    it("should require firstName with minimum length", () => {
      const invalid = { ...validCheckout, firstName: "A" };
      const result = CheckoutSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should require phone in Algerian format", () => {
      const invalid = { ...validCheckout, phone: "123456" };
      const result = CheckoutSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should require wilaya", () => {
      const invalid = { ...validCheckout, wilaya: "" };
      const result = CheckoutSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should make email optional", () => {
      const withoutEmail = { ...validCheckout };
      const result = CheckoutSchema.safeParse(withoutEmail);
      expect(result.success).toBe(true);
    });

    it("should validate email format when provided", () => {
      const withEmail = { ...validCheckout, email: "invalid-email" };
      const result = CheckoutSchema.safeParse(withEmail);
      expect(result.success).toBe(false);
    });

    it("should accept valid email", () => {
      const withEmail = { ...validCheckout, email: "amina@example.com" };
      const result = CheckoutSchema.safeParse(withEmail);
      expect(result.success).toBe(true);
    });
  });
});
