/** Max base64 length sent to GitHub upload API (~675 KB decoded). */
export const MAX_UPLOAD_BASE64_CHARS = 900_000;

export type CompressedImage = {
  contentBase64: string;
  contentType: string;
  compressedSize: number;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToJpegBase64(canvas: HTMLCanvasElement, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Kunne ikke komprimere bildet.'));
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.split(',')[1] || '');
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      },
      'image/jpeg',
      quality
    );
  });
}

function drawScaled(img: HTMLImageElement, maxWidth: number): HTMLCanvasElement {
  const scale = Math.min(1, maxWidth / img.width);
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Kunne ikke lage canvas-context.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

/**
 * Resize and compress to JPEG for GitHub upload.
 * Always outputs JPEG — PNG attempts were slow and often exceeded size limits for photos.
 */
function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
}

export async function compressImageForUpload(
  file: File,
  onProgress?: (message: string) => void,
  signal?: AbortSignal
): Promise<CompressedImage> {
  onProgress?.('Leser bilde…');
  throwIfAborted(signal);
  const sourceDataUrl = await readFileAsDataUrl(file);
  throwIfAborted(signal);
  const img = await loadImage(sourceDataUrl);

  onProgress?.('Komprimerer bilde…');

  const maxWidths = [1200, 1000, 800, 600];
  const qualities = [0.85, 0.75, 0.65, 0.55];

  for (const maxW of maxWidths) {
    throwIfAborted(signal);
    const canvas = drawScaled(img, maxW);
    for (const q of qualities) {
      throwIfAborted(signal);
      const b64 = await canvasToJpegBase64(canvas, q);
      if (b64.length <= MAX_UPLOAD_BASE64_CHARS) {
        return {
          contentBase64: b64,
          contentType: 'image/jpeg',
          compressedSize: b64.length,
        };
      }
    }
  }

  throw new Error(
    'Bildet er for stort etter komprimering. Prøv et mindre bilde (under 2000 px bredde).'
  );
}

export function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 90_000, signal, ...rest } = init;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  return fetch(input, { ...rest, signal: controller.signal }).finally(() => {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onAbort);
  });
}
