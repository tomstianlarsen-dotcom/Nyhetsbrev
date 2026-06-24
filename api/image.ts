const ALLOWED_HOSTS = new Set([
  'raw.githubusercontent.com',
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
]);

function json(res: any, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

/** Legacy: /api/image?src=https://... */
export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return json(res, 405, { error: 'Method not allowed' });
    }

    const src = typeof req.query?.src === 'string' ? req.query.src.trim() : '';
    if (!src) {
      return json(res, 400, { error: 'Missing src query parameter' });
    }

    let url: URL;
    try {
      url = new URL(src);
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
  } catch (err) {
    console.error('image handler error:', err);
    return json(res, 500, {
      error: err instanceof Error ? err.message : 'Image proxy request failed',
    });
  }
}
