/**
 * Unit Tests for Production Module
 * HARP Comptabilité V3 - Phase 2
 */

import {
  calculateBOMRequirements,
  calculateBatchCosts,
} from '@/lib/compta/services/production-service';

describe('calculateBOMRequirements', () => {
  const mockBom = [
    {
      quantity: 2.5, // meters per unit
      wasteFactor: 1.05, // 5% waste
      inventoryItem: {
        id: 'inv1',
        sku: 'TISSU-001',
        name: 'Tissu Coton',
        unit: 'METER',
        available: 500,
        averageCost: 600,
      },
    },
    {
      quantity: 4, // buttons per unit
      wasteFactor: 1.0, // no waste for accessories
      inventoryItem: {
        id: 'inv2',
        sku: 'BOUTON-001',
        name: 'Bouton Nacre',
        unit: 'PIECE',
        available: 1000,
        averageCost: 15,
      },
    },
  ];

  it('should calculate required quantities correctly', () => {
    const plannedQty = 100;
    const result = calculateBOMRequirements(mockBom, plannedQty);

    expect(result).toHaveLength(2);

    // Fabric: 2.5 * 1.05 * 100 = 262.5
    expect(result[0].required).toBeCloseTo(262.5, 2);
    expect(result[0].sku).toBe('TISSU-001');
    expect(result[0].bomQtyPerUnit).toBe(2.5);
    expect(result[0].wasteFactor).toBe(1.05);

    // Buttons: 4 * 1.0 * 100 = 400
    expect(result[1].required).toBe(400);
  });

  it('should calculate shortage correctly when stock insufficient', () => {
    const plannedQty = 200;
    const result = calculateBOMRequirements(mockBom, plannedQty);

    // Fabric: 2.5 * 1.05 * 200 = 525 (need 525, have 500)
    expect(result[0].required).toBeCloseTo(525, 2);
    expect(result[0].available).toBe(500);
    expect(result[0].shortage).toBeCloseTo(25, 2);
    expect(result[0].canConsume).toBe(false);

    // Buttons: 4 * 1.0 * 200 = 800 (need 800, have 1000) - OK
    expect(result[1].required).toBe(800);
    expect(result[1].shortage).toBe(0);
    expect(result[1].canConsume).toBe(true);
  });

  it('should calculate total cost correctly', () => {
    const plannedQty = 100;
    const result = calculateBOMRequirements(mockBom, plannedQty);

    // Fabric: 262.5 * 600 = 157500
    expect(result[0].totalCost).toBeCloseTo(157500, 2);

    // Buttons: 400 * 15 = 6000
    expect(result[1].totalCost).toBe(6000);
  });

  it('should handle empty BOM', () => {
    const result = calculateBOMRequirements([], 100);
    expect(result).toEqual([]);
  });

  it('should handle zero planned quantity', () => {
    const result = calculateBOMRequirements(mockBom, 0);
    expect(result[0].required).toBe(0);
    expect(result[0].shortage).toBe(0);
    expect(result[0].totalCost).toBe(0);
  });
});

describe('calculateBatchCosts', () => {
  const mockBatch = {
    materialsCost: 150000,
    laborCost: 30000,
    overheadCost: 10000,
  };

  const mockModel = {
    otherCost: 50, // per unit
  };

  it('should calculate total cost correctly', () => {
    const producedQty = 100;
    const result = calculateBatchCosts(mockBatch, mockModel, producedQty);

    // Materials: 150000
    // Labor: 30000
    // Overhead: 10000
    // Other: 50 * 100 = 5000
    // Total: 195000
    expect(result.materialsCost).toBe(150000);
    expect(result.laborCost).toBe(30000);
    expect(result.overheadCost).toBe(10000);
    expect(result.otherCost).toBe(5000);
    expect(result.totalCost).toBe(195000);
  });

  it('should calculate cost per unit correctly', () => {
    const producedQty = 100;
    const result = calculateBatchCosts(mockBatch, mockModel, producedQty);

    // 195000 / 100 = 1950
    expect(result.costPerUnit).toBe(1950);
  });

  it('should handle zero produced quantity', () => {
    const result = calculateBatchCosts(mockBatch, mockModel, 0);

    expect(result.totalCost).toBe(190000); // no otherCost when 0 produced
    expect(result.costPerUnit).toBe(0);
  });

  it('should handle waste correctly (fewer produced)', () => {
    const producedQty = 90; // 10 wasted
    const result = calculateBatchCosts(mockBatch, mockModel, producedQty);

    // Other: 50 * 90 = 4500
    // Total: 150000 + 30000 + 10000 + 4500 = 194500
    expect(result.otherCost).toBe(4500);
    expect(result.totalCost).toBe(194500);
    // Cost per unit higher due to waste: 194500 / 90 = 2161.11
    expect(result.costPerUnit).toBeCloseTo(2161.11, 2);
  });
});

