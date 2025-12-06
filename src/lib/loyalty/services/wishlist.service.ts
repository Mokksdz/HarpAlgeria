import { prisma } from "@/lib/prisma";

/**
 * Get all wishlist items for a user
 */
export async function getUserWishlist(userId: string) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          nameFr: true,
          nameAr: true,
          slug: true,
          price: true,
          images: true,
          stock: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      product: item.product,
      addedAt: item.createdAt,
    })),
    count: items.length,
  };
}

/**
 * Toggle a product in user's wishlist (add if not present, remove if present)
 */
export async function toggleWishlist(userId: string, productId: string) {
  const existing = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  });

  if (existing) {
    await prisma.wishlistItem.delete({
      where: { id: existing.id },
    });
    return { added: false, productId };
  } else {
    await prisma.wishlistItem.create({
      data: { userId, productId },
    });
    return { added: true, productId };
  }
}

/**
 * Add a product to wishlist (no toggle, just add if not exists)
 */
export async function addToWishlist(userId: string, productId: string) {
  try {
    await prisma.wishlistItem.create({
      data: { userId, productId },
    });
    return { added: true, productId };
  } catch (e: any) {
    // Already exists (unique constraint)
    if (e.code === "P2002") {
      return { added: false, productId, alreadyExists: true };
    }
    throw e;
  }
}

/**
 * Remove a product from wishlist
 */
export async function removeFromWishlist(userId: string, productId: string) {
  try {
    await prisma.wishlistItem.delete({
      where: {
        userId_productId: { userId, productId },
      },
    });
    return { removed: true, productId };
  } catch (e: any) {
    // Not found
    if (e.code === "P2025") {
      return { removed: false, productId, notFound: true };
    }
    throw e;
  }
}

/**
 * Sync local wishlist items to user account (merge)
 */
export async function syncLocalWishlist(userId: string, productIds: string[]) {
  let addedCount = 0;
  let skippedCount = 0;

  for (const productId of productIds) {
    try {
      await prisma.wishlistItem.create({
        data: { userId, productId },
      });
      addedCount++;
    } catch (e: any) {
      // Already exists or product not found
      skippedCount++;
    }
  }

  return {
    success: true,
    added: addedCount,
    skipped: skippedCount,
    total: productIds.length,
  };
}

/**
 * Check if a product is in user's wishlist
 */
export async function isInWishlist(
  userId: string,
  productId: string,
): Promise<boolean> {
  const item = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  });
  return !!item;
}

/**
 * Get wishlist count for a user
 */
export async function getWishlistCount(userId: string): Promise<number> {
  return prisma.wishlistItem.count({
    where: { userId },
  });
}
