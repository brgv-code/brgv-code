const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decodeEntities(text) {
  return text.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (match, entity) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    }
    if (entity.startsWith('#')) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    return ENTITIES[entity] ?? match;
  });
}

function tagContent(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!match) return '';
  const raw = match[1].replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1');
  return decodeEntities(raw).trim();
}

/** Newest posts first, as the feed does not promise an order. */
export function parseFeed(xml, count) {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return items
    .map((item) => {
      const published = new Date(tagContent(item, 'pubDate'));
      return {
        title: tagContent(item, 'title'),
        url: tagContent(item, 'link'),
        description: tagContent(item, 'description'),
        published,
        date: published.toISOString().slice(0, 10),
      };
    })
    .sort((postA, postB) => postB.published - postA.published)
    .slice(0, count);
}

async function fetchOk(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response;
}

export async function fetchPosts(feedUrl, count) {
  const response = await fetchOk(feedUrl);
  return parseFeed(await response.text(), count);
}

export async function fetchRepo(fullName, token) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'brgv-code-profile' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetchOk(`https://api.github.com/repos/${fullName}`, { headers });
  const repo = await response.json();
  return {
    name: repo.name,
    description: repo.description ?? '',
    language: repo.language,
    pushedAt: repo.pushed_at,
    url: repo.homepage || repo.html_url,
  };
}

export async function fetchImage(url) {
  const response = await fetchOk(url);
  return Buffer.from(await response.arrayBuffer());
}
