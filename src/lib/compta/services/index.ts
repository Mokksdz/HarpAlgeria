/**
 * COMPTA Services Index
 *
 * NOTE: Services are being consolidated into /lib/accounting/services/
 * This file re-exports from the canonical location for backward compatibility.
 *
 * @deprecated Use imports from '@/lib/accounting/services' directly
 */

// Re-export from canonical location
export * from "@/lib/accounting/services";

// Legacy service files are kept for compatibility but should migrate to accounting/
// TODO: Remove these files after full migration:
// - charges-service.ts
// - inventory-service.ts
// - models-service.ts
// - production-service.ts
// - purchases-service.ts
