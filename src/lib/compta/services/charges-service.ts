import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function createCharge(data: Prisma.ChargeCreateInput) {
  return prisma.charge.create({ data });
}
