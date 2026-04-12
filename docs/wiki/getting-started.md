# Getting Started

This page is a compact onboarding guide for core Optics workflows.

## Installation

Use the same package-install commands from the project README:

```bash
# npm
npm install @fuiste/optics

# pnpm
pnpm add @fuiste/optics

# yarn
yarn add @fuiste/optics

# bun
bun add @fuiste/optics
```

## Immutability semantics

Optics are immutable and shape-safe:

- `Lens#set` and `Prism#set` return updated values and do not mutate originals.
- `Lens#set` and `Prism#set` accept either a concrete value or updater function.
- `Prism#set` through a missing branch is a **no-op** by default.
- Function updaters are also no-ops when a branch is missing.
- `Prism#get` may return `undefined` when the focused optional path is absent.
- `Getter` and `Fold` are read-only.

## Quick API shape (practical)

Common writable/read-only shapes used by the examples below:

```typescript
type Lens<S, A> = {
  _tag: 'lens'
  get: (s: S) => A
  set: (a: A | ((a: A) => A)) => (s: S) => S
}

type Prism<S, A> = {
  _tag: 'prism'
  get: (s: S) => A | undefined
  set: (a: A | ((a: A) => A)) => (s: S) => S
}

type Traversal<S, A> = {
  _tag: 'traversal'
  getAll: (s: S) => ReadonlyArray<A>
  modify: (f: (a: A) => A) => (s: S) => S
}
```

## Core usage examples

### Lens (required data)

```typescript
import { Lens } from '@fuiste/optics'

type Person = {
  name: string
  age: number
  address: { street: string; city: string }
}

const nameLens = Lens<Person>().prop('name')

const person: Person = { name: 'John', age: 30, address: { street: '123', city: 'NYC' } }

nameLens.get(person) // 'John'
nameLens.set('Jane')(person) // { name: 'Jane', age: 30, address: { ... } }
nameLens.set((name) => name.toUpperCase())(person) // name == 'JOHN'
```

### Prism (optional data)

```typescript
import { Prism } from '@fuiste/optics'

type Person = {
  name: string
  address?: { street: string; city: string }
}

const addressPrism = Prism<Person>().of({
  get: (p) => p.address,
  set: (address) => (p) => ({ ...p, address }),
})

addressPrism.get({ name: 'A' }) // undefined
addressPrism.set({ street: '456', city: 'LA' })({ name: 'A' })
// => { name: 'A', address: { street: '456', city: 'LA' } }

// Functional updater — no-op when absent
addressPrism.set((addr) => ({ ...addr, city: 'LA' }))({
  name: 'A',
  address: { street: '1', city: 'NYC' },
})
// => { name: 'A', address: { street: '1', city: 'LA' } }
```

### Traversal (multiple values)

```typescript
import { Lens, compose, each } from '@fuiste/optics'

type Team = { members: string[] }

const membersLens = Lens<Team>().prop('members')
const eachMember = each<string>()
const allMembers = compose(membersLens, eachMember)

const team: Team = { members: ['Alice', 'Bob'] }

allMembers.getAll(team) // ['Alice', 'Bob']
allMembers.modify((n) => n.toUpperCase())(team)
// => { members: ['ALICE', 'BOB'] }
```

## Next steps

- See [Composition](composition.md) for combining optics and the resulting optic kinds.
- See [Combinators](combinators.md) for `guard`, `at`, `index`, and `each` helpers.
- For behavior details and edge cases (e.g., `Prism ∘ Iso` exception), refer to [README behaviour notes](../README.md#behaviour-notes).
