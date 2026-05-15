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
      <p class="eyebrow">Slides</p>
      <h1>Presentation Archive</h1>
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
    <meta name="viewport" content="width=device-width,height=device-height,initial-scale=1">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <title>${escapeHtml(presentation.title)}</title>
    <style>
      html, body {
        height: 100%;
        margin: 0;
      }

      body {
        background: #000;
        color: #fff;
        overflow: hidden;
      }

      .marp-view {
        position: relative;
        width: 100%;
        height: 100%;
      }

      .marpit {
        width: 100%;
        height: 100%;
      }

      .marpit > svg[data-marpit-svg] {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.15s linear;
      }

      .marpit > svg[data-marpit-svg].is-active {
        opacity: 1;
        pointer-events: auto;
      }

      .marp-osc {
        position: absolute;
        left: 50%;
        bottom: 32px;
        z-index: 2;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        border-radius: 10px;
        background: rgba(0, 0, 0, 0.68);
        color: #fff;
        transform: translateX(-50%);
        font-family: Helvetica, Arial, sans-serif;
        font-size: 16px;
        line-height: 1;
        user-select: none;
      }

      .marp-osc button {
        appearance: none;
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font: inherit;
        opacity: 0.86;
        padding: 0 2px;
      }

      .marp-osc button:hover {
        opacity: 1;
      }

      .marp-osc button:disabled {
        opacity: 0.2;
        cursor: not-allowed;
      }

      .marp-osc-page {
        min-width: 7em;
        text-align: center;
        opacity: 0.9;
      }

      @media (max-width: 640px) {
        .marp-osc {
          bottom: 18px;
          font-size: 14px;
          padding: 10px;
        }

        .marp-osc-page {
          min-width: 5.5em;
        }
      }
    </style>
    <style>${rendered.css}</style>
  </head>
  <body>
    <div class="marp-view">
      <div class="marp-osc" aria-label="Slide controls">
        <button type="button" data-action="prev" aria-label="Previous slide">Prev</button>
        <span class="marp-osc-page" data-page>1 / 1</span>
        <button type="button" data-action="next" aria-label="Next slide">Next</button>
        <button type="button" data-action="fullscreen" aria-label="Toggle fullscreen">Full</button>
      </div>
      ${rendered.html}
    </div>
    <script>
      (() => {
        const slides = Array.from(document.querySelectorAll('.marpit > svg[data-marpit-svg]'))
        if (slides.length === 0) return

        const page = document.querySelector('[data-page]')
        const prev = document.querySelector('[data-action="prev"]')
        const next = document.querySelector('[data-action="next"]')
        const fullscreen = document.querySelector('[data-action="fullscreen"]')

        const clamp = (index) => Math.max(0, Math.min(index, slides.length - 1))

        const parseHash = () => {
          const matched = window.location.hash.match(/^#(\\d+)$/)
          if (!matched) return 0
          return clamp(Number.parseInt(matched[1], 10) - 1)
        }

        let current = parseHash()

        const render = () => {
          slides.forEach((slide, index) => {
            slide.classList.toggle('is-active', index === current)
          })

          if (page) page.textContent = \`\${current + 1} / \${slides.length}\`
          if (prev) prev.disabled = current === 0
          if (next) next.disabled = current === slides.length - 1

          const hash = \`#\${current + 1}\`
          if (window.location.hash !== hash) history.replaceState(null, '', hash)
        }

        const move = (delta) => {
          const nextIndex = clamp(current + delta)
          if (nextIndex === current) return
          current = nextIndex
          render()
        }

        prev?.addEventListener('click', () => move(-1))
        next?.addEventListener('click', () => move(1))
        fullscreen?.addEventListener('click', async () => {
          if (document.fullscreenElement) {
            await document.exitFullscreen()
          } else {
            await document.documentElement.requestFullscreen()
          }
        })

        window.addEventListener('hashchange', () => {
          current = parseHash()
          render()
        })

        window.addEventListener('keydown', (event) => {
          if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
            event.preventDefault()
            move(-1)
          } else if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
            event.preventDefault()
            move(1)
          } else if (event.key === 'Home') {
            event.preventDefault()
            current = 0
            render()
          } else if (event.key === 'End') {
            event.preventDefault()
            current = slides.length - 1
            render()
          } else if (event.key.toLowerCase() === 'f') {
            fullscreen?.click()
          }
        })

        render()
      })()
    </script>
  </body>
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