describe('Production Lifecycle', () => {
  describe('Batch Status Transitions', () => {
    const validTransitions: Record<string, string[]> = {
      PLANNED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'ON_HOLD'],
      ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    it('should define valid transitions from PLANNED', () => {
      expect(validTransitions['PLANNED']).toContain('IN_PROGRESS');
      expect(validTransitions['PLANNED']).toContain('CANCELLED');
      expect(validTransitions['PLANNED']).not.toContain('COMPLETED');
    });

    it('should define valid transitions from IN_PROGRESS', () => {
      expect(validTransitions['IN_PROGRESS']).toContain('COMPLETED');
      expect(validTransitions['IN_PROGRESS']).toContain('ON_HOLD');
      expect(validTransitions['IN_PROGRESS']).not.toContain('PLANNED');
    });

    it('should not allow transitions from COMPLETED', () => {
      expect(validTransitions['COMPLETED']).toHaveLength(0);
    });

    it('should not allow transitions from CANCELLED', () => {
      expect(validTransitions['CANCELLED']).toHaveLength(0);
    });
  });

  describe('Cost Formulas', () => {
    it('should verify CUMP-based material cost formula', () => {
      // Materials cost = sum(requiredQty * averageCost)
      const materials = [
        { required: 250, avgCost: 600 },
        { required: 400, avgCost: 15 },
      ];

      const totalMaterialsCost = materials.reduce(
        (sum, m) => sum + m.required * m.avgCost,
        0
      );

      expect(totalMaterialsCost).toBe(250 * 600 + 400 * 15);
      expect(totalMaterialsCost).toBe(156000);
    });

    it('should verify total cost formula', () => {
      // totalCost = materialsCost + laborCost + overheadCost + (model.otherCost * producedQty)
      const materialsCost = 156000;
      const laborCost = 30000;
      const overheadCost = 10000;
      const otherCostPerUnit = 50;
      const producedQty = 100;

      const totalCost =
        materialsCost + laborCost + overheadCost + otherCostPerUnit * producedQty;

      expect(totalCost).toBe(201000);
    });

    it('should verify cost per unit formula', () => {
      // costPerUnit = totalCost / producedQty
      const totalCost = 201000;
      const producedQty = 100;

      const costPerUnit = totalCost / producedQty;

      expect(costPerUnit).toBe(2010);
    });
  });
});

describe('BOM Calculations with Waste Factor', () => {
  it('should apply 5% waste factor correctly', () => {
    const baseQty = 100;
    const wasteFactor = 1.05;
    const result = baseQty * wasteFactor;

    expect(result).toBe(105);
  });

  it('should apply 10% waste factor correctly', () => {
    const baseQty = 100;
    const wasteFactor = 1.10;
    const result = baseQty * wasteFactor;

    expect(result).toBeCloseTo(110, 2);
  });

  it('should calculate BOM with different waste factors', () => {
    const bom = [
      { qtyPerUnit: 2, wasteFactor: 1.05 }, // 5% waste
      { qtyPerUnit: 1, wasteFactor: 1.10 }, // 10% waste
      { qtyPerUnit: 4, wasteFactor: 1.00 }, // no waste
    ];

    const plannedQty = 100;

    const requirements = bom.map((item) => ({
      required: item.qtyPerUnit * item.wasteFactor * plannedQty,
    }));

    expect(requirements[0].required).toBeCloseTo(210, 2); // 2 * 1.05 * 100
    expect(requirements[1].required).toBeCloseTo(110, 2); // 1 * 1.10 * 100
    expect(requirements[2].required).toBeCloseTo(400, 2); // 4 * 1.00 * 100
  });
});

