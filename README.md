# Theme Gallery

Static React gallery for browsing a curated theme catalog, previewing each theme across the full page, and copying portable theme exports for other projects.

## Stack

- Vite
- React
- TypeScript
- GitHub Pages

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

The Vite base path is configured for GitHub Pages at `/themes/`.

## Data flow

- `scraper.js` is a local-only helper and is ignored by git.
- Running `scraper.js` writes `src/data/themes.generated.json`.
- The app reads the committed generated JSON and does not fetch data at runtime.

## Deployment

The repository includes a GitHub Actions workflow that builds the site and deploys the static `dist` output to GitHub Pages on pushes to `main`.