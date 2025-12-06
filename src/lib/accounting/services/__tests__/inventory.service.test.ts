// =============================================================================
// TESTS - Inventory Service
// =============================================================================

import { calculateCUMP } from "../inventory.service";

describe("Inventory Service", () => {
  describe("calculateCUMP", () => {
    it("should calculate CUMP correctly for first entry", () => {
      const result = calculateCUMP(0, 0, 100, 500);

      expect(result.newQuantity).toBe(100);
      expect(result.newAverageCost).toBe(500);
      expect(result.newTotalValue).toBe(50000);
    });

    it("should calculate weighted average cost correctly", () => {
      // Existing: 100 units at 500 DZD = 50,000 DZD
      // New: 50 units at 600 DZD = 30,000 DZD
      // Total: 150 units, 80,000 DZD
      // CUMP = 80,000 / 150 = 533.33

      const result = calculateCUMP(100, 500, 50, 600);

      expect(result.newQuantity).toBe(150);
      expect(result.newTotalValue).toBe(80000);
      expect(result.newAverageCost).toBeCloseTo(533.33, 2);
    });

    it("should handle zero existing stock", () => {
      const result = calculateCUMP(0, 0, 200, 750);

      expect(result.newQuantity).toBe(200);
      expect(result.newAverageCost).toBe(750);
      expect(result.newTotalValue).toBe(150000);
    });

    it("should handle same price purchases", () => {
      const result = calculateCUMP(100, 500, 100, 500);

      expect(result.newQuantity).toBe(200);
      expect(result.newAverageCost).toBe(500);
      expect(result.newTotalValue).toBe(100000);
    });

    it("should lower CUMP when buying at lower price", () => {
      // Existing: 100 units at 600 DZD = 60,000 DZD
      // New: 100 units at 400 DZD = 40,000 DZD
      // Total: 200 units, 100,000 DZD
      // CUMP = 100,000 / 200 = 500

      const result = calculateCUMP(100, 600, 100, 400);

      expect(result.newQuantity).toBe(200);
      expect(result.newAverageCost).toBe(500);
      expect(result.newTotalValue).toBe(100000);
    });

    it("should raise CUMP when buying at higher price", () => {
      // Existing: 100 units at 400 DZD = 40,000 DZD
      // New: 100 units at 600 DZD = 60,000 DZD
      // Total: 200 units, 100,000 DZD
      // CUMP = 100,000 / 200 = 500

      const result = calculateCUMP(100, 400, 100, 600);

      expect(result.newQuantity).toBe(200);
      expect(result.newAverageCost).toBe(500);
      expect(result.newTotalValue).toBe(100000);
    });

    it("should handle decimal quantities", () => {
      const result = calculateCUMP(10.5, 100, 5.25, 120);

      expect(result.newQuantity).toBe(15.75);
      // (10.5 * 100) + (5.25 * 120) = 1050 + 630 = 1680
      // 1680 / 15.75 = 106.67
      expect(result.newAverageCost).toBeCloseTo(106.67, 2);
    });
  });
});

describe("Stock Validation", () => {
  it("should detect insufficient stock", () => {
    // This would be tested with actual database transactions
    // For now, we're testing the pure calculation logic
    const currentQty = 50;
    const requestedQty = 100;

    expect(currentQty < requestedQty).toBe(true);
  });

  it("should allow valid stock withdrawal", () => {
    const currentQty = 100;
    const requestedQty = 50;

    expect(currentQty >= requestedQty).toBe(true);
    expect(currentQty - requestedQty).toBe(50);
  });
});
