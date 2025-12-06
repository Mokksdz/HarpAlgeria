import { z } from "zod";

export const clientsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  vipLevel: z
    .enum(["ALL", "SILVER", "GOLD", "BLACK"])
    .optional()
    .default("ALL"),
  sortBy: z
    .enum(["createdAt", "email", "loyaltyPoints"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const clientExportSchema = z.object({
  format: z.enum(["json", "csv"]).optional().default("csv"),
  vipLevel: z
    .enum(["ALL", "SILVER", "GOLD", "BLACK"])
    .optional()
    .default("ALL"),
  search: z.string().optional(),
});

export type ClientsQuery = z.infer<typeof clientsQuerySchema>;
export type ClientExportQuery = z.infer<typeof clientExportSchema>;
