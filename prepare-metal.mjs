import { readFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// A distance field keeps the metal surface continuous while its silhouette changes.
export function liquidDistanceField(alpha, width, height) {
  if (alpha.length !== width * height || !alpha.some(value => value > 96)) throw new Error('Empty or invalid logo mask');
  const inside = new Float32Array(alpha.length);
  const outside = new Float32Array(alpha.length);
  for (let i = 0; i < alpha.length; i++) {
    const ink = alpha[i] > 96;
    inside[i] = ink ? 0 : 1e4;
    outside[i] = ink ? 1e4 : 0;
  }
  for (const distance of [inside, outside]) {
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (x) distance[i] = Math.min(distance[i], distance[i - 1] + 1);
      if (y) distance[i] = Math.min(distance[i], distance[i - width] + 1);
      if (x && y) distance[i] = Math.min(distance[i], distance[i - width - 1] + Math.SQRT2);
      if (y && x + 1 < width) distance[i] = Math.min(distance[i], distance[i - width + 1] + Math.SQRT2);
    }
    for (let y = height - 1; y >= 0; y--) for (let x = width - 1; x >= 0; x--) {
      const i = y * width + x;
      if (x + 1 < width) distance[i] = Math.min(distance[i], distance[i + 1] + 1);
      if (y + 1 < height) distance[i] = Math.min(distance[i], distance[i + width] + 1);
      if (x + 1 < width && y + 1 < height) distance[i] = Math.min(distance[i], distance[i + width + 1] + Math.SQRT2);
      if (x && y + 1 < height) distance[i] = Math.min(distance[i], distance[i + width - 1] + Math.SQRT2);
    }
  }
  return inside.map((value, i) => (value - outside[i] + (alpha[i] > 96 ? .5 : -.5)) / height);
}

// Offline only: browsers decode these PNG fields instead of calculating distances at entry.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sharp = createRequire(import.meta.url)('sharp');
  const html = readFileSync(new URL('index.html', import.meta.url), 'utf8');
  const output = new URL('assets/metal/', import.meta.url);
  mkdirSync(output, { recursive: true });
  for (const name of ['makebook', 'tencent', 'advx', 'redstar', 'caesar']) {
    const signature = name === 'caesar';
    const width = signature ? 1400 : 600, height = signature ? 445 : 400;
    const mask = signature ? null : html.match(new RegExp(`<mask id="brand-${name}"[^>]*>([\\s\\S]*?)</mask>`))[1];
    const attr = key => mask.match(new RegExp(`${key}="([^"]+)"`))[1];
    const path = signature ? 'assets/caesar-signature.webp' : attr('href');
    const image = await sharp(new URL(path, import.meta.url).pathname).png().toBuffer();
    const x = signature ? 0 : +attr('x'), y = signature ? 0 : +attr('y');
    const w = signature ? width : +attr('width'), h = signature ? height : +attr('height');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><image href="data:image/png;base64,${image.toString('base64')}" x="${x}" y="${y}" width="${w}" height="${h}"/></svg>`;
    const rasterWidth = signature ? 768 : 512;
    const rasterHeight = Math.round(rasterWidth * height / width);
    const { data: pixels } = await sharp(Buffer.from(svg)).resize(rasterWidth, rasterHeight).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const alpha = new Uint8Array(rasterWidth * rasterHeight);
    for (let i = 0; i < alpha.length; i++) alpha[i] = pixels[i * 4 + 3] * (name === 'redstar' ? Math.max(0, Math.min(1, 5.6 - 6 * pixels[i * 4] / 255)) : 1);
    const distances = liquidDistanceField(alpha, rasterWidth, rasterHeight);
    let smooth = distances;
    for (const horizontal of [true, false, true, false]) {
      const next = new Float32Array(smooth.length);
      for (let y = 0; y < rasterHeight; y++) for (let x = 0; x < rasterWidth; x++) {
        const i = y * rasterWidth + x;
        const before = horizontal ? y * rasterWidth + Math.max(0, x - 2) : Math.max(0, y - 2) * rasterWidth + x;
        const after = horizontal ? y * rasterWidth + Math.min(rasterWidth - 1, x + 2) : Math.min(rasterHeight - 1, y + 2) * rasterWidth + x;
        next[i] = (smooth[before] + smooth[i] * 2 + smooth[after]) / 4;
      }
      smooth = next;
    }
    const packed = Buffer.alloc(alpha.length * 2 * 3);
    [distances, smooth].forEach((field, layer) => {
      field.forEach((distance, i) => {
        const value = Math.round(Math.max(0, Math.min(1, distance / .5 + .5)) * 4095);
        const offset = (layer * alpha.length + i) * 3;
        packed[offset] = value >> 8;
        packed[offset + 1] = value & 255;
      });
    });
    const file = new URL(`${name}.png`, output).pathname;
    await sharp(packed, { raw: { width: rasterWidth, height: rasterHeight * 2, channels: 3 } }).png({ compressionLevel: 9 }).toFile(file);
    console.log(`Prepared ${name}`);
  }
}

