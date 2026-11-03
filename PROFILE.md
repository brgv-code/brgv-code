# Profile generator

`README.md` and everything in `profile/` are generated. Edit `profile.config.json` or the
scripts, never the output.

## What comes from where

| Panel | Source |
|---|---|
| Header, status strip, contact links | `profile.config.json` |
| Project cards | GitHub API (description, language, last push, homepage), sorted by last push, in a 2x2 grid. Each shows its `screenshot` (a 1920x1080 capture in `assets/screenshots/`, cropped by `crop` as `[left, top, width, height]` fractions) and uses its `accent` for the top stripe and the `projectCta` button |
| Writing | The newest `writing.count` posts in `writing.feed` (bhargav.dev RSS), as cards with each post's og:image |
| Community | `community.entries`; `cover` names a page whose og:image becomes the cover, and an entry without one gets a poster in its `accent` |
| Header chart | `scripts/lib/growth-curve.mjs`, generated, so it only changes when that code does |

Colors mirror the bhargav.dev design tokens and live under `themes` in the config. Every panel
is rendered twice, light and dark, and the README picks one with `prefers-color-scheme`.

## Build and check

```bash
npm install
npm test
npm run lint
GITHUB_TOKEN=$(gh auth token) npm run build
```

The token is optional locally; without it the GitHub API allows 60 requests an hour.

## Updates

`.github/workflows/refresh.yml` rebuilds daily and on every change to the config, scripts or
fonts, then commits the output only when it changed. A failed fetch fails the run, so the last
good profile stays up.

## Font

Geist Pixel Square (SIL Open Font License, `fonts/OFL.txt`), subset to Latin and a few arrows
so it can be embedded in every SVG. Regenerate the subset and its width table with:

```bash
pyftsubset GeistPixel-Square.woff2 --flavor=woff2 --output-file=fonts/geist-pixel-square.woff2 \
  --unicodes="U+0020-007E,U+00A0-00FF,U+00B7,U+2013,U+2018,U+2019,U+201C,U+201D,U+2026,U+2192,U+2193,U+2197"
```

then rewrite `fonts/geist-pixel-square.metrics.json` from the subset's `hmtx` advances.
