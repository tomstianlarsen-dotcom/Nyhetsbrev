import { json, streamUpstreamImage } from './lib/imageProxy';

/** Legacy: /api/image?src=https://... — prefer /api/image/{filename} for GitHub images. */
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const src = typeof req.query?.src === 'string' ? req.query.src.trim() : '';
  if (!src) {
    return json(res, 400, { error: 'Missing src query parameter' });
  }

  try {
    await streamUpstreamImage(res, src);
  } catch {
    return json(res, 502, { error: 'Image proxy request failed' });
  }
}
