import Jimp from 'jimp';
import exifr from 'exifr';
import type { ImageMetrics, ImageScene } from './types';

/**
 * Local image forensics — brightness, contrast, Laplacian sharpness,
 * colorfulness, perceptual dHash and EXIF extraction. Fully offline.
 */

function toGrayscale(buf: Jimp): number[] {
  const { data, width, height } = buf.bitmap;
  const out = new Array<number>(width * height);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    out[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
  }
  return out;
}

function laplacianVariance(gray: number[], width: number, height: number): number {
  const vals: number[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap =
        gray[i - 1] + gray[i + 1] + gray[i - width] + gray[i + width] - 4 * gray[i];
      vals.push(lap);
    }
  }
  if (vals.length === 0) return 0;
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
  return variance;
}

function colorfulness(buf: Jimp): number {
  const { data, width, height } = buf.bitmap;
  let rgMean = 0, rgVar = 0, ybMean = 0, ybVar = 0;
  const n = width * height;
  const rgArr: number[] = [];
  const ybArr: number[] = [];
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const r = data[o], g = data[o + 1], b = data[o + 2];
    const rg = r - g;
    const yb = 0.5 * (r + g) - b;
    rgArr.push(rg);
    ybArr.push(yb);
    rgMean += rg;
    ybMean += yb;
  }
  rgMean /= n;
  ybMean /= n;
  for (let i = 0; i < n; i++) {
    rgVar += (rgArr[i] - rgMean) ** 2;
    ybVar += (ybArr[i] - ybMean) ** 2;
  }
  rgVar /= n;
  ybVar /= n;
  const std = Math.sqrt(rgVar + ybVar);
  const mean = Math.sqrt(rgMean ** 2 + ybMean ** 2);
  // Hasler-Süsstrunk metric, normalized roughly to 0..100
  return Math.min(100, Math.round(Math.sqrt(std ** 2 + mean ** 2) * 0.6));
}

export function dHash(gray: number[], width: number, height: number): string {
  // Resize-free approach: sample an 9x8 grid via nearest neighbor
  const bits: number[] = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const sy = Math.floor((y * (height - 1)) / 7);
      const sx = Math.floor((x * (width - 1)) / 7);
      const ny = Math.floor((y * (height - 1)) / 7);
      const nx = Math.floor(((x + 1) * (width - 1)) / 7);
      const a = gray[sy * width + sx];
      const b = gray[ny * width + nx];
      bits.push(a > b ? 1 : 0);
    }
  }
  let hex = '';
  for (let i = 0; i < 64; i += 4) {
    const nibble = (bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3];
    hex += nibble.toString(16);
  }
  return hex;
}

/**
 * Scene classification from raw pixel statistics — used when a report has
 * media but no text yet, so the engine can still draft a category.
 * e.g. strong warm/orange dominance suggests fire; blue dominance suggests
 * water/flooding; flat UI-like colors with no camera EXIF suggest a
 * screenshot (scam/chat evidence).
 */
function analyzeScene(img: Jimp, brightness: number, hasCameraExif: boolean): ImageScene {
  const { data } = img.bitmap;
  const n = img.bitmap.width * img.bitmap.height;
  let warm = 0, cool = 0, green = 0, gray = 0, uiLike = 0;

  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const r = data[o], g = data[o + 1], b = data[o + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    if (sat < 0.12) {
      gray++;
      if ((r > 242 && g > 242 && b > 242) || (r < 12 && g < 12 && b < 12)) uiLike++;
    } else if (r > g + 10 && r > b + 10) warm++;
    else if (b > r + 10 && b > g + 10) cool++;
    else if (g > r + 10 && g > b + 10) green++;
  }

  const scene: ImageScene = {
    warmRatio: Math.round((warm / n) * 100) / 100,
    coolRatio: Math.round((cool / n) * 100) / 100,
    greenRatio: Math.round((green / n) * 100) / 100,
    grayRatio: Math.round((gray / n) * 100) / 100,
    isNight: brightness < 55,
    isLikelyScreenshot: !hasCameraExif && uiLike / n > 0.3,
    hints: [],
  };

  if (scene.warmRatio > 0.3) scene.hints.push('Strong warm/orange tones — consistent with fire or flames.');
  if (scene.coolRatio > 0.4) scene.hints.push('Dominant blue tones — consistent with water, flooding or night lighting.');
  if (scene.greenRatio > 0.45) scene.hints.push('Dominant greenery — outdoor scene.');
  if (scene.isNight) scene.hints.push('Low-light / night-time capture.');
  if (scene.isLikelyScreenshot) scene.hints.push('Looks like a screenshot (flat UI colors, no camera metadata) — common for scam/chat evidence.');
  return scene;
}

export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return 64;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) {
      dist += x & 1;
      x >>= 1;
    }
  }
  return dist;
}

export async function analyzeImage(buffer: Buffer): Promise<ImageMetrics> {
  const img = await Jimp.read(buffer);
  const { width, height } = img.bitmap;
  const gray = toGrayscale(img);

  const brightness = gray.reduce((a, b) => a + b, 0) / gray.length;
  const variance = gray.reduce((a, b) => a + (b - brightness) ** 2, 0) / gray.length;
  const contrast = Math.sqrt(variance);
  const sharpness = laplacianVariance(gray, width, height);
  const col = colorfulness(img);
  const hash = dHash(gray, width, height);

  const blurDetected = sharpness < 60;
  const tooDark = brightness < 50;
  const tooBright = brightness > 210;

  // EXIF (best-effort — many images strip metadata)
  const exif: ImageMetrics['exif'] = {};
  const findings: string[] = [];
  try {
    const meta = (await exifr.parse(buffer).catch(() => null)) as Record<string, unknown> | null;
    if (meta) {
      const make = meta.Make as string | undefined;
      const model = meta.Model as string | undefined;
      if (make || model) exif.camera = [make, model].filter(Boolean).join(' ');
      if (meta.DateTimeOriginal instanceof Date) exif.dateTime = meta.DateTimeOriginal.toISOString();
      if (typeof meta.Software === 'string') exif.software = meta.Software;
      if (typeof meta.latitude === 'number' && typeof meta.longitude === 'number') {
        exif.gps = { lat: meta.latitude, lon: meta.longitude };
        findings.push('Photo contains GPS coordinates — location can be corroborated.');
      }
      if (typeof meta.Software === 'string' && /photoshop|gimp|lightroom|snapseed|picsart/i.test(meta.Software)) {
        findings.push(`Image shows signs of editing (${meta.Software}).`);
      }
    }
  } catch {
    // EXIF unreadable — not an error
  }

  const scene = analyzeScene(img, brightness, Boolean(exif.camera));
  findings.push(...scene.hints);

  if (width * height < 400 * 300) findings.push('Low resolution — fine detail may be unreadable.');
  if (blurDetected) findings.push('Image appears blurred or out of focus.');
  if (tooDark) findings.push('Image is very dark — scene detail may be obscured.');
  if (tooBright) findings.push('Image is overexposed — detail may be washed out.');
  if (!blurDetected && !tooDark && width * height >= 1_000_000) {
    findings.push('Image quality is good for evidence review.');
  }

  return {
    width,
    height,
    megapixels: Math.round(((width * height) / 1_000_000) * 10) / 10,
    brightness: Math.round(brightness),
    contrast: Math.round(contrast),
    sharpness: Math.round(sharpness),
    colorfulness: col,
    blurDetected,
    tooDark,
    tooBright,
    perceptualHash: hash,
    scene,
    exif,
    findings,
  };
}
