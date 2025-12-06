/**
 * Accounting Helpers - HARP Comptabilité V3
 * Core calculation functions for inventory valuation
 */

/**
 * Calculate Weighted Average Cost (CUMP - Coût Unitaire Moyen Pondéré)
 *
 * Formula: newCUMP = (oldQty × oldAvg + recvQty × recvUnitPrice) / (oldQty + recvQty)
 *
 * @param oldQty - Current quantity in stock
 * @param oldAvgCost - Current average cost per unit
 * @param receivedQty - Quantity being received
 * @param receivedUnitPrice - Unit price of received goods
 * @returns New weighted average cost
 *
 * @example
 * // Stock: 100 units @ 500 DZD, receiving 50 units @ 600 DZD
 * calculateCUMP(100, 500, 50, 600) // Returns 533.33
 */
export function calculateCUMP(
  oldQty: number,
  oldAvgCost: number,
  receivedQty: number,
  receivedUnitPrice: number,
): number {
  const newQty = oldQty + receivedQty;

  // If no stock after operation, return the received unit price
  if (newQty === 0) {
    return receivedUnitPrice;
  }

  // If receiving nothing, return existing average
  if (receivedQty === 0) {
    return oldAvgCost;
  }

  // Standard CUMP formula
  const oldValue = oldQty * oldAvgCost;
  const receivedValue = receivedQty * receivedUnitPrice;
  const newCUMP = (oldValue + receivedValue) / newQty;

  // Round to 2 decimal places for currency precision
  return Math.round(newCUMP * 100) / 100;
}

/**
 * Calculate total stock value
 *
 * @param quantity - Stock quantity
 * @param averageCost - Average cost per unit
 * @returns Total value (quantity × averageCost)
 */
export function calculateTotalValue(
  quantity: number,
  averageCost: number,
): number {
  return Math.round(quantity * averageCost * 100) / 100;
}

/**
 * Calculate remaining quantity to receive
 *
 * @param ordered - Quantity originally ordered
 * @param received - Quantity already received
 * @returns Remaining quantity
 */
export function calculateRemainingQty(
  ordered: number,
  received: number,
): number {
  return Math.max(0, ordered - received);
}

/**
 * Determine purchase status based on received quantities
 *
 * @param items - Array of { quantityOrdered, quantityReceived }
 * @returns Purchase status: DRAFT, PARTIAL, or RECEIVED
 */
export function determinePurchaseStatus(
  items: Array<{
    quantityOrdered: number | { toNumber?(): number };
    quantityReceived: number | { toNumber?(): number };
  }>,
): "DRAFT" | "PARTIAL" | "RECEIVED" {
  const totalOrdered = items.reduce(
    (sum, item) => sum + Number(item.quantityOrdered),
    0,
  );
  const totalReceived = items.reduce(
    (sum, item) => sum + Number(item.quantityReceived),
    0,
  );

  if (totalReceived === 0) {
    return "DRAFT";
  }

  if (totalReceived >= totalOrdered) {
    return "RECEIVED";
  }

  return "PARTIAL";
}

/**
 * Format currency value (DZD)
 *
 * @param value - Numeric value
 * @returns Formatted string with DZD symbol
 */
export function formatDZD(value: number): string {
  return (
    new Intl.NumberFormat("fr-DZ", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + " DZD"
  );
}

/**
 * Validate that a quantity doesn't exceed limit
 *
 * @param quantity - Quantity to validate
 * @param limit - Maximum allowed
 * @param fieldName - Field name for error message
 * @throws Error if quantity exceeds limit
 */
export function validateQuantityLimit(
  quantity: number,
  limit: number,
  fieldName: string = "Quantité",
): void {
  if (quantity > limit) {
    throw new Error(
      `${fieldName} (${quantity}) dépasse le maximum autorisé (${limit})`,
    );
  }
}
