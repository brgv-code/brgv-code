import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { ditherMask, maskToPngDataUri } from './lib/dither.mjs';
import { growthField } from './lib/growth-curve.mjs';
import {
  CARD,
  HEADER,
  header,
  linkButton,
  listRow,
  projectCard,
  sectionLabel,
  statusStrip,
} from './lib/panels.mjs';
import { renderReadme } from './lib/readme.mjs';
import { screenshotDataUri } from './lib/screenshot.mjs';
import { fetchPosts, fetchRepo } from './lib/sources.mjs';

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
      const bannerUri = await screenshotDataUri(
        image,
        project.crop,
        CARD.bannerWidth,
        CARD.bannerHeight,
      );
      return { repo, bannerUri, accent: project.accent };
    }),
  );
  return projects.sort(
    (projectA, projectB) => Date.parse(projectB.repo.pushedAt) - Date.parse(projectA.repo.pushedAt),
  );
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

  const [projects, posts] = await Promise.all([
    loadProjects(config),
    fetchPosts(writing.feed, writing.count),
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
    ...pairs(
      projects.map(({ repo, bannerUri, accent }, index) => ({
        file: `project-${index + 1}`,
        alt: `${repo.name}: ${repo.description} ${config.projectCta}`,
        href: repo.url,
        render: (theme) =>
          projectCard({
            repo,
            accent,
            cta: config.projectCta,
            position: index + 1,
            side: index % 2 === 0 ? 'left' : 'right',
            theme,
            bannerUri,
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
    ...posts.map((post, index) => [
      {
        file: `post-${index + 1}`,
        alt: `${post.title} (${post.date})`,
        href: post.url,
        render: (theme) => listRow({ ...post, meta: post.date, theme }),
      },
    ]),
    [
      {
        file: 'label-community',
        alt: 'Community',
        href: community.url,
        render: (theme) =>
          sectionLabel({ index: '03', title: 'COMMUNITY', action: 'community →', theme }),
      },
    ],
    ...community.entries.map((entry, index) => [
      {
        file: `community-${index + 1}`,
        alt: `${entry.title}: ${entry.description}`,
        href: entry.url,
        render: (theme) => listRow({ ...entry, theme }),
      },
    ]),
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