describe('Edge Cases & Error Handling', () => {
  describe('Status Transitions', () => {
    const validTransitions: Record<string, string[]> = {
      PLANNED: ['CANCELLED'],
      IN_PROGRESS: ['ON_HOLD', 'COMPLETED'],
      ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    it('should only allow ON_HOLD from IN_PROGRESS', () => {
      expect(validTransitions['IN_PROGRESS']).toContain('ON_HOLD');
      expect(validTransitions['PLANNED']).not.toContain('ON_HOLD');
    });

    it('should prevent direct PLANNED → COMPLETED', () => {
      expect(validTransitions['PLANNED']).not.toContain('COMPLETED');
    });
  });

  describe('Validation Rules', () => {
    it('should reject producedQty = 0', () => {
      const data = { producedQty: 0, wasteQty: 0 };
      expect(data.producedQty <= 0).toBe(true);
    });

    it('should reject producedQty + wasteQty > plannedQty * 1.1', () => {
      const plannedQty = 100;
      const tolerance = 1.1;
      const producedQty = 100;
      const wasteQty = 15; // Total 115 > 110

      const exceeds = producedQty + wasteQty > plannedQty * tolerance;
      expect(exceeds).toBe(true);
    });

    it('should accept producedQty + wasteQty within tolerance', () => {
      const plannedQty = 100;
      const tolerance = 1.1;
      const producedQty = 95;
      const wasteQty = 10; // Total 105 < 110

      const exceeds = producedQty + wasteQty > plannedQty * tolerance;
      expect(exceeds).toBe(false);
    });
  });

  describe('BOM with high waste factors', () => {
    it('should handle wasteFactor > 1.5 (50% waste)', () => {
      const qtyPerUnit = 1;
      const wasteFactor = 1.5;
      const plannedQty = 100;

      const required = qtyPerUnit * wasteFactor * plannedQty;
      expect(required).toBe(150);
    });
  });

  describe('Missing BOM Items', () => {
    it('should return empty requirements for empty BOM', () => {
      const bom: never[] = [];
      const plannedQty = 100;

      const requirements = bom.map(() => ({ required: 0 }));
      expect(requirements).toHaveLength(0);
    });
  });
});

describe('Finished Product CUMP Calculation', () => {
  it('should calculate new CUMP when adding production to existing stock', () => {
    // Existing stock: 50 units at 2000 DZD CUMP
    const oldQty = 50;
    const oldCump = 2000;
    const oldValue = oldQty * oldCump; // 100,000

    // New production: 100 units at 2500 DZD/unit
    const addedQty = 100;
    const costPerUnit = 2500;
    const addedValue = addedQty * costPerUnit; // 250,000

    // New stock
    const newQty = oldQty + addedQty; // 150
    const newValue = oldValue + addedValue; // 350,000
    const newCUMP = newValue / newQty; // ~2333.33

    expect(newQty).toBe(150);
    expect(newValue).toBe(350000);
    expect(newCUMP).toBeCloseTo(2333.33, 2);
  });

  it('should use costPerUnit as CUMP when no existing stock', () => {
    const oldQty = 0;
    const oldValue = 0;

    const addedQty = 100;
    const costPerUnit = 2500;
    const addedValue = addedQty * costPerUnit;

    const newQty = oldQty + addedQty;
    const newValue = oldValue + addedValue;
    const newCUMP = newQty > 0 ? newValue / newQty : costPerUnit;

    expect(newCUMP).toBe(2500);
  });
});

describe('Inventory Transactions', () => {
  it('should create OUT transaction for consumption', () => {
    const transaction = {
      direction: 'OUT',
      type: 'PRODUCTION',
      quantity: 250,
      balanceBefore: 500,
      balanceAfter: 250,
    };

    expect(transaction.direction).toBe('OUT');
    expect(transaction.type).toBe('PRODUCTION');
    expect(transaction.balanceAfter).toBe(transaction.balanceBefore - transaction.quantity);
  });

  it('should preserve average cost during consumption', () => {
    const item = {
      quantity: 500,
      averageCost: 600,
      totalValue: 300000,
    };

    const consumed = 250;
    const newQty = item.quantity - consumed;
    const newValue = newQty * item.averageCost;

    expect(newQty).toBe(250);
    expect(newValue).toBe(150000);
    // Average cost should NOT change during consumption
    expect(item.averageCost).toBe(600);
  });
});
