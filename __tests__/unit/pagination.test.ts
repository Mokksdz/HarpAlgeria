/**
 * Tests for pagination utilities
 */
import {
  parsePagination,
  createPaginationMeta,
  paginatedResponse,
} from "@/lib/pagination";

describe("Pagination Utilities", () => {
  describe("parsePagination", () => {
    it("should return defaults when no params provided", () => {
      const params = new URLSearchParams();
      const result = parsePagination(params);

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.skip).toBe(0);
    });

    it("should parse page and pageSize correctly", () => {
      const params = new URLSearchParams({ page: "3", pageSize: "50" });
      const result = parsePagination(params);

      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(50);
      expect(result.skip).toBe(100);
    });

    it("should cap pageSize at maxPageSize", () => {
      const params = new URLSearchParams({ pageSize: "500" });
      const result = parsePagination(params, 20, 100);

      expect(result.pageSize).toBe(100);
    });

    it("should enforce minimum page of 1", () => {
      const params = new URLSearchParams({ page: "-5" });
      const result = parsePagination(params);

      expect(result.page).toBe(1);
    });

    it("should support limit alias for pageSize", () => {
      const params = new URLSearchParams({ limit: "30" });
      const result = parsePagination(params);

      expect(result.pageSize).toBe(30);
    });
  });

  describe("createPaginationMeta", () => {
    it("should calculate totalPages correctly", () => {
      const meta = createPaginationMeta(1, 10, 55);

      expect(meta.totalPages).toBe(6);
      expect(meta.hasNext).toBe(true);
      expect(meta.hasPrev).toBe(false);
    });

    it("should detect last page", () => {
      const meta = createPaginationMeta(6, 10, 55);

      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(true);
    });
  });

  describe("paginatedResponse", () => {
    it("should wrap items with pagination meta", () => {
      const items = [{ id: 1 }, { id: 2 }];
      const response = paginatedResponse(items, 1, 10, 2);

      expect(response.items).toEqual(items);
      expect(response.meta.total).toBe(2);
      expect(response.meta.totalPages).toBe(1);
    });
  });
});
