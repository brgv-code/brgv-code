import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ditherMask } from '../scripts/lib/dither.mjs';
import { growthField } from '../scripts/lib/growth-curve.mjs';
import { renderReadme } from '../scripts/lib/readme.mjs';
import { parseFeed } from '../scripts/lib/sources.mjs';
import { escapeXml, measure, truncate, wrapText } from '../scripts/lib/text.mjs';

const sum = (mask) => mask.reduce((total, isInk) => total + isInk, 0);

describe('ditherMask', () => {
  it('inks every black pixel and no white pixel', () => {
    assert.equal(sum(ditherMask(new Uint8Array(64).fill(0), 8)), 64);
    assert.equal(sum(ditherMask(new Uint8Array(64).fill(255), 8)), 0);
  });

  it('inks half of a mid gray tile', () => {
    assert.equal(sum(ditherMask(new Uint8Array(64).fill(128), 8)), 32);
  });
});

describe('growthField', () => {
  it('leaves the text side of the header blank', () => {
    const width = 100;
    const field = growthField(width, 40, 0.5);
    for (let index = 0; index < field.length; index++) {
      if (index % width < 50) assert.equal(field[index], 255);
    }
  });
});

describe('parseFeed', () => {
  const xml = `<rss><channel>
    <item><title>Older &amp; wiser</title><link>https://bhargav.dev/a</link>
      <description><![CDATA[First post]]></description><pubDate>Sun, 18 Oct 2026 00:00:00 GMT</pubDate></item>
    <item><title>Newest</title><link>https://bhargav.dev/b</link>
      <description>It&#39;s new</description><pubDate>Mon, 02 Nov 2026 00:00:00 GMT</pubDate></item>
  </channel></rss>`;

  it('returns the newest posts first with decoded text', () => {
    const posts = parseFeed(xml, 2);
    assert.deepEqual(
      posts.map((post) => [post.title, post.date, post.description]),
      [
        ['Newest', '2026-11-02', "It's new"],
        ['Older & wiser', '2026-10-18', 'First post'],
      ],
    );
  });

  it('stops at the requested count', () => {
    assert.equal(parseFeed(xml, 1).length, 1);
  });
});

describe('text fitting', () => {
  it('escapes markup', () => {
    assert.equal(
      escapeXml(`<a href="x">Tom's & co</a>`),
      '&lt;a href=&quot;x&quot;&gt;Tom&#39;s &amp; co&lt;/a&gt;',
    );
  });

  it('truncates to the width with an ellipsis', () => {
    const cut = truncate('a sentence that is far too long for the box', 120, 16);
    assert.ok(cut.endsWith('…'));
    assert.ok(measure(cut, 16) <= 120);
  });

  it('wraps within the width and caps the line count', () => {
    const lines = wrapText('one two three four five six seven eight nine ten', 90, 16, 2);
    assert.equal(lines.length, 2);
    for (const line of lines) assert.ok(measure(line, 16) <= 90);
    assert.ok(lines[1].endsWith('…'));
  });
});

describe('renderReadme', () => {
  it('pairs a dark source with a light fallback and splits row width', () => {
    const panel = { file: 'link-1', alt: 'Q&A', href: 'https://bhargav.dev', version: 'abc' };
    const readme = renderReadme([[panel, { ...panel, file: 'link-2' }]]);
    assert.match(
      readme,
      /media="\(prefers-color-scheme: dark\)" srcset="\.\/profile\/link-1-dark\.svg\?v=abc"/,
    );
    assert.match(readme, /src="\.\/profile\/link-1-light\.svg\?v=abc" width="50%" alt="Q&amp;A"/);
  });
});
