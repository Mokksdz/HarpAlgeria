import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const LOYALTY_RULES = {
  POINTS_PER_DZD: 1,
  SIGNUP_BONUS: 100,
  WHATSAPP_SHARE_BONUS: 20,
  ABANDONED_CART_RECOVERY_BONUS: 200,
  NEWSLETTER_SIGNUP_BONUS: 50,
  REVIEW_WITH_PHOTO_BONUS: 150,
  BIRTHDAY_BONUS: 5000, // Points anniversaire
  WISHLIST_ADD_BONUS: 10,
  WISHLIST_PURCHASE_BONUS: 50,
};

export const VIP_LEVELS = {
  SILVER: { threshold: 0, multiplier: 1, benefits: ["Accès standard"] },
  GOLD: { threshold: 50000, multiplier: 1.2, benefits: ["Livraison gratuite > 5000 DA", "Accès ventes privées"] },
  BLACK: { threshold: 150000, multiplier: 1.5, benefits: ["Livraison gratuite sans minimum", "Service conciergerie", "Cadeau surprise"] },
};

export type LoyaltyAction = 
  | "PURCHASE" 
  | "SIGNUP" 
  | "BIRTHDAY" 
  | "REFERRAL" 
  | "REVIEW" 
  | "ABANDONED_CART_RECOVERY"
  | "NEWSLETTER"
  | "WHATSAPP_SHARE"
  | "WISHLIST_ADD"
  | "WISHLIST_PURCHASE";

/**
 * Calculate VIP level based on total lifetime points
 */
export function calculateVipLevel(totalPoints: number): "SILVER" | "GOLD" | "BLACK" {
  if (totalPoints >= VIP_LEVELS.BLACK.threshold) return "BLACK";
  if (totalPoints >= VIP_LEVELS.GOLD.threshold) return "GOLD";
  return "SILVER";
}

/**
 * Add loyalty points to a user
 */
export async function earnPoints(
  userId: string, 
  amount: number, 
  reason: LoyaltyAction, 
  referenceId?: string
) {
  // Check for idempotency first to avoid transaction overhead if already processed
  if (referenceId) {
    const existing = await prisma.loyaltyPoint.findUnique({
      where: { referenceId }
    });
    if (existing) {
      console.log(`[Loyalty] Skipped duplicate event: ${referenceId}`);
      return existing;
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Create point record
      const pointRecord = await tx.loyaltyPoint.create({
        data: {
          userId,
          amount,
          reason,
          referenceId
        }
      });

      // 2. Update user balance and calculate new VIP level
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");

      // Calculate lifetime points
      const newBalance = (user.loyaltyPoints || 0) + amount;
      
      // Re-evaluate VIP level based on historical points
      const history = await tx.loyaltyPoint.aggregate({
        where: { userId, amount: { gt: 0 } },
        _sum: { amount: true }
      });
      
      // Note: aggregated sum includes the point we just created inside this transaction context
      const totalLifetimePoints = (history._sum.amount || 0); 
      const newVipLevel = calculateVipLevel(totalLifetimePoints);

      await tx.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: newBalance,
          vipLevel: newVipLevel
        }
      });

      return pointRecord;
    });
  } catch (error: any) {
    // Handle race condition where simultaneous requests pass the initial check
    if (error.code === 'P2002') {
       console.log(`[Loyalty] Race condition duplicate caught: ${referenceId}`);
       const existing = await prisma.loyaltyPoint.findUnique({ where: { referenceId } });
       return existing;
    }
    throw error;
  }
}

/**
 * Get user loyalty summary
 */
export async function getLoyaltySummary(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      loyaltyPoints: true, 
      vipLevel: true,
      pointHistory: {
        orderBy: { createdAt: 'desc' },
        take: 20
      }
    }
  });

  if (!user) throw new Error("User not found");
  
  // Calculate progress to next level
  let nextLevel = null;
  let progress = 0;
  
  // Need total lifetime points for accurate progress
  const history = await prisma.loyaltyPoint.aggregate({
      where: { userId, amount: { gt: 0 } },
      _sum: { amount: true }
  });
  const totalLifetimePoints = history._sum.amount || 0;

  if (user.vipLevel === "SILVER") {
    nextLevel = { name: "GOLD", threshold: VIP_LEVELS.GOLD.threshold };
    progress = Math.min(100, (totalLifetimePoints / VIP_LEVELS.GOLD.threshold) * 100);
  } else if (user.vipLevel === "GOLD") {
    nextLevel = { name: "BLACK", threshold: VIP_LEVELS.BLACK.threshold };
    progress = Math.min(100, (totalLifetimePoints / VIP_LEVELS.BLACK.threshold) * 100);
  }

  return {
    balance: user.loyaltyPoints,
    vipLevel: user.vipLevel,
    benefits: VIP_LEVELS[user.vipLevel as keyof typeof VIP_LEVELS].benefits,
    nextLevel,
    progress,
    history: user.pointHistory
  };
}

