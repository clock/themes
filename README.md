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

## Deployment

The repository includes a GitHub Actions workflow that builds the site and deploys the static `dist` output to GitHub Pages on pushes to `main`.