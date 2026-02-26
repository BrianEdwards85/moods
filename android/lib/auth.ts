/**
 * JWT token inspection utilities.
 * Only decodes the payload — does NOT verify signatures.
 */

function decodeTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // React-Native compatible base64 decode via atob polyfill
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeTokenPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return payload.exp * 1000 < Date.now();
}

export function needsRefresh(token: string): boolean {
  const payload = decodeTokenPayload(token);
  if (!payload || typeof payload.refresh_after !== 'number') return false;
  return payload.refresh_after * 1000 < Date.now();
}
