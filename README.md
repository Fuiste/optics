# Optics

Type-safe, functional optics for immutable data in TypeScript.

**Docs front door:** https://fuiste.github.io/optics/

`@fuiste/optics` gives you small composable optics for reading and updating immutable structures without hand-writing every nested spread.

- **Lens** — total focus on required data
- **Prism** — partial focus on optional data or union branches
- **Iso** — total, invertible mapping between two types
- **Traversal** — focus on zero or more values
- **Getter** — read-only total focus
- **Fold** — read-only zero-or-more extraction

## Installation

```bash
pnpm add @fuiste/optics
```

```bash
npm install @fuiste/optics
yarn add @fuiste/optics
bun add @fuiste/optics
```

## Quick Start

```ts
import { Lens, compose, each } from '@fuiste/optics'

type Team = {
  members: Array<{ name: string }>
}

const members = Lens<Team>().prop('members')
const eachMember = each<Team['members'][number]>()
const name = Lens<Team['members'][number]>().prop('name')

const memberNames = compose(compose(members, eachMember), name)

memberNames.getAll({ members: [{ name: 'Ada' }, { name: 'Grace' }] })
// ['Ada', 'Grace']

memberNames.modify((value) => value.toUpperCase())({
  members: [{ name: 'Ada' }, { name: 'Grace' }],
})
// { members: [{ name: 'ADA' }, { name: 'GRACE' }] }
```

## Development

Requires Node.js `>=20.19.0` and pnpm.

```bash
pnpm install
pnpm test
pnpm test:types
pnpm lint
pnpm format
```

Docs are built with Astro and published to GitHub Pages.

```bash
pnpm docs:dev
pnpm docs:build
pnpm docs:preview
```
