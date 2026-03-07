# Marp Presentations

Automated build and deployment of Marp presentation slides using GitHub Actions and Cloudflare Pages.

## Overview

This repository contains multiple presentations built with [Marp](https://marp.app/). Each presentation is automatically converted to HTML and PDF formats and deployed to Cloudflare Pages.

**Live Site**: [https://kashu-slides.pages.dev](https://kashu-slides.pages.dev) (after setup)

## Repository Structure

```
.
├── .github/workflows/
│   └── deploy.yml           # CI/CD workflow
├── scripts/
│   └── build-all.js         # Build orchestration
├── 20260301_circlet/        # Example presentation
│   ├── slide.md             # Marp source
│   └── fig/                 # Assets (images, etc.)
├── flake.nix                # Nix development environment
├── package.json             # npm dependencies (CI/CD)
└── README.md                # This file
```

## Development Setup

This project supports two development workflows:

### Option 1: Nix (Recommended for Local Development)

Provides a reproducible development environment with all tools pre-configured.

**Requirements**: [Nix](https://nixos.org/download.html) with flakes enabled

```bash
# Enter development shell
nix develop

# You now have access to:
# - marp-cli
# - chromium (for PDF generation)
# - nodejs/npm
# - python3 (for local server)
```

**With direnv** (optional):
```bash
# Install direnv, then:
direnv allow

# Environment automatically loads when you cd into the directory
```

### Option 2: npm (Used in CI/CD)

Standard Node.js workflow, same as GitHub Actions uses.

**Requirements**: Node.js 20+

```bash
# Install dependencies
npm install

# Build all presentations
npm run build

# Clean build artifacts
npm run clean
```

## Building Presentations

### Build All Presentations

```bash
npm run build
```

This will:
- Discover all directories containing `slide.md`
- Build HTML and PDF for each presentation
- Copy assets (e.g., `fig/` directories)
- Generate a landing page at `dist/index.html`
- Exclude unlisted presentations from the landing page

### Local Preview

```bash
# After building, serve the dist directory
cd dist
python3 -m http.server 8000

# Open http://localhost:8000 in your browser
```

## Adding New Presentations

1. Create a new directory with any name (e.g., `20260302_my-talk/` or `my-presentation/`)
2. Add a `slide.md` file with Marp content:

```markdown
---
marp: true
theme: default
---

# My Presentation

Your content here
```

3. (Optional) Add a `fig/` directory for images/assets
4. Commit and push to trigger automatic deployment

## Unlisting Presentations

To keep a presentation built but hidden from the landing page:

### Method 1: File-based (Recommended)

Create a `.unlisted` file in the presentation directory:

```bash
touch my-presentation/.unlisted
```

### Method 2: Frontmatter

Add to your `slide.md` frontmatter:

```yaml
---
marp: true
unlisted: true
---
```

**Behavior**:
- Unlisted presentations are still built and deployed
- Accessible via direct URL (e.g., `https://site.pages.dev/my-presentation/`)
- Not shown on the landing page

**Use cases**:
- Draft/WIP presentations
- Internal presentations
- Archived content

## CI/CD Deployment

### Automatic Deployment

The GitHub Actions workflow automatically:
- Builds on every push to `main` and `create-ci-cd` branches
- Creates preview deployments for pull requests
- Deploys to Cloudflare Pages

### One-Time Setup

1. **Create Cloudflare Pages Project**:
   - Go to Cloudflare Dashboard → Pages → Create a project
   - Choose "Direct Upload" (not GitHub integration)
   - Project name: `kashu-slides` (or update in `deploy.yml`)

2. **Get Cloudflare Credentials**:
   - **Account ID**: Cloudflare Dashboard → Account (in sidebar)
   - **API Token**: Dashboard → Profile → API Tokens → Create Token
     - Use "Edit Cloudflare Workers" template
     - Permissions: Account | Cloudflare Pages | Edit

3. **Add GitHub Secrets**:
   - Repository → Settings → Secrets and variables → Actions
   - Add `CLOUDFLARE_API_TOKEN` (from step 2)
   - Add `CLOUDFLARE_ACCOUNT_ID` (from step 2)

4. **Update Workflow** (if needed):
   - Edit `.github/workflows/deploy.yml`
   - Set `projectName` to match your Cloudflare Pages project

### Deployment URLs

- **Production** (main branch): `https://kashu-slides.pages.dev`
- **Preview** (PRs): Automatically commented on pull requests
- **Individual presentations**: `https://kashu-slides.pages.dev/20260301_circlet/`
- **PDFs**: `https://kashu-slides.pages.dev/20260301_circlet/slide.pdf`

## Build Process Details

### Presentation Discovery

The build script automatically discovers presentations:
- Scans all directories in the repository root
- Looks for `slide.md` files
- Excludes system directories (`.github`, `scripts`, `node_modules`, etc.)

**Flexible naming**: Any directory name works (dates, descriptive names, etc.)

### Build Output

```
dist/
├── index.html                 # Landing page
├── 20260301_circlet/
│   ├── index.html            # Presentation HTML
│   ├── slide.pdf             # PDF export
│   └── fig/                  # Copied assets
└── other-presentation/
    ├── index.html
    └── slide.pdf
```

## Troubleshooting

### Build Fails Locally

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Nix Development Shell Issues

```bash
# Update flake lock
nix flake update

# Force rebuild
nix develop --rebuild
```

### GitHub Actions Failure

1. Check the Actions tab for error logs
2. Verify GitHub secrets are set correctly
3. Ensure Cloudflare project name matches `deploy.yml`

### Missing Presentations on Landing Page

Check if the presentation is marked as unlisted:
- Look for `.unlisted` file in the directory
- Check `unlisted: true` in `slide.md` frontmatter

## License

[Add your license here]

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run build`
5. Submit a pull request

## Resources

- [Marp Documentation](https://marpit.marp.app/)
- [Marp CLI](https://github.com/marp-team/marp-cli)
- [Cloudflare Pages](https://pages.cloudflare.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
