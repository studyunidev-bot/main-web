/**
 * Allow only same-origin relative redirects after auth.
 * Blocks open redirects like //evil.com, https://evil.com, javascript:, etc.
 */
export function safeInternalRedirect(
  raw: string | null | undefined,
  fallback: string
): string {
  if (!raw) return fallback;

  const value = raw.trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("\\")) return fallback;
  // Reject scheme-like prefixes (http:, javascript:, data:)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) return fallback;

  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("//")) return fallback;
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)) return fallback;
    if (decoded.includes("\\")) return fallback;
  } catch {
    return fallback;
  }

  return value;
}
