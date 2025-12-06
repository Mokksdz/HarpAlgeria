/**
 * Unit Tests for Accounting Helpers
 * HARP Comptabilité V3 - Phase 1
 */

import {
  calculateCUMP,
  calculateTotalValue,
  calculateRemainingQty,
  determinePurchaseStatus,
} from '@/lib/compta/accounting';

describe('calculateCUMP', () => {
  it('should calculate CUMP correctly for standard case', () => {
    // Stock: 100 units @ 500 DZD, receiving 50 units @ 600 DZD
    const result = calculateCUMP(100, 500, 50, 600);
    // (100 * 500 + 50 * 600) / 150 = (50000 + 30000) / 150 = 533.33
    expect(result).toBeCloseTo(533.33, 2);
  });

  it('should return received unit price when starting with zero stock', () => {
    const result = calculateCUMP(0, 0, 100, 450);
    expect(result).toBe(450);
  });

  it('should return existing CUMP when receiving zero quantity', () => {
    const result = calculateCUMP(100, 500, 0, 600);
    expect(result).toBe(500);
  });

  it('should return received price when new total quantity is zero', () => {
    // Edge case: old stock depleted and receiving nothing
    const result = calculateCUMP(0, 0, 0, 100);
    expect(result).toBe(100);
  });

  it('should handle decimal quantities correctly', () => {
    // Stock: 2.5 meters @ 1000 DZD, receiving 1.5 meters @ 1200 DZD
    const result = calculateCUMP(2.5, 1000, 1.5, 1200);
    // (2.5 * 1000 + 1.5 * 1200) / 4 = (2500 + 1800) / 4 = 1075
    expect(result).toBeCloseTo(1075, 2);
  });

  it('should handle large values correctly', () => {
    const result = calculateCUMP(10000, 5000, 5000, 6000);
    // (10000 * 5000 + 5000 * 6000) / 15000 = (50M + 30M) / 15000 = 5333.33
    expect(result).toBeCloseTo(5333.33, 2);
  });

  it('should round to 2 decimal places', () => {
    // Case that would produce more than 2 decimals
    const result = calculateCUMP(3, 100, 1, 101);
    // (3 * 100 + 1 * 101) / 4 = 401 / 4 = 100.25
    expect(result).toBe(100.25);
  });
});

describe('calculateTotalValue', () => {
  it('should calculate total value correctly', () => {
    expect(calculateTotalValue(100, 500)).toBe(50000);
  });

  it('should return 0 for zero quantity', () => {
    expect(calculateTotalValue(0, 500)).toBe(0);
  });

  it('should return 0 for zero cost', () => {
    expect(calculateTotalValue(100, 0)).toBe(0);
  });

  it('should handle decimal values', () => {
    const result = calculateTotalValue(2.5, 1000.5);
    expect(result).toBeCloseTo(2501.25, 2);
  });
});

describe('calculateRemainingQty', () => {
  it('should calculate remaining correctly', () => {
    expect(calculateRemainingQty(100, 30)).toBe(70);
  });

  it('should return 0 when fully received', () => {
    expect(calculateRemainingQty(100, 100)).toBe(0);
  });

  it('should return 0 when over-received (never negative)', () => {
    expect(calculateRemainingQty(100, 150)).toBe(0);
  });

  it('should handle decimals', () => {
    expect(calculateRemainingQty(10.5, 3.2)).toBeCloseTo(7.3, 2);
  });
});

describe('determinePurchaseStatus', () => {
  it('should return DRAFT when nothing received', () => {
    const items = [
      { quantityOrdered: 100, quantityReceived: 0 },
      { quantityOrdered: 50, quantityReceived: 0 },
    ];
    expect(determinePurchaseStatus(items)).toBe('DRAFT');
  });

  it('should return PARTIAL when some received', () => {
    const items = [
      { quantityOrdered: 100, quantityReceived: 50 },
      { quantityOrdered: 50, quantityReceived: 0 },
    ];
    expect(determinePurchaseStatus(items)).toBe('PARTIAL');
  });

  it('should return RECEIVED when all received', () => {
    const items = [
      { quantityOrdered: 100, quantityReceived: 100 },
      { quantityOrdered: 50, quantityReceived: 50 },
    ];
    expect(determinePurchaseStatus(items)).toBe('RECEIVED');
  });

  it('should return RECEIVED when over-received', () => {
    const items = [
      { quantityOrdered: 100, quantityReceived: 120 },
      { quantityOrdered: 50, quantityReceived: 50 },
    ];
    expect(determinePurchaseStatus(items)).toBe('RECEIVED');
  });

  it('should handle single item', () => {
    expect(determinePurchaseStatus([
      { quantityOrdered: 100, quantityReceived: 50 },
    ])).toBe('PARTIAL');
  });

  it('should handle empty items array', () => {
    expect(determinePurchaseStatus([])).toBe('DRAFT');
  });
});
