/**
 * Tests for input validation and sanitization
 */
import {
  validateProduct,
  validateOrder,
  validateCollection,
  validateOrderStatus,
  sanitizeString,
} from "@/lib/validations";

describe("Input Validation", () => {
  describe("validateProduct", () => {
    const validProduct = {
      nameFr: "Abaya Noire",
      nameAr: "عباية سوداء",
      descriptionFr: "Une belle abaya noire",
      descriptionAr: "عباية سوداء جميلة",
      price: 5500,
      images: ["https://example.com/img.jpg"],
      sizes: ["S", "M", "L"],
      colors: ["Noir"],
    };

    it("should pass with valid product data", () => {
      const result = validateProduct(validProduct);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail when nameFr is missing", () => {
      const result = validateProduct({ ...validProduct, nameFr: "" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Le nom français est requis (min 2 caractères)",
      );
    });

    it("should fail when price is negative", () => {
      const result = validateProduct({ ...validProduct, price: -100 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Le prix doit être un nombre positif");
    });

    it("should fail when images array is empty", () => {
      const result = validateProduct({ ...validProduct, images: [] });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Au moins une image est requise");
    });

    it("should fail with invalid image URL", () => {
      const result = validateProduct({
        ...validProduct,
        images: ["not-a-url"],
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("validateOrder", () => {
    const validOrder = {
      customerName: "John Doe",
      customerPhone: "0555123456",
      customerAddress: "123 Rue de Test, Alger",
      customerCity: "Alger",
      customerWilaya: "16",
      total: 5500,
      items: [
        {
          productName: "Abaya",
          size: "M",
          color: "Noir",
          quantity: 1,
          price: 5500,
        },
      ],
    };

    it("should pass with valid order data", () => {
      const result = validateOrder(validOrder);
      expect(result.valid).toBe(true);
    });

    it("should fail when phone is invalid", () => {
      const result = validateOrder({
        ...validOrder,
        customerPhone: "123",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Un numéro de téléphone valide est requis",
      );
    });

    it("should fail when items are empty", () => {
      const result = validateOrder({ ...validOrder, items: [] });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Au moins un article est requis");
    });

    it("should fail when total is zero", () => {
      const result = validateOrder({ ...validOrder, total: 0 });
      expect(result.valid).toBe(false);
    });
  });

  describe("validateCollection", () => {
    it("should pass with valid collection", () => {
      const result = validateCollection({
        nameFr: "Collection Été",
        nameAr: "مجموعة الصيف",
      });
      expect(result.valid).toBe(true);
    });

    it("should fail with short name", () => {
      const result = validateCollection({ nameFr: "A", nameAr: "ب" });
      expect(result.valid).toBe(false);
    });
  });

  describe("validateOrderStatus", () => {
    it("should accept valid statuses", () => {
      expect(validateOrderStatus("PENDING")).toBe(true);
      expect(validateOrderStatus("CONFIRMED")).toBe(true);
      expect(validateOrderStatus("SHIPPED")).toBe(true);
      expect(validateOrderStatus("DELIVERED")).toBe(true);
      expect(validateOrderStatus("CANCELLED")).toBe(true);
    });

    it("should reject invalid statuses", () => {
      expect(validateOrderStatus("INVALID")).toBe(false);
      expect(validateOrderStatus("")).toBe(false);
    });
  });

  describe("sanitizeString", () => {
    it("should strip HTML tags", () => {
      expect(sanitizeString("<script>alert('xss')</script>Hello")).toBe(
        "alert('xss')Hello",
      );
    });

    it("should trim whitespace", () => {
      expect(sanitizeString("  hello  ")).toBe("hello");
    });

    it("should handle normal strings", () => {
      expect(sanitizeString("Abaya Noire")).toBe("Abaya Noire");
    });
  });
});
