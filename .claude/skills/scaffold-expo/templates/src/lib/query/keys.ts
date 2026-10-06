/**
 * Central query-key factory so invalidation and persistence stay consistent.
 * Prefix keys by domain so `invalidateQueries({ queryKey: ['items'] })` hits all item queries.
 * Sort arrays inside keys so the same set in a different order shares a cache entry.
 */
export const queryKeys = {
  me: () => ['me'] as const,
  items: (filter: string) => ['items', 'list', filter] as const,
  item: (id: string) => ['items', 'detail', id] as const,
  itemsByIds: (ids: string[]) => ['items', 'by-ids', [...ids].sort().join(',')] as const,
  search: (query: string) => ['search', query] as const,
};
