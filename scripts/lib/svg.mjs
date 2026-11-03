import { readFileSync } from 'node:fs';
import { escapeXml } from './text.mjs';

const fontBase64 = readFileSync(
  new URL('../../fonts/geist-pixel-square.woff2', import.meta.url),
).toString('base64');

// GitHub serves README images in a sandbox, so the font has to travel inside every SVG.
function style(theme) {
  return `@font-face{font-family:'Geist Pixel Square';src:url(data:font/woff2;base64,${fontBase64}) format('woff2')}
text{font-family:'Geist Pixel Square',ui-monospace,monospace}
.text{fill:${theme.text}}.subtle{fill:${theme.subtle}}.muted{fill:${theme.muted}}
image{image-rendering:pixelated;image-rendering:crisp-edges}
@keyframes pulse{50%{opacity:.2}}.pulse{animation:pulse 1.6s steps(1,end) infinite}
@media (prefers-reduced-motion:reduce){.pulse{animation:none}}`;
}

export function svgDocument({ width, height, theme, title, body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}">
<title>${escapeXml(title)}</title>
<style>${style(theme)}</style>
${body}
</svg>
`;
}

export function panelRect(width, height, theme) {
  return `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" fill="${theme.panel}" stroke="${theme.line}"/>`;
}

export function frameRect(x, y, width, height, theme) {
  return `<rect x="${x + 0.5}" y="${y + 0.5}" width="${width - 1}" height="${height - 1}" fill="none" stroke="${theme.line}"/>`;
}

export function textElement({ x, y, size, tone, content, tracking = 0, anchor = 'start' }) {
  const spacing = tracking ? ` letter-spacing="${tracking}"` : '';
  return `<text x="${x}" y="${y}" font-size="${size}" class="${tone}" text-anchor="${anchor}"${spacing}>${escapeXml(content)}</text>`;
}

export function imageElement({ x, y, width, height, href }) {
  return `<image x="${x}" y="${y}" width="${width}" height="${height}" href="${href}" preserveAspectRatio="none"/>`;
}
