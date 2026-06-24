const ALLOWED_HOSTS = new Set([
  'raw.githubusercontent.com',
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
]);

const DEFAULT_OWNER = 'tomstianlarsen-dotcom';
const DEFAULT_REPO = 'Nyhetsbrev';
const DEFAULT_BASE_PATH = 'public/bilder';

function json(res: any, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function getGithubRawUrl(filename: string): string {
  const owner = process.env.VITE_GITHUB_OWNER || process.env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = process.env.VITE_GITHUB_REPO || process.env.GITHUB_REPO || DEFAULT_REPO;
  const basePath = (
    process.env.VITE_GITHUB_IMAGES_PATH ||
    process.env.GITHUB_IMAGES_PATH ||
    DEFAULT_BASE_PATH
  ).replace(/^\/+|\/+$/g, '');

  return `https://raw.githubusercontent.com/${owner}/${repo}/main/${basePath}/${filename}`;
}

function isSafeImageFilename(filename: string): boolean {
  if (!filename || filename.includes('..')) return false;
  return /^[\w.\-()+]+$/.test(filename);
}

async function streamUpstreamImage(res: any, upstreamUrl: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(upstreamUrl);
  } catch {
    json(res, 400, { error: 'Invalid image URL' });
    return;
  }

  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) {
    json(res, 403, { error: 'Image host not allowed' });
    return;
  }

  const upstream = await fetch(url.toString(), {
    headers: { 'User-Agent': 'nyhetsbrev-image-proxy/1.0' },
  });

  if (!upstream.ok) {
    json(res, upstream.status, { error: 'Failed to fetch image from upstream' });
    return;
  }

  const contentType = upstream.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await upstream.arrayBuffer());

  res.statusCode = 200;
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  res.end(buffer);
}

/** Clean URLs: /api/image/{filename} (via vercel.json rewrite) */
export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return json(res, 405, { error: 'Method not allowed' });
    }

    const raw = req.query?.filename;
    const filename = decodeURIComponent(Array.isArray(raw) ? raw.join('/') : String(raw || ''));

    if (!isSafeImageFilename(filename)) {
      return json(res, 400, { error: 'Invalid image filename' });
    }

    await streamUpstreamImage(res, getGithubRawUrl(filename));
  } catch (err) {
    console.error('image-file handler error:', err);
    return json(res, 500, {
      error: err instanceof Error ? err.message : 'Image proxy request failed',
    });
  }
}
