import { promises as fs } from 'node:fs'
import path from 'node:path'
import { marked } from 'marked'

const DOCS_DIR_NAME = 'docs'
const HOME_PAGE_ID = 'home'

const SITE_STYLES = `:root {
  color-scheme: light;
  --page-bg: #f4f1ea;
  --panel-bg: rgba(255, 252, 246, 0.92);
  --panel-border: rgba(53, 46, 36, 0.14);
  --text: #201a13;
  --muted: #6c5d4f;
  --accent: #93552f;
  --accent-soft: rgba(147, 85, 47, 0.12);
  --code-bg: #f0e7dc;
  --shadow: 0 28px 80px rgba(32, 26, 19, 0.08);
  font-family:
    'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif;
}

* {
  box-sizing: border-box;
}

html {
  min-height: 100%;
  background:
    radial-gradient(circle at top, rgba(147, 85, 47, 0.16), transparent 32%),
    linear-gradient(180deg, #f7f2ea 0%, #efe9dd 100%);
}

body {
  margin: 0;
  min-height: 100vh;
  color: var(--text);
  background: transparent;
}

a {
  color: var(--accent);
}

.layout {
  width: min(1200px, calc(100vw - 2rem));
  margin: 0 auto;
  padding: 2rem 0 3rem;
  display: grid;
  gap: 1.5rem;
}

.shell {
  display: grid;
  grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
}

.panel {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  box-shadow: var(--shadow);
  backdrop-filter: blur(14px);
}

.sidebar {
  position: sticky;
  top: 1rem;
  padding: 1.25rem;
  border-radius: 1.5rem;
}

.eyebrow {
  margin: 0 0 0.75rem;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

.sidebar h1 {
  margin: 0 0 0.75rem;
  font-size: clamp(1.6rem, 2.4vw, 2.2rem);
  line-height: 1;
}

.sidebar p {
  margin: 0 0 1rem;
  color: var(--muted);
}

.sidebar nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.35rem;
}

.sidebar nav a {
  display: block;
  padding: 0.65rem 0.8rem;
  text-decoration: none;
  color: inherit;
  border-radius: 0.85rem;
  transition:
    transform 140ms ease,
    background-color 140ms ease,
    color 140ms ease;
}

.sidebar nav a:hover,
.sidebar nav a:focus-visible {
  transform: translateX(4px);
  background: rgba(255, 255, 255, 0.55);
}

.sidebar nav a[aria-current='page'] {
  background: var(--accent-soft);
  color: var(--accent);
}

.content {
  padding: clamp(1.25rem, 2.2vw, 2rem);
  border-radius: 2rem;
}

.content article {
  max-width: 72ch;
}

.content h1,
.content h2,
.content h3,
.content h4 {
  line-height: 1.1;
}

.content h1 {
  font-size: clamp(2.4rem, 4vw, 3.4rem);
  margin-top: 0;
}

.content p,
.content li {
  font-size: 1.05rem;
  line-height: 1.7;
}

.content table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
}

.content th,
.content td {
  padding: 0.75rem;
  border: 1px solid var(--panel-border);
  vertical-align: top;
}

.content thead {
  background: rgba(147, 85, 47, 0.08);
}

.content pre,
.content code {
  font-family:
    'SFMono-Regular', 'SFMono', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace;
}

.content code {
  background: var(--code-bg);
  padding: 0.12rem 0.32rem;
  border-radius: 0.4rem;
}

.content pre {
  overflow-x: auto;
  padding: 1rem;
  border-radius: 1rem;
  background: #17130f;
  color: #fdf7ef;
}

.content pre code {
  background: transparent;
  padding: 0;
  color: inherit;
}

.content blockquote {
  margin: 1.5rem 0;
  padding: 0.25rem 1rem;
  border-left: 4px solid rgba(147, 85, 47, 0.35);
  color: var(--muted);
}

.source-note {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--panel-border);
  font-size: 0.95rem;
  color: var(--muted);
}

@media (max-width: 900px) {
  .layout {
    width: min(100vw - 1rem, 100%);
    padding-top: 1rem;
  }

  .shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }
}`

