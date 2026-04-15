import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { Marked, Renderer } from 'marked'

const rootDir = process.cwd()
const docsDir = path.join(rootDir, 'docs')
const outputDir = path.join(rootDir, 'dist', 'pages')
const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const styleSourcePath = path.join(scriptDir, 'docs-site.css')
const navigationPath = path.join(docsDir, 'navigation.json')

const readJson = (targetPath) => JSON.parse(readFileSync(targetPath, 'utf8'))
const toPosixPath = (targetPath) => targetPath.split(path.sep).join(path.posix.sep)
const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const getGitValue = (command) => {
  try {
    return execSync(command, {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim()
  } catch {
    return ''
  }
}

const parseRepositorySlug = (remote) => {
  if (remote.startsWith('git@github.com:')) {
    return remote.slice('git@github.com:'.length).replace(/\.git$/, '')
  }

  if (remote.startsWith('https://github.com/')) {
    return remote.slice('https://github.com/'.length).replace(/\.git$/, '')
  }

  return ''
}

const splitHref = (href) => {
  const [pathPart, fragment = ''] = href.split('#', 2)
  return {
    pathPart,
    fragment: fragment === '' ? '' : `#${fragment}`,
  }
}

const toRouteSegments = (docPath) => {
  const withoutExtension = docPath.replace(/\.md$/u, '')
  const parsed = path.posix.parse(withoutExtension)

  if (parsed.base === 'README') {
    return parsed.dir === '' ? [] : parsed.dir.split('/')
  }

  return withoutExtension.split('/')
}

const toRouteDir = (segments) => segments.join('/')

const relativeDirHref = (fromDir, toDir) => {
  const relativePath = path.posix.relative(fromDir || '.', toDir || '.')

  if (relativePath === '' || relativePath === '.') {
    return './'
  }

  return relativePath.endsWith('/') ? relativePath : `${relativePath}/`
}

const relativeFileHref = (fromDir, targetPath) => {
  const relativePath = path.posix.relative(fromDir || '.', targetPath)
  return relativePath === '' ? './' : relativePath
}

const navigation = readJson(navigationPath)

if (navigation.formatVersion !== 1) {
  throw new Error(`Unsupported docs navigation format: ${String(navigation.formatVersion)}`)
}

const repoSlug =
  process.env.GITHUB_REPOSITORY ||
  parseRepositorySlug(getGitValue('git config --get remote.origin.url'))
const repoBranch =
  process.env.GITHUB_REF_NAME ||
  process.env.GITHUB_HEAD_REF ||
  getGitValue('git rev-parse --abbrev-ref HEAD')

const repoBlobHref = (repoRelativePath) => {
  if (repoSlug === '' || repoBranch === '') return null
  return `https://github.com/${repoSlug}/blob/${repoBranch}/${repoRelativePath}`
}

const entries = [
  {
    id: 'home',
    title: navigation.home.title,
    docPath: navigation.home.path,
    isHome: true,
  },
  ...navigation.pages.map((page) => ({
    id: page.id,
    title: page.title,
    docPath: page.path,
    isHome: false,
  })),
].map((entry) => {
  const routeSegments = toRouteSegments(entry.docPath)
  const routeDir = toRouteDir(routeSegments)
  const sourcePath = path.join(docsDir, entry.docPath)

  return {
    ...entry,
    routeSegments,
    routeDir,
    sourcePath,
    outputPath: path.join(outputDir, ...routeSegments, 'index.html'),
    repoPath: toPosixPath(path.relative(rootDir, sourcePath)),
  }
})

const entryByDocPath = new Map(entries.map((entry) => [entry.docPath, entry]))
const homeEntry = entries.find((entry) => entry.isHome)

if (homeEntry === undefined) {
  throw new Error('Docs navigation is missing a home entry')
}

const renderNavigation = (currentEntry) =>
  entries
    .map((entry) => {
      const href = relativeDirHref(currentEntry.routeDir, entry.routeDir)
      const stateClass = entry.id === currentEntry.id ? ' is-active' : ''

      return `<li><a class="site-nav__link${stateClass}" href="${href}">${escapeHtml(entry.title)}</a></li>`
    })
    .join('')

const markedForEntry = (entry) => {
  const renderer = new Renderer()

  renderer.link = function link(token) {
    const text = this.parser.parseInline(token.tokens)
    const titleAttribute = token.title ? ` title="${escapeHtml(token.title)}"` : ''

    if (!token.href) {
      return text
    }

    const rewrittenHref = rewriteHref(entry, token.href)
    return `<a href="${escapeHtml(rewrittenHref)}"${titleAttribute}>${text}</a>`
  }

  renderer.heading = function heading(token) {
    const inlineHtml = this.parser.parseInline(token.tokens)
    const headingId = slugify(token.text)
    const idAttribute = headingId === '' ? '' : ` id="${headingId}"`
    return `<h${token.depth}${idAttribute}>${inlineHtml}</h${token.depth}>`
  }

  return new Marked({
    gfm: true,
    renderer,
  })
}

const rewriteHref = (entry, href) => {
  if (
    href.startsWith('#') ||
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:')
  ) {
    return href
  }

  const { pathPart, fragment } = splitHref(href)

  if (pathPart === '') {
    return fragment === '' ? './' : fragment
  }

  const targetSourcePath = path.resolve(path.dirname(entry.sourcePath), pathPart)
  const docsRelativePath = toPosixPath(path.relative(docsDir, targetSourcePath))
  const repoRelativePath = toPosixPath(path.relative(rootDir, targetSourcePath))
  const docsEntry = entryByDocPath.get(docsRelativePath)

  if (docsEntry !== undefined) {
    return `${relativeDirHref(entry.routeDir, docsEntry.routeDir)}${fragment}`
  }

  if (!repoRelativePath.startsWith('..')) {
    const blobHref = repoBlobHref(repoRelativePath)
    if (blobHref !== null) {
      return `${blobHref}${fragment}`
    }
  }

  return href
}

const renderPage = (entry) => {
  const markdown = readFileSync(entry.sourcePath, 'utf8')
  const html = markedForEntry(entry).parse(markdown)
  const stylesheetHref = relativeFileHref(entry.routeDir, 'assets/docs-site.css')
  const sourceHref = repoBlobHref(entry.repoPath)
  const sourceLink =
    sourceHref === null
      ? ''
      : `<a class="site-header__source" href="${escapeHtml(sourceHref)}">View source</a>`

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(entry.title)} | ${escapeHtml(homeEntry.title)}</title>
    <link rel="stylesheet" href="${escapeHtml(stylesheetHref)}" />
  </head>
  <body>
    <div class="site-shell">
      <header class="site-header">
        <a class="site-header__brand" href="${relativeDirHref(entry.routeDir, homeEntry.routeDir)}">${escapeHtml(homeEntry.title)}</a>
        ${sourceLink}
      </header>
      <div class="site-layout">
        <aside class="site-sidebar">
          <nav aria-label="Documentation">
            <ul class="site-nav">
              ${renderNavigation(entry)}
            </ul>
          </nav>
        </aside>
        <main class="site-content">
          <article class="prose">
            ${html}
          </article>
        </main>
      </div>
    </div>
  </body>
</html>
`
}

rmSync(outputDir, { recursive: true, force: true })
mkdirSync(path.join(outputDir, 'assets'), { recursive: true })

for (const entry of entries) {
  mkdirSync(path.dirname(entry.outputPath), { recursive: true })
  writeFileSync(entry.outputPath, renderPage(entry))
}

writeFileSync(
  path.join(outputDir, 'assets', 'docs-site.css'),
  readFileSync(styleSourcePath, 'utf8'),
)
writeFileSync(path.join(outputDir, '.nojekyll'), '')
