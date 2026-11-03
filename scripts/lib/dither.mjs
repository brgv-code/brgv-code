import sharp from 'sharp';

const BAYER_8 = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28,
  52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7,
  39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
];

/** Ordered dither of an 8 bit grayscale buffer. Returns 1 where the pixel is ink. */
export function ditherMask(gray, width) {
  const mask = new Uint8Array(gray.length);
  for (let index = 0; index < gray.length; index++) {
    const column = index % width;
    const row = Math.floor(index / width);
    const threshold = ((BAYER_8[(row % 8) * 8 + (column % 8)] + 0.5) / 64) * 255;
    mask[index] = gray[index] < threshold ? 1 : 0;
  }
  return mask;
}

function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export async function maskToPngDataUri(mask, width, height, ink, paper) {
  const inkRgb = hexToRgb(ink);
  const paperRgb = hexToRgb(paper);
  const pixels = Buffer.alloc(mask.length * 3);
  mask.forEach((isInk, index) => pixels.set(isInk ? inkRgb : paperRgb, index * 3));
  const png = await sharp(pixels, { raw: { width, height, channels: 3 } })
    .png({ palette: true, colours: 2, compressionLevel: 9 })
    .toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}
