import { getGithubRawUrl, isSafeImageFilename, json, streamUpstreamImage } from '../lib/imageProxy';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const raw = req.query?.filename;
  const filename = decodeURIComponent(Array.isArray(raw) ? raw.join('/') : String(raw || ''));

  if (!isSafeImageFilename(filename)) {
    return json(res, 400, { error: 'Invalid image filename' });
  }

  try {
    await streamUpstreamImage(res, getGithubRawUrl(filename));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image proxy request failed';
    return json(res, 502, { error: message });
  }
}
