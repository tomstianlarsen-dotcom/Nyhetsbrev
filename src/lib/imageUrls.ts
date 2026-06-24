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

export function isProxiableImageUrl(src: string | undefined): boolean {
  if (!src || src.startsWith('data:')) return false;
  if (src.includes(`${PROXY_PATH}?`)) return false;
  try {
    return PROXIABLE_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

/** Serve image via app domain so recipients never hit blocked hosts (e.g. GitHub). */
export function toProxyImageUrl(src: string | undefined, origin?: string): string {
  if (!src || !isProxiableImageUrl(src)) return src || '';
  const base = (origin || getPublicAppOrigin()).replace(/\/$/, '');
  return `${base}${PROXY_PATH}?src=${encodeURIComponent(src)}`;
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
