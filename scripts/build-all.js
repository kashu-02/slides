#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const SLIDES_DIR = path.join(process.cwd(), 'slides')
const GENERATED_DIR = path.join(process.cwd(), 'server', 'generated')
const GENERATED_FILE = path.join(GENERATED_DIR, 'presentations.ts')

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webp': 'image/webp',
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function isPresentationDirectory(entryPath) {
  return fs.statSync(entryPath).isDirectory() && fs.existsSync(path.join(entryPath, 'slide.md'))
}

function listPresentations() {
  if (!fs.existsSync(SLIDES_DIR)) return []

  return fs
    .readdirSync(SLIDES_DIR)
    .map((entry) => ({ name: entry, fullPath: path.join(SLIDES_DIR, entry) }))
    .filter((entry) => isPresentationDirectory(entry.fullPath))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!match) return { body: markdown, frontmatter: '' }

  return {
    body: markdown.slice(match[0].length),
    frontmatter: match[1],
  }
}

function extractTitle(markdown, fallback) {
  const { body } = parseFrontmatter(markdown)
  const match = body.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : fallback
}

function isUnlisted(dirPath, markdown) {
  if (fs.existsSync(path.join(dirPath, '.unlisted'))) return true

  const { frontmatter } = parseFrontmatter(markdown)
  return /(^|\n)unlisted:\s*true(\n|$)/.test(frontmatter)
}

function collectAssets(assetRoot, prefix = 'fig') {
  if (!fs.existsSync(assetRoot)) return {}

  const assets = {}
  for (const entry of fs.readdirSync(assetRoot, { withFileTypes: true })) {
    const absolutePath = path.join(assetRoot, entry.name)
    const assetPath = `${prefix}/${entry.name}`

    if (entry.isDirectory()) {
      Object.assign(assets, collectAssets(absolutePath, assetPath))
      continue
    }

    const extension = path.extname(entry.name).toLowerCase()
    assets[assetPath] = {
      contentType: MIME_TYPES[extension] || 'application/octet-stream',
      data: fs.readFileSync(absolutePath).toString('base64'),
    }
  }

  return assets
}

function buildManifest() {
  const manifest = {}

  for (const presentation of listPresentations()) {
    const markdownPath = path.join(presentation.fullPath, 'slide.md')
    const markdown = readUtf8(markdownPath)

    manifest[presentation.name] = {
      slug: presentation.name,
      title: extractTitle(markdown, presentation.name),
      markdown,
      unlisted: isUnlisted(presentation.fullPath, markdown),
      assets: collectAssets(path.join(presentation.fullPath, 'fig')),
    }
  }

  return manifest
}

function writeManifest(manifest) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true })

  const contents = `export type PresentationAsset = {\n  contentType: string\n  data: string\n}\n\nexport type PresentationEntry = {\n  slug: string\n  title: string\n  markdown: string\n  unlisted: boolean\n  assets: Record<string, PresentationAsset>\n}\n\nexport const presentations: Record<string, PresentationEntry> = ${JSON.stringify(manifest, null, 2)}\n`

  fs.writeFileSync(GENERATED_FILE, contents)
}

function main() {
  console.log('Generating presentation manifest...')
  const manifest = buildManifest()
  writeManifest(manifest)
  console.log(`Found ${Object.keys(manifest).length} presentation(s).`)
  console.log(`Wrote ${path.relative(process.cwd(), GENERATED_FILE)}`)
}

main()
