const BLOCKED_PROTOCOLS = ['javascript:', 'data:', 'vbscript:'];

export function sanitizeMarkdownHref(href: string | undefined): string | undefined {
  if (!href) return undefined;

  const trimmed = href.trim();
  if (!trimmed) return undefined;

  const lower = trimmed.toLowerCase();
  if (BLOCKED_PROTOCOLS.some((protocol) => lower.startsWith(protocol))) {
    return undefined;
  }

  if (lower.startsWith('//')) {
    return `https:${trimmed}`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/') || trimmed.startsWith('#') || lower.startsWith('mailto:')) {
    return trimmed;
  }

  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  if (!trimmed.includes(':')) {
    return trimmed;
  }

  return undefined;
}