function asPosixPath(value) {
  return value.split(path.sep).join(path.posix.sep)
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function routeSegmentsFromDocPath(docPath) {
  const withoutExtension = docPath.replace(/\.md$/u, '')

  if (withoutExtension === 'README') {
    return []
  }

  return withoutExtension.split('/').flatMap((segment) => (segment === 'README' ? [] : [segment]))
}

function outputFileFromRouteSegments(routeSegments) {
  return routeSegments.length === 0 ? 'index.html' : path.posix.join(...routeSegments, 'index.html')
}

function normalizeRelativeHref(fromOutputFile, toOutputFile) {
  const relativePath = path.posix.relative(path.posix.dirname(fromOutputFile), toOutputFile)

  if (toOutputFile === 'index.html') {
    return relativePath === 'index.html' ? './' : relativePath
  }

  if (relativePath.endsWith('/index.html')) {
    const href = relativePath.slice(0, -'index.html'.length)
    return href === '' ? './' : href
  }

  return relativePath === '' ? './' : relativePath
}

function isExternalHref(href) {
  return /^[a-z][a-z0-9+.-]*:/iu.test(href) || href.startsWith('//')
}

function splitHref(href) {
  const hashIndex = href.indexOf('#')

  if (hashIndex === -1) {
    return { pathname: href, hash: '' }
  }

  return {
    pathname: href.slice(0, hashIndex),
    hash: href.slice(hashIndex),
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'))
}

export async function loadDocsSiteManifest(repoRoot) {
  const docsDir = path.join(repoRoot, DOCS_DIR_NAME)
  const manifestPath = path.join(docsDir, 'navigation.json')
  const manifest = await readJson(manifestPath)

  assert(manifest.formatVersion === 1, `Unsupported docs navigation format in ${manifestPath}`)
  assert(
    manifest.home &&
      typeof manifest.home.title === 'string' &&
      typeof manifest.home.path === 'string',
    `Invalid home entry in ${manifestPath}`,
  )
  assert(Array.isArray(manifest.pages), `Invalid pages entry in ${manifestPath}`)

  const sourcePaths = new Set()

  const buildPage = async (entry, isHome) => {
    assert(
      typeof entry.title === 'string' && entry.title.length > 0,
      `Invalid title for ${entry.path}`,
    )
    assert(
      typeof entry.path === 'string' && entry.path.endsWith('.md'),
      `Invalid path for ${entry.title}`,
    )

    const sourcePath = path.resolve(docsDir, entry.path)
    const relativeSourcePath = asPosixPath(path.relative(docsDir, sourcePath))

    assert(
      sourcePath.startsWith(`${docsDir}${path.sep}`) || sourcePath === docsDir,
      `Docs path escapes docs directory: ${entry.path}`,
    )
    assert(
      !sourcePaths.has(relativeSourcePath),
      `Duplicate docs path in navigation: ${relativeSourcePath}`,
    )

    sourcePaths.add(relativeSourcePath)
    await fs.access(sourcePath)

    const routeSegments = routeSegmentsFromDocPath(relativeSourcePath)
    const outputFile = outputFileFromRouteSegments(routeSegments)
    const logicalRoute = routeSegments.length === 0 ? '/' : `/${routeSegments.join('/')}/`

    return {
      id: isHome ? HOME_PAGE_ID : entry.id,
      title: entry.title,
      docPath: relativeSourcePath,
      sourcePath,
      routeSegments,
      outputFile,
      logicalRoute,
      isHome,
    }
  }

  const home = await buildPage(manifest.home, true)
  const pages = await Promise.all(
    manifest.pages.map(async (entry) => {
      assert(
        typeof entry.id === 'string' && entry.id.length > 0,
        `Invalid page id for ${entry.path}`,
      )
      return buildPage(entry, false)
    }),
  )

  const pageIds = new Set()

  for (const page of pages) {
    assert(!pageIds.has(page.id), `Duplicate page id in docs navigation: ${page.id}`)
    pageIds.add(page.id)
  }

  return {
    docsDir,
    manifestPath,
    home,
    pages,
    orderedPages: [home, ...pages],
  }
}

function createRenderer(page, pageIndex) {
  const renderer = new marked.Renderer()

  renderer.link = function renderLink({ href = '', title, tokens }) {
    const text = this.parser.parseInline(tokens)
    const resolvedHref = rewriteMarkdownHref(page, pageIndex, href)

    if (title == null) {
      return `<a href="${escapeHtml(resolvedHref)}">${text}</a>`
    }

    return `<a href="${escapeHtml(resolvedHref)}" title="${escapeHtml(title)}">${text}</a>`
  }

  return renderer
}

function rewriteMarkdownHref(currentPage, pageIndex, href) {
  if (href === '' || href.startsWith('#') || isExternalHref(href)) {
    return href
  }

  const { pathname, hash } = splitHref(href)

  if (!pathname.endsWith('.md')) {
    return href
  }

  const currentSourceDir = path.posix.dirname(currentPage.docPath)
  const resolvedSourcePath = path.posix.normalize(path.posix.join(currentSourceDir, pathname))
  const targetPage = pageIndex.get(resolvedSourcePath)

  if (targetPage == null) {
    return href
  }

  return `${normalizeRelativeHref(currentPage.outputFile, targetPage.outputFile)}${hash}`
}

function renderNavigation(currentPage, orderedPages) {
  const items = orderedPages
    .map((page) => {
      const href = normalizeRelativeHref(currentPage.outputFile, page.outputFile)
      const current = page.id === currentPage.id ? ' aria-current="page"' : ''
      return `<li><a href="${escapeHtml(href)}"${current}>${escapeHtml(page.title)}</a></li>`
    })
    .join('')

  return `<nav aria-label="Documentation"><ul>${items}</ul></nav>`
}

function renderDocument(page, orderedPages, contentHtml) {
  const navigationHtml = renderNavigation(page, orderedPages)
  const pageTitle = `${page.title} | Optics documentation`

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(pageTitle)}</title>
    <link rel="stylesheet" href="${escapeHtml(normalizeRelativeHref(page.outputFile, 'styles.css'))}" />
  </head>
  <body>
    <main class="layout">
      <div class="shell">
        <aside class="panel sidebar">
          <p class="eyebrow">Canonical docs</p>
          <h1>Optics</h1>
          <p>Static GitHub Pages wrapper over the repository-local Markdown tree.</p>
          ${navigationHtml}
        </aside>
        <section class="panel content">
          <article>${contentHtml}</article>
          <p class="source-note">Source: <code>docs/${escapeHtml(page.docPath)}</code></p>
        </section>
      </div>
    </main>
  </body>
</html>
`
}

async function writeFileEnsuringDirectory(filePath, contents) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, contents, 'utf8')
}

export async function buildDocsSite({
  repoRoot,
  outDir = path.join(repoRoot, 'dist', 'docs-site'),
} = {}) {
  const manifest = await loadDocsSiteManifest(repoRoot)
  const pageIndex = new Map(manifest.orderedPages.map((page) => [page.docPath, page]))

  await fs.rm(outDir, { force: true, recursive: true })
  await fs.mkdir(outDir, { recursive: true })

  await Promise.all([
    writeFileEnsuringDirectory(path.join(outDir, 'styles.css'), SITE_STYLES),
    writeFileEnsuringDirectory(path.join(outDir, '.nojekyll'), ''),
    writeFileEnsuringDirectory(
      path.join(outDir, 'navigation.json'),
      `${JSON.stringify(
        {
          formatVersion: 1,
          home: {
            title: manifest.home.title,
            path: manifest.home.docPath,
            route: manifest.home.logicalRoute,
          },
          pages: manifest.pages.map((page) => ({
            id: page.id,
            title: page.title,
            path: page.docPath,
            route: page.logicalRoute,
          })),
        },
        null,
        2,
      )}\n`,
    ),
  ])

  for (const page of manifest.orderedPages) {
    const markdown = await fs.readFile(page.sourcePath, 'utf8')
    const contentHtml = marked.parse(markdown, {
      gfm: true,
      renderer: createRenderer(page, pageIndex),
    })
    const html = renderDocument(page, manifest.orderedPages, contentHtml)

    await writeFileEnsuringDirectory(path.join(outDir, page.outputFile), html)
  }

  return {
    outDir,
    pages: manifest.orderedPages.map((page) => ({
      id: page.id,
      title: page.title,
      source: `docs/${page.docPath}`,
      route: page.logicalRoute,
      outputFile: page.outputFile,
    })),
  }
}
