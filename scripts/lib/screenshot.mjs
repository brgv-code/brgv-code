import sharp from 'sharp';

/**
 * Crops [left, top, width, height] (fractions of the source) and encodes it for a width x height
 * slot at up to 2x density, so UI text stays sharp on retina screens without upscaling.
 */
export async function screenshotDataUri(source, crop, width, height) {
  const image = sharp(source);
  const { width: sourceWidth, height: sourceHeight } = await image.metadata();
  const [left, top, cropWidth, cropHeight] = crop;
  const region = {
    left: Math.round(left * sourceWidth),
    top: Math.round(top * sourceHeight),
    width: Math.round(cropWidth * sourceWidth),
    height: Math.round(cropHeight * sourceHeight),
  };
  const outputWidth = Math.min(2 * width, region.width);
  const webp = await image
    .extract(region)
    .resize(outputWidth, Math.round((outputWidth * height) / width), { fit: 'cover' })
    .webp({ quality: 82 })
    .toBuffer();
  return `data:image/webp;base64,${webp.toString('base64')}`;
}
