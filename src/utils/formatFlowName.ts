/**
 * Convert a slug like "budget-builder" to a display name like "Budget Builder".
 * Handles edge cases like "ai" → "AI", "api" → "API", etc.
 */
const UPPERCASE_WORDS = new Set(['ai', 'api', 'seo', 'kpi', 'pdt', 'rsi', 'ema', 'b2b', 'ci', 'cd']);

export function formatFlowName(slug: string): string {
  return slug
    .split('-')
    .map(word => {
      const lower = word.toLowerCase();
      if (UPPERCASE_WORDS.has(lower)) return lower.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
