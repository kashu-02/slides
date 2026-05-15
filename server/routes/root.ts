import { Marp } from '@marp-team/marp-core'
import { Hono } from 'hono'
import { presentations } from '../generated/presentations'

const root = new Hono()
const marp = new Marp({ html: true })

root.get('/', (c) => {
  const listed = Object.values(presentations)
    .filter((presentation) => !presentation.unlisted)
    .sort((left, right) => left.slug.localeCompare(right.slug))

  const items = listed
    .map(
      (presentation) => `
        <li class="deck-card">
          <a href="/${presentation.slug}/" class="deck-link">
            <span class="deck-slug">${escapeHtml(presentation.slug)}</span>
            <span class="deck-title">${escapeHtml(presentation.title)}</span>
          </a>
        </li>`,
    )
    .join('')

  return c.html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Presentation Archive</title>
    <style>
      :root {
        --bg: linear-gradient(160deg, #f5efdf 0%, #d8e2f7 55%, #b5c89c 100%);
        --panel: rgba(255, 252, 247, 0.92);
        --ink: #1f2430;
        --muted: #5a6474;
        --accent: #0f6870;
        --line: rgba(31, 36, 48, 0.12);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        padding: 24px;
        background: var(--bg);
        color: var(--ink);
        font-family: "Avenir Next", Avenir, "Segoe UI", sans-serif;
      }
      main {
        max-width: 960px;
        margin: 0 auto;
        padding: 32px;
        border-radius: 28px;
        background: var(--panel);
        border: 1px solid rgba(255, 255, 255, 0.45);
        box-shadow: 0 24px 80px rgba(30, 38, 52, 0.16);
        backdrop-filter: blur(14px);
      }
      .eyebrow {
        margin: 0 0 8px;
        color: var(--accent);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      h1 {
        margin: 0;
        font-size: clamp(2.4rem, 5vw, 4.5rem);
        line-height: 0.94;
        letter-spacing: -0.04em;
      }
      .subtitle {
        margin: 16px 0 0;
        max-width: 40rem;
        color: var(--muted);
        font-size: 1.05rem;
      }
      .deck-list {
        list-style: none;
        margin: 32px 0 0;
        padding: 0;
        display: grid;
        gap: 14px;
      }
      .deck-card {
        border: 1px solid var(--line);
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.72);
      }
      .deck-link {
        display: block;
        padding: 20px 22px;
        color: inherit;
        text-decoration: none;
      }
      .deck-slug {
        display: block;
        font-size: 0.86rem;
        color: var(--accent);
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .deck-title {
        display: block;
        margin-top: 8px;
        font-size: 1.25rem;
        font-weight: 700;
      }
      @media (max-width: 640px) {
        body { padding: 12px; }
        main { padding: 22px 18px; }
      }
    </style>
  </head>
  <body>
    <main>
      <p class="eyebrow">Cloudflare Worker</p>
      <h1>Presentation Archive</h1>
      <p class="subtitle">Markdown slides are rendered on demand through Marp Core and served from Hono routes.</p>
      <ul class="deck-list">${items}</ul>
    </main>
  </body>
</html>`)
})

root.get('/:slug/', (c) => {
  const slug = c.req.param('slug')
  const presentation = presentations[slug]

  if (!presentation) {
    return c.notFound()
  }

  const rendered = marp.render(presentation.markdown)

  return c.html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(presentation.title)}</title>
    <style>${rendered.css}</style>
  </head>
  <body>${rendered.html}</body>
</html>`)
})

root.get('/:slug/fig/*', (c) => {
  const slug = c.req.param('slug')
  const presentation = presentations[slug]
  const assetPath = c.req.path.replace(`/${slug}/`, '')

  if (!presentation) {
    return c.notFound()
  }

  const asset = presentation.assets[assetPath]
  if (!asset) {
    return c.notFound()
  }

  const buffer = Uint8Array.from(atob(asset.data), (char) => char.charCodeAt(0))
  return new Response(buffer, {
    headers: {
      'content-type': asset.contentType,
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
})

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export default root
