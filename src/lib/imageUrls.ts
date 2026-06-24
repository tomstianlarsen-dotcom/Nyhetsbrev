const PROXY_PATH = '/api/image';

const PROXIABLE_HOSTS = new Set([
  'raw.githubusercontent.com',
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
]);

/** Production URL for image proxy links in email and public preview. */
export function getPublicAppOrigin(): string {
  const configured = import.meta.env.VITE_APP_URL?.replace(/\/$/, '');
  if (configured) return configured;
  if (typeof window !== 'undefined') {
    return window.location.origin.replace('-dev-', '-pre-');
  }
  return 'https://nyhetsbrev-phi.vercel.app';
}

/** Extract filename from a GitHub raw or github.io image URL. */
export function extractGithubImageFilename(src: string): string | null {
  try {
    const url = new URL(src);
    const isRaw = url.hostname === 'raw.githubusercontent.com';
    const isPages = url.hostname.endsWith('.github.io');
    if (!isRaw && !isPages) return null;

    const segments = url.pathname.split('/').filter(Boolean);
    const bilderIdx = segments.indexOf('bilder');
    if (bilderIdx >= 0 && bilderIdx < segments.length - 1) {
      return decodeURIComponent(segments[bilderIdx + 1]);
    }

    const last = segments[segments.length - 1];
    return last ? decodeURIComponent(last) : null;
  } catch {
    return null;
  }
}

export function isCleanProxyImageUrl(src: string): boolean {
  try {
    const url = new URL(src, getPublicAppOrigin());
    return url.pathname.startsWith(`${PROXY_PATH}/`) && !url.search;
  } catch {
    return src.includes(`${PROXY_PATH}/`) && !src.includes('?');
  }
}

export function isProxiableImageUrl(src: string | undefined): boolean {
  if (!src || src.startsWith('data:')) return false;
  if (isCleanProxyImageUrl(src)) return false;
  if (src.includes(`${PROXY_PATH}?`)) return false;
  try {
    return PROXIABLE_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

/** Serve image via app domain — clean path for GitHub files, no github URL in link. */
export function toProxyImageUrl(src: string | undefined, origin?: string): string {
  if (!src) return '';

  if (isCleanProxyImageUrl(src)) return src;

  const base = (origin || getPublicAppOrigin()).replace(/\/$/, '');

  // Upgrade old ?src= proxy links
  if (src.includes(`${PROXY_PATH}?src=`)) {
    try {
      const url = new URL(src, base);
      const inner = url.searchParams.get('src');
      if (inner) return toProxyImageUrl(inner, origin);
    } catch {
      // fall through
    }
  }

  const filename = extractGithubImageFilename(src);
  if (filename && /^[\w.\-()+]+$/.test(filename)) {
    return `${base}${PROXY_PATH}/${encodeURIComponent(filename)}`;
  }

  if (isProxiableImageUrl(src)) {
    return `${base}${PROXY_PATH}?src=${encodeURIComponent(src)}`;
  }

  return src;
}

export function rewriteImageUrlsInElement(root: HTMLElement, origin?: string): void {
  const o = origin || getPublicAppOrigin();
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (!src) return;
    const proxy = toProxyImageUrl(src, o);
    if (proxy !== src) img.setAttribute('src', proxy);
  });
}
