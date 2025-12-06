import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Loyalty Rewards...");

  const rewards = [
    {
      nameFr: "Livraison Gratuite",
      nameAr: "توصيل مجاني",
      descriptionFr: "Livraison offerte pour votre prochaine commande (max 1000 DA de frais)",
      descriptionAr: "توصيل مجاني لطلبك القادم (بحد أقصى 1000 دج)",
      cost: 5000,
      type: "FREE_SHIPPING",
      value: 1000,
    },
    {
      nameFr: "Réduction 5%",
      nameAr: "تخفيض 5%",
      descriptionFr: "5% de réduction sur tout le panier",
      descriptionAr: "تخفيض 5% على كامل السلة",
      cost: 10000,
      type: "DISCOUNT_PERCENT",
      value: 5,
    },
    {
      nameFr: "Bon d'achat 2000 DA",
      nameAr: "قسيمة شراء 2000 دج",
      descriptionFr: "2000 DA déduits de votre commande",
      descriptionAr: "2000 دج خصم من طلبك",
      cost: 20000,
      type: "DISCOUNT_FIXED",
      value: 2000,
    },
    {
      nameFr: "Cadeau Surprise",
      nameAr: "هدية مفاجأة",
      descriptionFr: "Un accessoire offert avec votre commande",
      descriptionAr: "إكسسوار مجاني مع طلبك",
      cost: 15000,
      type: "FREE_PRODUCT",
    },
  ];

  for (const r of rewards) {
    await (prisma as any).loyaltyReward.create({
      data: r,
    });
  }

  console.log("✅ Rewards seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
