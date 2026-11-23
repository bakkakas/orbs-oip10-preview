export const QUOTE_MAX_AGE_MS = 5 * 60 * 1000;
export function parseQuote(payload, now = Date.now()) {
  const q = payload?.orbs;
  if (!q || typeof q.usd !== 'number' || !Number.isFinite(q.usd) || q.usd <= 0 ||
      typeof q.last_updated_at !== 'number' || !Number.isFinite(q.last_updated_at)) throw new Error('invalid quote');
  const updatedAt = q.last_updated_at * 1000;
  if (now - updatedAt > QUOTE_MAX_AGE_MS || updatedAt - now > 60000) throw new Error('stale quote');
  return {price:q.usd, change:typeof q.usd_24h_change === 'number' && Number.isFinite(q.usd_24h_change) ? q.usd_24h_change : null, updatedAt};
}

export const QUOTE_REFRESH_MS = 60000;
export const QUOTE_CACHE_KEY = 'orbs-market-quote-v1';
// A tab's language switches share only a recently fetched, independently validated quote.
export function readQuoteCache(value, now = Date.now()) {
  if (!value || typeof value.receivedAt !== 'number' || !Number.isFinite(value.receivedAt) || value.receivedAt > now || now-value.receivedAt >= QUOTE_REFRESH_MS) return null;
  if (value.failed === true) return {quote:null,retryAt:value.receivedAt+QUOTE_REFRESH_MS};
  try { return {quote:parseQuote(value.payload,now),retryAt:value.receivedAt+QUOTE_REFRESH_MS}; }
  catch { return null; }
}
