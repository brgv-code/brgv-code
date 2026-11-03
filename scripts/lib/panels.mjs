import { frameRect, imageElement, panelRect, svgDocument, textElement } from './svg.mjs';
import { measure, truncate, wrapText } from './text.mjs';

export const HEADER = { width: 880, height: 280 };
// The screenshot spans the card so product UI text stays near its native size.
export const CARD = {
  width: 880,
  height: 470,
  bannerX: 16,
  bannerY: 16,
  bannerWidth: 848,
  bannerHeight: 300,
};
const PAD = 40;

export function header({ profile, theme, artUri }) {
  const { width, height } = HEADER;
  const headline = wrapText(profile.headline, 400, 24, 2);
  const body = [
    panelRect(width, height, theme),
    imageElement({ x: 0, y: 0, width, height, href: artUri }),
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
  const label = `${index}  ${title}`;
  const ruleStart = measure(label, 13, 3) + 18;
  const ruleEnd = action ? width - measure(action, 13) - 18 : width;
  const body = [
    textElement({ x: 0, y: 25, size: 13, tone: 'muted', content: label, tracking: 3 }),
    `<line x1="${ruleStart}" y1="20.5" x2="${ruleEnd}" y2="20.5" stroke="${theme.line}"/>`,
    action
      ? textElement({ x: width, y: 25, size: 13, tone: 'muted', content: action, anchor: 'end' })
      : '',
  ];
  return svgDocument({ width, height, theme, title: title.toLowerCase(), body: body.join('\n') });
}

export function projectCard({ repo, position, theme, bannerUri }) {
  const { width, height, bannerX, bannerY, bannerWidth, bannerHeight } = CARD;
  const textWidth = width - 2 * PAD;
  const textTop = bannerY + bannerHeight;
  const updated = repo.pushedAt.slice(0, 10);
  const meta = [String(position).padStart(2, '0'), repo.language, `UPDATED ${updated}`]
    .filter(Boolean)
    .join(' · ')
    .toUpperCase();
  const description = wrapText(repo.description, textWidth, 17, 2);
  const body = [
    panelRect(width, height, theme),
    imageElement({
      x: bannerX,
      y: bannerY,
      width: bannerWidth,
      height: bannerHeight,
      href: bannerUri,
    }),
    frameRect(bannerX, bannerY, bannerWidth, bannerHeight, theme),
    textElement({
      x: PAD,
      y: textTop + 38,
      size: 13,
      tone: 'muted',
      content: meta,
      tracking: 1.5,
    }),
    textElement({
      x: width - PAD,
      y: textTop + 38,
      size: 15,
      tone: 'text',
      content: `${new URL(repo.url).host} ↗`,
      anchor: 'end',
    }),
    textElement({ x: PAD - 2, y: textTop + 80, size: 34, tone: 'text', content: repo.name }),
    ...description.map((line, lineIndex) =>
      textElement({
        x: PAD,
        y: textTop + 112 + lineIndex * 24,
        size: 17,
        tone: 'subtle',
        content: line,
      }),
    ),
  ];
  const title = `${repo.name}: ${repo.description}`;
  return svgDocument({ width, height, theme, title, body: body.join('\n') });
}

/** One linked line of a list: a post, or a community. */
export function listRow({ title, meta, description, theme }) {
  const width = 880;
  const height = 84;
  const textWidth = width - 2 * PAD - 40;
  const subline = truncate(`${meta} · ${description}`, textWidth, 14);
  const body = [
    panelRect(width, height, theme),
    textElement({ x: PAD, y: 38, size: 19, tone: 'text', content: truncate(title, textWidth, 19) }),
    textElement({ x: PAD, y: 62, size: 14, tone: 'muted', content: subline }),
    textElement({ x: width - PAD, y: 50, size: 20, tone: 'text', content: '→', anchor: 'end' }),
  ];
  return svgDocument({ width, height, theme, title, body: body.join('\n') });
}

export function linkButton({ link, theme }) {
  const width = 220;
  const height = 60;
  const body = [
    panelRect(width, height, theme),
    textElement({
      x: width / 2,
      y: 36,
      size: 16,
      tone: 'text',
      content: `${link.label} ↗`,
      anchor: 'middle',
    }),
  ];
  return svgDocument({ width, height, theme, title: link.label, body: body.join('\n') });
}
