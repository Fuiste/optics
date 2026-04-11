# Getting Started

This guide explains how to begin using Optics with practical, low-friction examples.

## Prerequisites

- Working TypeScript setup (strict mode preferred)
- Node.js dependencies installed for this package

## First steps

1. Start from the project root.
2. Read the [Optics Overview](optics.md) to understand the concept.
3. Follow the examples here before introducing custom APIs.

## Install dependencies

From the package root:

```bash
pnpm install
```

## Your first optic

Build a nested update in three lines:

```ts
import { Lens, compose, each } from '@fuiste/optics'

type Team = { members: Array<{ name: string; role: string }> }

const teamMembers = Lens<Team>().prop('members')
const memberNames = compose(compose(teamMembers, each<{ name: string; role: string }>()), Lens<{ name: string; role: string }>().prop('name'))
const team: Team = { members: [{ name: 'Ada', role: 'lead' }, { name: 'Lin', role: 'engineer' }] }

memberNames.getAll(team) // ['Ada', 'Lin']
memberNames.modify((name) => name.toUpperCase())(team)
// => { members: [{ name: 'ADA', role: 'lead' }, { name: 'LIN', role: 'engineer' }] }
```

## Next
Continue to [Optics Overview](optics.md) for terminology and all core optic kinds.
