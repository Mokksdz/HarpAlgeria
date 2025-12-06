// =============================================================================
// TESTS - Cost Service
// =============================================================================

describe("Cost Calculations", () => {
  describe("Margin Calculations", () => {
    it("should calculate margin percentage correctly", () => {
      const sellingPrice = 10000;
      const costPrice = 6000;
      const margin = sellingPrice - costPrice;
      const marginPercent = (margin / sellingPrice) * 100;

      expect(margin).toBe(4000);
      expect(marginPercent).toBe(40);
    });

    it("should calculate selling price from margin target", () => {
      const costPrice = 6000;
      const marginTarget = 40; // 40%
      // If margin is 40%, then cost is 60% of selling price
      // costPrice = sellingPrice * 0.6
      // sellingPrice = costPrice / 0.6
      const sellingPrice = costPrice / (1 - marginTarget / 100);

      expect(sellingPrice).toBe(10000);
    });

    it("should handle break-even calculation", () => {
      const costPrice = 5000;
      const marginTarget = 0;
      const sellingPrice = costPrice / (1 - marginTarget / 100);

      expect(sellingPrice).toBe(5000);
    });

    it("should handle 50% margin", () => {
      const costPrice = 5000;
      const marginTarget = 50;
      const sellingPrice = costPrice / (1 - marginTarget / 100);

      expect(sellingPrice).toBe(10000);
    });
  });

  describe("Cost Breakdown", () => {
    it("should sum material costs correctly", () => {
      const fabricCost = 2000;
      const accessoryCost = 500;
      const packagingCost = 300;
      const materialsCost = fabricCost + accessoryCost + packagingCost;

      expect(materialsCost).toBe(2800);
    });

    it("should calculate total cost with all components", () => {
      const materialsCost = 2800;
      const laborCost = 1500;
      const marketingCost = 500;
      const transportCost = 200;
      const totalCost = materialsCost + laborCost + marketingCost + transportCost;

      expect(totalCost).toBe(5000);
    });

    it("should distribute charges per unit", () => {
      const totalCharges = 50000;
      const estimatedUnits = 100;
      const chargesPerUnit = totalCharges / estimatedUnits;

      expect(chargesPerUnit).toBe(500);
    });

    it("should handle variable unit estimates", () => {
      const totalCharges = 50000;

      const perUnit50 = totalCharges / 50;
      const perUnit100 = totalCharges / 100;
      const perUnit200 = totalCharges / 200;

      expect(perUnit50).toBe(1000);
      expect(perUnit100).toBe(500);
      expect(perUnit200).toBe(250);
    });
  });

  describe("Profitability Analysis", () => {
    it("should identify profitable model", () => {
      const revenue = 100000;
      const cost = 60000;
      const profit = revenue - cost;
      const marginPercent = (profit / revenue) * 100;
      const status = marginPercent >= 10 ? "PROFITABLE" : profit >= 0 ? "BREAK_EVEN" : "LOSS";

      expect(profit).toBe(40000);
      expect(marginPercent).toBe(40);
      expect(status).toBe("PROFITABLE");
    });

    it("should identify loss-making model", () => {
      const revenue = 50000;
      const cost = 60000;
      const profit = revenue - cost;
      const marginPercent = (profit / revenue) * 100;
      const status = profit < 0 ? "LOSS" : marginPercent < 10 ? "BREAK_EVEN" : "PROFITABLE";

      expect(profit).toBe(-10000);
      expect(marginPercent).toBe(-20);
      expect(status).toBe("LOSS");
    });

    it("should identify break-even model", () => {
      const revenue = 100000;
      const cost = 95000;
      const profit = revenue - cost;
      const marginPercent = (profit / revenue) * 100;
      const status = profit < 0 ? "LOSS" : marginPercent < 10 ? "BREAK_EVEN" : "PROFITABLE";

      expect(profit).toBe(5000);
      expect(marginPercent).toBe(5);
      expect(status).toBe("BREAK_EVEN");
    });
  });
});

describe("BOM Calculations", () => {
  it("should calculate material requirement with waste factor", () => {
    const baseQuantity = 1.5; // meters per unit
    const wasteFactor = 1.05; // 5% waste
    const unitsToMake = 100;

    const requiredQuantity = baseQuantity * wasteFactor * unitsToMake;

    expect(requiredQuantity).toBe(157.5);
  });

  it("should calculate total material cost", () => {
    const requiredQuantity = 157.5;
    const unitCost = 800; // DZD per meter

    const totalCost = requiredQuantity * unitCost;

    expect(totalCost).toBe(126000);
  });
});
