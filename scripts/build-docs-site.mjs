import path from 'node:path'
import { buildDocsSite } from './docs-site.mjs'

const repoRoot = globalThis.process.cwd()

await buildDocsSite({
  repoRoot,
  outDir: path.join(repoRoot, 'dist', 'docs-site'),
})
