import { fillRect, frameRect, imageElement, panelRect, svgDocument, textElement } from './svg.mjs';
import { measure, wrapText } from './text.mjs';

export const HEADER = { width: 880, height: 280 };
// Two cards share a README row; the gutter sits on the inner edge so outer edges line up.
export const CARD = { width: 440, height: 420, gutter: 8, bannerWidth: 400, bannerHeight: 200 };
const PAD = 40;

export function header({ profile, theme, artUri }) {
  const { width, height } = HEADER;
  const headline = wrapText(profile.headline, 400, 24, 2);
  const body = [
    panelRect(width, height, theme),
    imageElement({ x: 0, y: 0, width, height, href: artUri, isPixelArt: true }),
    frameRect(0, 0, width, height, theme),
    textElement({ x: PAD, y: 60, size: 14, tone: 'muted', content: profile.label, tracking: 3 }),
    textElement({ x: PAD - 3, y: 140, size: 80, tone: 'text', content: profile.name }),
    ...headline.map((line, lineIndex) =>
      textElement({ x: PAD, y: 190 + lineIndex * 30, size: 24, tone: 'text', content: line }),
    ),
    textElement({ x: PAD, y: 254, size: 18, tone: 'subtle', content: profile.focus }),
  ];
  const title = `${profile.name}: ${profile.headline} ${profile.focus}`;
  return svgDocument({ width, height, theme, title, body: body.join('\n') });
}

export function statusStrip({ status, theme }) {
  const width = 880;
  const height = 64;
  const labelX = PAD + 26;
  const detailX = labelX + measure(status.label, 15, 2.5) + 28;
  const body = [
    panelRect(width, height, theme),
    `<rect class="pulse" x="${PAD}" y="26" width="12" height="12" fill="${theme.live}"/>`,
    textElement({ x: labelX, y: 38, size: 15, tone: 'text', content: status.label, tracking: 2.5 }),
    textElement({ x: detailX, y: 38, size: 15, tone: 'muted', content: status.detail }),
    textElement({
      x: width - PAD,
      y: 38,
      size: 15,
      tone: 'text',
      content: status.action,
      anchor: 'end',
    }),
  ];
  const title = `${status.label}: ${status.detail}. ${status.action}`;
  return svgDocument({ width, height, theme, title, body: body.join('\n') });
}

export function sectionLabel({ index, title, action = '', theme }) {
  const width = 880;
  const height = 40;
  const titleX = measure(index, 13, 3) + 16;
  const ruleStart = titleX + measure(title, 13, 3) + 18;
  const ruleEnd = action ? width - measure(action, 13) - 18 : width;
  const body = [
    textElement({ x: 0, y: 25, size: 13, tone: 'accent', content: index, tracking: 3 }),
    textElement({ x: titleX, y: 25, size: 13, tone: 'muted', content: title, tracking: 3 }),
    `<line x1="${ruleStart}" y1="20.5" x2="${ruleEnd}" y2="20.5" stroke="${theme.line}"/>`,
    action
      ? textElement({ x: width, y: 25, size: 13, tone: 'accent', content: action, anchor: 'end' })
      : '',
  ];
  return svgDocument({ width, height, theme, title: title.toLowerCase(), body: body.join('\n') });
}

/** Draws the cover: an image when there is one, otherwise a poster in the accent color. */
function cover({ x, y, width, height, coverUri, accent, title, meta, theme }) {
  if (coverUri) {
    return [
      imageElement({ x, y, width, height, href: coverUri }),
      frameRect(x, y, width, height, theme),
    ];
  }
  return [
    fillRect(x, y, width, height, accent),
    textElement({
      x: x + width / 2,
      y: y + height / 2 + 14,
      size: 40,
      tone: 'on-brand',
      content: title,
      anchor: 'middle',
    }),
    textElement({
      x: x + width / 2,
      y: y + height / 2 + 44,
      size: 13,
      tone: 'on-brand',
      content: meta.toUpperCase(),
      anchor: 'middle',
      tracking: 2,
    }),
  ];
}

/** A grid card for a project, a post or a community. Two cards share a README row. */
export function card({
  index,
  meta,
  title,
  description,
  cta,
  accent,
  ctaTone,
  side,
  theme,
  coverUri,
}) {
  const { width, height, gutter, bannerWidth, bannerHeight } = CARD;
  const panelX = side === 'left' ? 0 : gutter;
  const panelWidth = width - gutter;
  const inset = 16;
  const textX = panelX + 24;
  const textWidth = panelWidth - 48;
  const textTop = inset + bannerHeight;
  const fitsOneLine = measure(title, 26) <= textWidth;
  const titleSize = fitsOneLine ? 26 : 21;
  const titleLines = fitsOneLine ? [title] : wrapText(title, textWidth, titleSize, 2);
  const titleBottom = textTop + 72 + (titleLines.length - 1) * 26;
  const descriptionLines = wrapText(description, textWidth, 15, 4 - titleLines.length);
  const ctaWidth = Math.ceil(measure(cta, 14)) + 32;
  const body = [
    `<rect x="${panelX + 0.5}" y="0.5" width="${panelWidth - 1}" height="${height - 1}" fill="${theme.panel}" stroke="${theme.line}"/>`,
    fillRect(panelX, 0, panelWidth, 4, accent),
    ...cover({
      x: panelX + inset,
      y: inset,
      width: bannerWidth,
      height: bannerHeight,
      coverUri,
      accent,
      title,
      meta,
      theme,
    }),
    textElement({
      x: textX,
      y: textTop + 38,
      size: 12,
      tone: 'accent',
      content: index,
      tracking: 1.2,
    }),
    textElement({
      x: textX + 26,
      y: textTop + 38,
      size: 12,
      tone: 'muted',
      content: meta.toUpperCase(),
      tracking: 1.2,
    }),
    ...titleLines.map((line, lineIndex) =>
      textElement({
        x: textX - 1,
        y: textTop + 72 + lineIndex * 26,
        size: titleSize,
        tone: 'text',
        content: line,
      }),
    ),
    ...descriptionLines.map((line, lineIndex) =>
      textElement({
        x: textX,
        y: titleBottom + 26 + lineIndex * 21,
        size: 15,
        tone: 'subtle',
        content: line,
      }),
    ),
    fillRect(textX, height - 52, ctaWidth, 32, accent),
    textElement({ x: textX + 16, y: height - 31, size: 14, tone: ctaTone, content: cta }),
  ];
  return svgDocument({
    width,
    height,
    theme,
    title: `${title}: ${description} ${cta}`,
    body: body.join('\n'),
  });
}

export function linkButton({ link, theme }) {
  const width = 220;
  const height = 60;
  const body = [
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" fill="${theme.chip}" stroke="${theme.panel}"/>`,
    textElement({
      x: width / 2,
      y: 36,
      size: 16,
      tone: 'chip-text',
      content: `${link.label} ↗`,
      anchor: 'middle',
    }),
  ];
  return svgDocument({ width, height, theme, title: link.label, body: body.join('\n') });
}
