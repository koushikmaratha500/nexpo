import { z } from 'zod';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type PaginationQueryDto = z.infer<typeof paginationQuerySchema>;

export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults?: { pageSize?: number },
): PaginationQueryDto {
  const pageSizeDefault = defaults?.pageSize ?? DEFAULT_PAGE_SIZE;
  const pageRaw = parseInt(searchParams.get('page') || String(DEFAULT_PAGE), 10);
  const pageSizeRaw = parseInt(searchParams.get('pageSize') || String(pageSizeDefault), 10);
  const page = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : DEFAULT_PAGE);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.isFinite(pageSizeRaw) ? pageSizeRaw : pageSizeDefault),
  );

  return { page, pageSize };
}
