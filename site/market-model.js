export const QUOTE_MAX_AGE_MS = 5 * 60 * 1000;
export function parseQuote(payload, now = Date.now()) {
  const q = payload?.orbs;
  if (!q || typeof q.usd !== 'number' || !Number.isFinite(q.usd) || q.usd <= 0 ||
      typeof q.last_updated_at !== 'number' || !Number.isFinite(q.last_updated_at)) throw new Error('invalid quote');
  const updatedAt = q.last_updated_at * 1000;
  if (now - updatedAt > QUOTE_MAX_AGE_MS || updatedAt - now > 60000) throw new Error('stale quote');
  return {price:q.usd, change:typeof q.usd_24h_change === 'number' && Number.isFinite(q.usd_24h_change) ? q.usd_24h_change : null, updatedAt};
}
