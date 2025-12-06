/**
 * Pagination helper utilities for API routes
 */

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Parse pagination parameters from URL search params
 * @param params - URLSearchParams from request
 * @param defaultPageSize - Default page size (default: 20)
 * @param maxPageSize - Maximum allowed page size (default: 100)
 */
export function parsePagination(
  params: URLSearchParams,
  defaultPageSize: number = 20,
  maxPageSize: number = 100
): PaginationParams {
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const requestedPageSize = Number(params.get("pageSize") ?? params.get("limit") ?? defaultPageSize);
  const pageSize = Math.min(maxPageSize, Math.max(1, requestedPageSize));
  const skip = (page - 1) * pageSize;
  
  return { page, pageSize, skip };
}

/**
 * Create pagination metadata for response
 */
export function createPaginationMeta(
  page: number,
  pageSize: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Create paginated response object
 */
export function paginatedResponse<T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number
) {
  return {
    items,
    meta: createPaginationMeta(page, pageSize, total),
  };
}
