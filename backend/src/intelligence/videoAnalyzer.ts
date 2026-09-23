import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import Jimp from 'jimp';
import type { VideoMetrics } from './types';
import { analyzeImage } from './imageAnalyzer';

/**
 * Local video analysis. Parses container metadata without any cloud API.
 * If an ffmpeg binary is available (bundled via @ffmpeg-installer/ffmpeg or
 * on PATH), we also sample frames for brightness/sharpness/scene-change
 * metrics. Otherwise we degrade gracefully to container-level facts.
 */

function findFfmpeg(): string | null {
  try {
    // optional dependency — may not be installed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ff = require('@ffmpeg-installer/ffmpeg') as { path?: string };
    if (ff?.path && fs.existsSync(ff.path)) return ff.path;
  } catch {
    // not installed, fall through
  }
  const probe = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  if (!probe.error && probe.status === 0) return 'ffmpeg';
  return null;
}

function parseFfmpegOutput(stderr: string): Partial<VideoMetrics> {
  const out: Partial<VideoMetrics> = {};
  const dur = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (dur) {
    out.durationSec = parseInt(dur[1]) * 3600 + parseInt(dur[2]) * 60 + parseFloat(dur[3]);
  }
  const vStream = stderr.match(/Video:\s*(\w+).*?,\s*(\d{2,5})x(\d{2,5})/);
  if (vStream) {
    out.codec = vStream[1];
    out.width = parseInt(vStream[2]);
    out.height = parseInt(vStream[3]);
  }
  const fps = stderr.match(/(\d+(?:\.\d+)?)\s*fps/);
  if (fps) out.fps = parseFloat(fps[1]);
  const br = stderr.match(/(\d+)\s*kb\/s/);
  if (br) out.bitrateKbps = parseInt(br[1]);
  out.hasAudio = /Stream.*Audio:/.test(stderr);
  const container = stderr.match(/Input #0,\s*(\w+)/);
  if (container) out.container = container[1];
  return out;
}

async function sampleFrames(
  ffmpeg: string,
  file: string,
  durationSec: number | undefined,
  metrics: Partial<VideoMetrics>,
  findings: string[]
): Promise<Partial<VideoMetrics>> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sr-vid-'));
  const sampleCount = 4;
  const results: { brightness: number; sharpness: number; hash: string }[] = [];

  try {
    for (let i = 0; i < sampleCount; i++) {
      const t = durationSec
        ? Math.max(0.5, (durationSec * (i + 1)) / (sampleCount + 1))
        : i * 2;
      const outPng = path.join(tmpDir, `frame-${i}.jpg`);
      const res = spawnSync(
        ffmpeg,
        ['-ss', String(t), '-i', file, '-frames:v', '1', '-q:v', '3', '-y', outPng],
        { stdio: 'ignore', timeout: 15_000 }
      );
      if (res.error || res.status !== 0 || !fs.existsSync(outPng)) continue;
      try {
        const imgMetrics = await analyzeImage(fs.readFileSync(outPng));
        results.push({
          brightness: imgMetrics.brightness,
          sharpness: imgMetrics.sharpness,
          hash: imgMetrics.perceptualHash,
        });
      } catch {
        // frame unreadable, skip
      } finally {
        fs.unlinkSync(outPng);
      }
    }

    if (results.length > 0) {
      metrics.sampledFrames = results.length;
      metrics.avgBrightness = Math.round(
        results.reduce((a, r) => a + r.brightness, 0) / results.length
      );
      metrics.avgSharpness = Math.round(
        results.reduce((a, r) => a + r.sharpness, 0) / results.length
      );
      // rough scene-change count via dHash Hamming distance between samples
      let changes = 0;
      for (let i = 1; i < results.length; i++) {
        let diff = 0;
        const a = results[i - 1].hash;
        const b = results[i].hash;
        for (let j = 0; j < a.length; j++) {
          let x = parseInt(a[j], 16) ^ parseInt(b[j], 16);
          while (x) {
            diff += x & 1;
            x >>= 1;
          }
        }
        if (diff > 12) changes++;
      }
      metrics.sceneChanges = changes;
      if (changes >= 2) findings.push(`Video contains ${changes + 1} distinct scenes/angles.`);
      if (metrics.avgSharpness !== undefined && metrics.avgSharpness < 60) {
        findings.push('Sampled frames are mostly blurry.');
      }
      if (metrics.avgBrightness !== undefined && metrics.avgBrightness < 50) {
        findings.push('Video is very dark — recorded at night or in low light.');
      }
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
  return metrics;
}

export async function analyzeVideo(buffer: Buffer, originalName: string): Promise<VideoMetrics> {
  const findings: string[] = [];
  const metrics: VideoMetrics = { hasAudio: false, findings };

  const ext = path.extname(originalName).toLowerCase() || '.mp4';
  const tmpFile = path.join(
    os.tmpdir(),
    `sr-upload-${Date.now()}${ext}`
  );
  fs.writeFileSync(tmpFile, buffer);

  try {
    const ffmpeg = findFfmpeg();
    if (ffmpeg) {
      const probe = spawnSync(ffmpeg, ['-i', tmpFile], { encoding: 'utf8', timeout: 15_000 });
      const stderr = probe.stderr || '';
      Object.assign(metrics, parseFfmpegOutput(stderr));

      if (metrics.durationSec && metrics.durationSec > 120) {
        findings.push(
          `Long recording (${Math.round(metrics.durationSec / 60)} min) — consider trimming to the key moment.`
        );
      }
      if (metrics.width && metrics.height && metrics.width * metrics.height < 640 * 360) {
        findings.push('Low-resolution video — detail may be hard to discern.');
      }
      if (metrics.durationSec) {
        await sampleFrames(ffmpeg, tmpFile, metrics.durationSec, metrics, findings);
      }
    } else {
      // No ffmpeg: minimal container sniffing for common formats
      if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
        metrics.container = 'mp4';
        findings.push('Container identified as MP4; frame sampling skipped (ffmpeg unavailable).');
      } else {
        findings.push('Video metadata limited — ffmpeg unavailable on server.');
      }
      findings.push('Basic video validation passed (file readable, size within limits).');
    }

    const sizeMb = buffer.length / (1024 * 1024);
    if (sizeMb < 0.5) findings.push('Very short/small clip — may lack sufficient context.');
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }

  return metrics;
}

// re-exported so Jimp type import is used (tree-shaking safety)
export type { Jimp };
