function smoothstep(edge0, edge1, value) {
  const clamped = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return clamped * clamped * (3 - 2 * clamped);
}

/** Height of the curve at t in [0, 1], as a fraction of the field from the top. */
function curveAt(t) {
  const trend = t ** 1.7;
  const wobble = 0.025 * Math.sin(t * 23) + 0.018 * Math.sin(t * 47 + 1.3);
  return 0.86 - 0.7 * trend + wobble * (1 - t * 0.5);
}

/**
 * Grayscale field of a rising area chart that fades in from the left.
 * Deterministic, so the dithered header only changes when this code does.
 */
export function growthField(width, height, startFraction) {
  const gray = new Uint8Array(width * height).fill(255);
  const startColumn = Math.round(width * startFraction);
  // The curve stops short of the edge so its end marker sits inside the frame.
  const endColumn = width - 12;
  const gridSpacing = Math.round(height / 5);

  for (let column = startColumn; column < width; column++) {
    const t = Math.min(1, (column - startColumn) / (endColumn - startColumn));
    const curveRow = Math.round(curveAt(t) * height);
    const fadeIn = smoothstep(0, 0.25, t);

    for (let row = 0; row < height; row++) {
      const index = row * width + column;
      if (row > curveRow) {
        const depth = (row - curveRow) / Math.max(1, height - curveRow);
        const tone = 0.42 + 0.5 * depth;
        gray[index] = Math.round(255 - (1 - tone) * 255 * fadeIn);
      } else if (row % gridSpacing === 0) {
        gray[index] = Math.round(255 - 40 * fadeIn);
      }
    }
    for (let row = curveRow - 1; row <= curveRow; row++) {
      if (row >= 0 && fadeIn > 0.5 && column <= endColumn) gray[row * width + column] = 0;
    }
  }

  const endRow = Math.round(curveAt(1) * height);
  for (let row = endRow - 3; row <= endRow + 2; row++) {
    for (let column = endColumn - 2; column <= endColumn + 3; column++) {
      gray[row * width + column] = 0;
    }
  }
  return gray;
}
