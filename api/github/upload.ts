export const config = {
  api: {
    bodyParser: { sizeLimit: '8mb' },
  },
};

type UploadBody = {
  filename: string;
  contentBase64: string;
  contentType?: string;
  basePath?: string;
};

function json(res: any, status: number, body: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const token = process.env.VITE_GITHUB_TOKEN;
  const owner = process.env.VITE_GITHUB_OWNER;
  const repo = process.env.VITE_GITHUB_REPO;

  if (!token || !owner || !repo) {
    return json(res, 500, {
      error:
        'Missing GitHub configuration. Set VITE_GITHUB_TOKEN, VITE_GITHUB_OWNER, VITE_GITHUB_REPO in Vercel environment variables.',
      missing: {
        VITE_GITHUB_TOKEN: !token,
        VITE_GITHUB_OWNER: !owner,
        VITE_GITHUB_REPO: !repo,
      },
    });
  }

  let body: UploadBody;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return json(res, 400, { error: 'Invalid JSON body' });
  }

  const filename = (body?.filename || '').trim();
  const contentBase64 = (body?.contentBase64 || '').trim();
  const basePath = (body?.basePath || 'public/bilder').replace(/^\/+|\/+$/g, '');

  if (!filename || !contentBase64) {
    return json(res, 400, { error: 'filename and contentBase64 are required' });
  }

  // basic hardening
  if (contentBase64.length > 1_200_000) {
    return json(res, 413, { error: 'Payload too large' });
  }

  const safeName = filename.replace(/[^\w.\-()+]/g, '-');
  const path = `${basePath}/${Date.now()}-${safeName}`.replace(/\/+/g, '/');

  const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'nyhetsbrev-vercel-upload',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      message: `Add newsletter image: ${safeName}`,
      content: contentBase64,
    }),
  });

  if (!ghRes.ok) {
    let details: any = undefined;
    try {
      details = await ghRes.json();
    } catch {
      // ignore
    }
    const msg = details?.message || ghRes.statusText || 'GitHub upload failed';
    return json(res, ghRes.status, { error: msg, details });
  }

  const githubUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;
  return json(res, 200, { url: githubUrl, githubPath: path });
}

