export const TOKEN_REFRESH_SKEW_MS = 5 * 60_000;

export function tokenNeedsRefresh(savedAtIso, expiresInSec, now) {
  if (!savedAtIso || !expiresInSec) return true;
  const expiresAt = new Date(savedAtIso).getTime() + expiresInSec * 1000;
  return !Number.isFinite(expiresAt) || expiresAt - now.getTime() <= TOKEN_REFRESH_SKEW_MS;
}

export function isPlanLimitError(text) {
  return ['subscription_sharing_usage_limit_exceeded', 'subscription_sharing_usage_unavailable']
    .some(code => String(text).includes(code));
}
