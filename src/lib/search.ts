/**
 * PostgREST `or=` filters use commas, parentheses and braces as syntax, so
 * those characters have to be stripped from user input before interpolation.
 */
export function sanitizeTerm(term: string): string {
  return term
    .trim()
    .replace(/[(),{}*\\"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** `%` and `_` are ilike wildcards; escape them so they match literally. */
export function toIlikePattern(term: string): string {
  return `%${sanitizeTerm(term).replace(/[%_]/g, (m) => `\\${m}`)}%`;
}
