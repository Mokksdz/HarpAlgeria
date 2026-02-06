/**
 * Determine the active price for a product, considering promotional pricing and date ranges.
 */
export function getActivePrice(product: {
  price: number;
  promoPrice?: number | null;
  promoStart?: string | Date | null;
  promoEnd?: string | Date | null;
}): { price: number; originalPrice: number | null; isPromo: boolean } {
  if (!product.promoPrice) {
    return { price: product.price, originalPrice: null, isPromo: false };
  }

  const now = new Date();

  if (product.promoStart && new Date(product.promoStart) > now) {
    return { price: product.price, originalPrice: null, isPromo: false };
  }

  if (product.promoEnd && new Date(product.promoEnd) < now) {
    return { price: product.price, originalPrice: null, isPromo: false };
  }

  return {
    price: Number(product.promoPrice),
    originalPrice: product.price,
    isPromo: true,
  };
}
