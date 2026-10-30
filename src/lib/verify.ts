// Pure helpers that decide whether a quoted snippet really appears in a source text.
// Used server-side to drop any claim whose receipt cannot be found.

export function normalizeText(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u0060\u00B4]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u00AB\u00BB]/g, '"')
    .replace(/[\u2013\u2014\u2015\u2212]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Strip wrapping quote marks / trailing ellipsis a model often adds around a quote. */
function trimQuoteDecoration(q: string): string {
  return q
    .replace(/^[\s"'.…-]+/, "")
    .replace(/[\s"'…]+$/, "")
    .replace(/\.{3,}$/, "")
    .trim();
}

export const MIN_QUOTE_CHARS = 8;

export function quoteIsInSource(quote: string | undefined | null, source: string): boolean {
  if (!quote) return false;
  const q = quote.trim();
  if (q.length < MIN_QUOTE_CHARS) return false;
  return source.includes(q);
}

export interface Tally {
  checked: number;
  dropped: number;
}

export const emptyTally = (): Tally => ({ checked: 0, dropped: 0 });

/** Keep only items whose quote is found in the source. Counts what was checked and dropped. */
export function filterByQuote<T>(
  items: T[] | undefined | null,
  getQuote: (item: T) => string | undefined | null,
  source: string,
  tally: Tally,
): T[] {
  const out: T[] = [];
  for (const item of items ?? []) {
    tally.checked += 1;
    if (quoteIsInSource(getQuote(item), source)) out.push(item);
    else tally.dropped += 1;
  }
  return out;
}

export function sameUrl(a: string, b: string): boolean {
  const clean = (u: string) => u.trim().replace(/[#?].*$/, "").replace(/\/+$/, "").replace(/^https?:\/\/(www\.)?/i, "").toLowerCase();
  return clean(a) === clean(b);
}
