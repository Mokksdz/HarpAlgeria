import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Products & Collections...");

  // Collections
  const summerCollection = await (prisma as any).collection.create({
    data: {
      slug: "ete-2025",
      nameFr: "Été 2025",
      nameAr: "صيف 2025",
      description: "Nouvelle collection estivale",
      budget: 1000000,
      budgetUsed: 0,
    },
  });

  const winterCollection = await (prisma as any).collection.create({
    data: {
      slug: "hiver-2024",
      nameFr: "Hiver 2024",
      nameAr: "شتاء 2024",
      description: "Collection hivernale cozy",
      budget: 1000000,
      budgetUsed: 0,
    },
  });

  // Products
  const products = [
    {
      slug: "robe-soie-rouge",
      nameFr: "Robe en Soie Rouge",
      nameAr: "فستان حرير أحمر",
      descriptionFr: "Magnifique robe en soie pour les soirées.",
      descriptionAr: "فستان رائع للمناسبات",
      price: 12500,
      images: JSON.stringify(["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80", "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80"]),
      sizes: "S,M,L,XL",
      colors: "Rouge,Noir",
      collectionId: summerCollection.id,
      isActive: true,
      stock: 10,
    },
    {
      slug: "ensemble-lin-beige",
      nameFr: "Ensemble Lin Beige",
      nameAr: "طقم كتان بيج",
      descriptionFr: "Confort et élégance au quotidien.",
      descriptionAr: "راحة وأناقة يومية",
      price: 8900,
      images: JSON.stringify(["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80"]),
      sizes: "S,M,L",
      colors: "Beige,Blanc",
      collectionId: summerCollection.id,
      isActive: true,
      stock: 15,
    },
    {
      slug: "manteau-laine-gris",
      nameFr: "Manteau Laine Gris",
      nameAr: "معطف صوف رمادي",
      descriptionFr: "Chaleur et style pour l'hiver.",
      descriptionAr: "دفء وأناقة للشتاء",
      price: 24000,
      images: JSON.stringify(["https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80"]),
      sizes: "M,L,XL",
      colors: "Gris,Noir",
      collectionId: winterCollection.id,
      isActive: true,
      stock: 5,
    },
     {
      slug: "chemise-satin-bleue",
      nameFr: "Chemise Satin Bleue",
      nameAr: "قميص ساتان أزرق",
      descriptionFr: "Touche de douceur.",
      descriptionAr: "لمسة نعومة",
      price: 5500,
      images: JSON.stringify(["https://images.unsplash.com/photo-1620799140408-ed5341cd2431?w=800&q=80"]),
      sizes: "S,M,L",
      colors: "Bleu,Blanc",
      collectionId: summerCollection.id,
      isActive: true,
      stock: 20,
    },
  ];

  for (const p of products) {
    await (prisma as any).product.create({
      data: p,
    });
  }

  console.log("✅ Products & Collections seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
