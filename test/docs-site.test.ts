import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { buildDocsSite, loadDocsSiteManifest } from '../scripts/docs-site.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tempDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })),
  )
})

describe('docs site builder', () => {
  it('derives the site home and navigation from docs/navigation.json', async () => {
    const manifest = await loadDocsSiteManifest(repoRoot)

    expect(manifest.home.docPath).toBe('README.md')
    expect(manifest.orderedPages.map((page) => page.title)).toEqual([
      'Optics documentation',
      'Quick start',
      'Composition',
      'Combinators',
      'API reference',
      'Semantics and laws',
      'Best practices',
    ])
  })

  it('projects markdown files into the site output without duplicating prose sources', async () => {
    const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), 'optics-docs-site-'))
    tempDirectories.push(fixtureRoot)

    const docsDir = path.join(fixtureRoot, 'docs')
    const outDir = path.join(fixtureRoot, 'dist', 'docs-site')

    await mkdir(docsDir, { recursive: true })

    await Promise.all([
      writeFile(
        path.join(docsDir, 'navigation.json'),
        JSON.stringify(
          {
            formatVersion: 1,
            home: {
              title: 'Fixture docs',
              path: 'README.md',
            },
            pages: [
              {
                id: 'guide',
                title: 'Guide',
                path: 'guide.md',
              },
            ],
          },
          null,
          2,
        ),
      ),
      writeFile(path.join(docsDir, 'README.md'), '# Fixture docs\n\nSee the [Guide](guide.md).\n'),
      writeFile(path.join(docsDir, 'guide.md'), '# Guide\n\nFirst version.\n'),
    ])

    await buildDocsSite({ repoRoot: fixtureRoot, outDir })

    const navigation = JSON.parse(await readFile(path.join(outDir, 'navigation.json'), 'utf8'))
    const homeHtml = await readFile(path.join(outDir, 'index.html'), 'utf8')
    const guideHtmlPath = path.join(outDir, 'guide', 'index.html')

    expect(navigation).toEqual({
      formatVersion: 1,
      home: {
        title: 'Fixture docs',
        path: 'README.md',
        route: '/',
      },
      pages: [
        {
          id: 'guide',
          title: 'Guide',
          path: 'guide.md',
          route: '/guide/',
        },
      ],
    })
    expect(homeHtml).toContain('href="guide/"')
    expect(await readFile(guideHtmlPath, 'utf8')).toContain('First version.')

    await writeFile(path.join(docsDir, 'guide.md'), '# Guide\n\nSecond version.\n')
    await buildDocsSite({ repoRoot: fixtureRoot, outDir })

    const rebuiltGuideHtml = await readFile(guideHtmlPath, 'utf8')
    expect(rebuiltGuideHtml).toContain('Second version.')
    expect(rebuiltGuideHtml).not.toContain('First version.')
  })
})
