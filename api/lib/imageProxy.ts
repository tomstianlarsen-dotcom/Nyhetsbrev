const ALLOWED_HOSTS = new Set([
  'raw.githubusercontent.com',
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
]);

export function json(res: any, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export function getGithubRawUrl(filename: string): string {
  const owner = process.env.VITE_GITHUB_OWNER || process.env.GITHUB_OWNER;
  const repo = process.env.VITE_GITHUB_REPO || process.env.GITHUB_REPO;
  const basePath = (process.env.VITE_GITHUB_IMAGES_PATH || 'public/bilder').replace(/^\/+|\/+$/g, '');

  if (!owner || !repo) {
    throw new Error('Missing GitHub configuration on server (VITE_GITHUB_OWNER / VITE_GITHUB_REPO).');
  }

  return `https://raw.githubusercontent.com/${owner}/${repo}/main/${basePath}/${filename}`;
}

export function isSafeImageFilename(filename: string): boolean {
  if (!filename || filename.includes('..')) return false;
  return /^[\w.\-()+]+$/.test(filename);
}

export async function streamUpstreamImage(res: any, upstreamUrl: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(upstreamUrl);
  } catch {
    return json(res, 400, { error: 'Invalid image URL' });
  }

  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) {
    return json(res, 403, { error: 'Image host not allowed' });
  }

  const upstream = await fetch(url.toString(), {
    headers: { 'User-Agent': 'nyhetsbrev-image-proxy/1.0' },
  });

  if (!upstream.ok) {
    return json(res, upstream.status, { error: 'Failed to fetch image from upstream' });
  }

  const contentType = upstream.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await upstream.arrayBuffer());

  res.statusCode = 200;
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  res.end(buffer);
}
