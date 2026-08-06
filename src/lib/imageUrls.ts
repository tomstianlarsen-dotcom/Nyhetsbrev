const PROXY_PATH = '/api/image';

const PROXIABLE_HOSTS = new Set([
  'raw.githubusercontent.com',
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
]);

/** Production URL for image links in copied email HTML. */
export function getPublicAppOrigin(): string {
  const configured = import.meta.env.VITE_APP_URL?.replace(/\/$/, '');
  if (configured) return configured;
  if (typeof window !== 'undefined') {
    return window.location.origin.replace('-dev-', '-pre-');
  }
  return 'https://nyhetsbrev-phi.vercel.app';
}

/** Current deployment origin — use for in-app preview (avoids cross-origin ORB on Vercel preview). */
export function getBrowserImageOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/\/$/, '').replace('-dev-', '-pre-');
  }
  return getPublicAppOrigin();
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

/** Extract filename from /api/image/{filename} (any origin). */
export function extractProxyImageFilename(src: string): string | null {
  try {
    const url = new URL(src, 'https://local');
    if (!url.pathname.startsWith(`${PROXY_PATH}/`)) return null;
    const name = url.pathname.slice(`${PROXY_PATH}/`.length).split('/')[0];
    return name ? decodeURIComponent(name) : null;
  } catch {
    const match = src.match(/\/api\/image\/([^?]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
}

export function isCleanProxyImageUrl(src: string): boolean {
  return extractProxyImageFilename(src) !== null && !src.includes(`${PROXY_PATH}?`);
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

/**
 * Serve image via app domain.
 * Defaults to current browser origin (preview + prod each use own /api/image).
 * Pass getPublicAppOrigin() explicitly when building email HTML.
 */
export function toProxyImageUrl(src: string | undefined, origin?: string): string {
  if (!src) return '';

  const base = (origin ?? getBrowserImageOrigin()).replace(/\/$/, '');

  const proxyFilename = extractProxyImageFilename(src);
  if (proxyFilename && /^[\w.\-()+]+$/.test(proxyFilename)) {
    return `${base}${PROXY_PATH}/${encodeURIComponent(proxyFilename)}`;
  }

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
  const o = origin ?? getPublicAppOrigin();
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (!src) return;
    const proxy = toProxyImageUrl(src, o);
    if (proxy !== src) img.setAttribute('src', proxy);
  });
}
