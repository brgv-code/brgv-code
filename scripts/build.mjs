import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { coverDataUri } from './lib/cover.mjs';
import { ditherMask, maskToPngDataUri } from './lib/dither.mjs';
import { growthField } from './lib/growth-curve.mjs';
import {
  CARD,
  HEADER,
  card,
  header,
  linkButton,
  sectionLabel,
  statusStrip,
} from './lib/panels.mjs';
import { renderReadme } from './lib/readme.mjs';
import { fetchCover, fetchPosts, fetchRepo } from './lib/sources.mjs';

const root = new URL('../', import.meta.url);
const outputDir = new URL('profile/', root);
// One dither dot covers DOT x DOT SVG units, which keeps the texture coarse enough to read.
const DOT = 2;

async function ditheredArt(gray, width, height, themes) {
  const mask = ditherMask(gray, width);
  const entries = await Promise.all(
    Object.entries(themes).map(async ([name, theme]) => [
      name,
      await maskToPngDataUri(mask, width, height, theme.ink, theme.paper),
    ]),
  );
  return Object.fromEntries(entries);
}

/** Most recently pushed first, so the grid leads with what is active. */
async function loadProjects(config) {
  const projects = await Promise.all(
    config.projects.map(async (project) => {
      const [repo, image] = await Promise.all([
        fetchRepo(project.repo, process.env.GITHUB_TOKEN),
        readFile(new URL(project.screenshot, root)),
      ]);
      const coverUri = await coverDataUri(image, project.crop, CARD.bannerWidth, CARD.bannerHeight);
      return { repo, coverUri, accent: project.accent };
    }),
  );
  return projects.sort(
    (projectA, projectB) => Date.parse(projectB.repo.pushedAt) - Date.parse(projectA.repo.pushedAt),
  );
}

async function coverFrom(pageUrl) {
  if (!pageUrl) return null;
  const image = await fetchCover(pageUrl);
  return image && coverDataUri(image, [0, 0, 1, 1], CARD.bannerWidth, CARD.bannerHeight);
}

async function withCovers(items, pageUrlOf) {
  return Promise.all(
    items.map(async (item) => ({ ...item, coverUri: await coverFrom(pageUrlOf(item)) })),
  );
}

/** Lays cards out two per README row, gutter on the inner edge. */
function cardRows(cards) {
  const panels = cards.map((panel, index) => ({
    ...panel,
    render: (theme) =>
      card({ ...panel.card(theme), side: index % 2 === 0 ? 'left' : 'right', theme }),
  }));
  return pairs(panels);
}

function pairs(panels) {
  const rows = [];
  for (let index = 0; index < panels.length; index += 2) rows.push(panels.slice(index, index + 2));
  return rows;
}

async function writePanel(file, render, themes) {
  const hash = createHash('sha1');
  for (const [name, theme] of Object.entries(themes)) {
    const svg = await render(theme, name);
    hash.update(svg);
    await writeFile(new URL(`${file}-${name}.svg`, outputDir), svg);
  }
  return hash.digest('hex').slice(0, 10);
}

async function build() {
  const config = JSON.parse(await readFile(new URL('profile.config.json', root), 'utf8'));
  const { themes, profile, status, writing, community, links } = config;

  const [projects, posts, communities] = await Promise.all([
    loadProjects(config),
    fetchPosts(writing.feed, writing.count).then((items) => withCovers(items, (post) => post.url)),
    withCovers(community.entries, (entry) => entry.cover),
  ]);
  const artWidth = HEADER.width / DOT;
  const artHeight = HEADER.height / DOT;
  const headerArt = await ditheredArt(
    growthField(artWidth, artHeight, 0.5),
    artWidth,
    artHeight,
    themes,
  );

  const panels = [
    [
      {
        file: 'header',
        alt: `${profile.name}: ${profile.headline} ${profile.focus}`,
        href: profile.url,
        render: (theme, name) => header({ profile, theme, artUri: headerArt[name] }),
      },
    ],
    [
      {
        file: 'status',
        alt: `${status.label}: ${status.detail}`,
        href: status.url,
        render: (theme) => statusStrip({ status, theme }),
      },
    ],
    [
      {
        file: 'label-projects',
        alt: 'Projects',
        href: `https://github.com/${config.username}?tab=repositories`,
        render: (theme) =>
          sectionLabel({ index: '01', title: 'PROJECTS', action: 'all repos →', theme }),
      },
    ],
    ...cardRows(
      projects.map(({ repo, coverUri, accent }, index) => ({
        file: `project-${index + 1}`,
        alt: `${repo.name}: ${repo.description} ${config.projectCta}`,
        href: repo.url,
        card: () => ({
          index: String(index + 1).padStart(2, '0'),
          meta: [repo.language, repo.pushedAt.slice(0, 10)].filter(Boolean).join(' · '),
          title: repo.name,
          description: repo.description,
          cta: config.projectCta,
          accent,
          ctaTone: 'on-brand',
          coverUri,
        }),
      })),
    ),
    [
      {
        file: 'label-writing',
        alt: 'Writing',
        href: writing.url,
        render: (theme) =>
          sectionLabel({ index: '02', title: 'WRITING', action: 'all writing →', theme }),
      },
    ],
    ...cardRows(
      posts.map((post, index) => ({
        file: `post-${index + 1}`,
        alt: `${post.title} (${post.date}): ${post.description}`,
        href: post.url,
        card: (theme) => ({
          index: String(index + 1).padStart(2, '0'),
          meta: post.date,
          title: post.title,
          description: post.description,
          cta: writing.cta,
          accent: theme.accent,
          ctaTone: 'on-accent',
          coverUri: post.coverUri,
        }),
      })),
    ),
    [
      {
        file: 'label-community',
        alt: 'Community',
        href: community.url,
        render: (theme) =>
          sectionLabel({ index: '03', title: 'COMMUNITY', action: 'community →', theme }),
      },
    ],
    ...cardRows(
      communities.map((entry, index) => ({
        file: `community-${index + 1}`,
        alt: `${entry.title}: ${entry.description} ${entry.cta}`,
        href: entry.url,
        card: (theme) => ({
          index: String(index + 1).padStart(2, '0'),
          meta: entry.meta,
          title: entry.title,
          description: entry.description,
          cta: entry.cta,
          accent: entry.accent ?? theme.accent,
          ctaTone: entry.accent ? 'on-brand' : 'on-accent',
          coverUri: entry.coverUri,
        }),
      })),
    ),
    [
      {
        file: 'label-contact',
        alt: 'Contact',
        href: profile.url,
        render: (theme) => sectionLabel({ index: '04', title: 'CONTACT', theme }),
      },
    ],
    links.map((link, index) => ({
      file: `link-${index + 1}`,
      alt: link.label,
      href: link.url,
      render: (theme) => linkButton({ link, theme }),
    })),
  ];

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
  const rows = [];
  for (const row of panels) {
    const rendered = [];
    for (const panel of row) {
      rendered.push({ ...panel, version: await writePanel(panel.file, panel.render, themes) });
    }
    rows.push(rendered);
  }
  await writeFile(new URL('README.md', root), renderReadme(rows));
  console.log(`Built ${rows.flat().length} panels for ${Object.keys(themes).length} themes.`);
}

await build();
