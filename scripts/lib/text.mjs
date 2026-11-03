import { readFileSync } from 'node:fs';

const metrics = JSON.parse(
  readFileSync(new URL('../../fonts/geist-pixel-square.metrics.json', import.meta.url), 'utf8'),
);
// Characters outside the subset render in a fallback font, so assume a wide glyph.
const fallbackAdvance = 570;

export function escapeXml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function measure(text, size, tracking = 0) {
  let units = 0;
  for (const char of text) units += metrics.advances[char] ?? fallbackAdvance;
  return (units / metrics.unitsPerEm) * size + tracking * Math.max(0, [...text].length - 1);
}

export function truncate(text, width, size, tracking = 0) {
  if (measure(text, size, tracking) <= width) return text;
  let cut = text;
  while (cut.length > 0 && measure(`${cut}…`, size, tracking) > width) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

export function wrapText(text, width, size, maxLines) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(candidate, size) <= width || !line) {
      line = candidate;
      continue;
    }
    lines.push(line);
    line = word;
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = truncate(`${kept[maxLines - 1]} ${lines[maxLines]}`, width, size);
  return kept;
}
