import { prisma } from "@/lib/prisma";

export async function computeCostPerUnit(modelId: string) {
  // placeholder — detailed implementation in Sprint 1
  const model = await prisma.model.findUnique({
    where: { id: modelId },
    include: {
      bom: { include: { inventoryItem: true } },
      charges: true,
    },
  });
  if (!model) throw new Error("Model not found");
  return { breakdown: {}, totalCost: 0, suggestedPrices: {} };
}