/**
 * Redeem points for a reward
 */
export async function redeemReward(userId: string, rewardId: string) {
  return prisma.$transaction(async (tx) => {
    const reward = await tx.loyaltyReward.findUnique({ where: { id: rewardId } });
    if (!reward) throw new Error("Reward not found");
    if (!reward.isActive) throw new Error("Reward is inactive");

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    if (user.loyaltyPoints < reward.cost) {
      throw new Error("Insufficient points");
    }

    // Deduct points
    await tx.user.update({
      where: { id: userId },
      data: { loyaltyPoints: { decrement: reward.cost } }
    });

    // Record transaction
    await tx.loyaltyPoint.create({
      data: {
        userId,
        amount: -reward.cost,
        reason: "REWARD_REDEMPTION",
        referenceId: rewardId
      }
    });

    return { success: true, reward };
  });
}

/**
 * Grant birthday points to a specific user
 */
export async function grantBirthdayPointsToUser(userId: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user || !user.birthDate) {
      throw new Error("User not found or no birth date");
    }

    const dob = new Date(user.birthDate);
    const today = new Date();
    
    // Check if today is user's birthday (compare month & day)
    if (dob.getUTCDate() !== today.getUTCDate() || dob.getUTCMonth() !== today.getUTCMonth()) {
      throw new Error("Aujourd'hui n'est pas l'anniversaire de l'utilisateur");
    }

    const currentYear = today.getUTCFullYear();
    if ((user.lastBirthdayGrantYear ?? 0) >= currentYear) {
      throw new Error("Points déjà attribués cette année");
    }

    // 1) Create loyalty point record
    const pointRecord = await tx.loyaltyPoint.create({
      data: {
        userId: user.id,
        amount: LOYALTY_RULES.BIRTHDAY_BONUS,
        reason: "BIRTHDAY",
        referenceId: `birthday-${currentYear}`
      }
    });

    // 2) Update user balance and lastBirthdayGrantYear
    await tx.user.update({
      where: { id: user.id },
      data: {
        loyaltyPoints: { increment: LOYALTY_RULES.BIRTHDAY_BONUS },
        lastBirthdayGrantYear: currentYear
      }
    });

    return { success: true, txId: pointRecord.id, points: LOYALTY_RULES.BIRTHDAY_BONUS };
  });
}

/**
 * Run daily birthday grant for all eligible users
 */
export async function runDailyBirthdayGrant() {
  const today = new Date();
  const month = today.getUTCMonth();
  const day = today.getUTCDate();
  const currentYear = today.getUTCFullYear();

  // Get all users with birthDate set
  const users = await prisma.user.findMany({
    where: {
      birthDate: { not: null }
    },
    select: {
      id: true,
      email: true,
      name: true,
      birthDate: true,
      lastBirthdayGrantYear: true
    }
  });

  // Filter users whose birthday is today and haven't received points this year
  const candidates = users.filter(u => {
    if (!u.birthDate) return false;
    const d = new Date(u.birthDate);
    return d.getUTCMonth() === month && 
           d.getUTCDate() === day && 
           (u.lastBirthdayGrantYear ?? 0) < currentYear;
  });

  const results = [];
  for (const u of candidates) {
    try {
      await grantBirthdayPointsToUser(u.id);
      results.push({ email: u.email, success: true });
      console.log(`[Birthday] Granted ${LOYALTY_RULES.BIRTHDAY_BONUS} points to ${u.email}`);
    } catch (err: any) {
      results.push({ email: u.email, success: false, error: err.message });
      console.error(`[Birthday] Failed for ${u.email}:`, err.message);
    }
  }

  return { processed: candidates.length, results };
}
