# Optics

This guide explains the six optic kinds in this library and when to use each one.

Each section uses only APIs exported in the README: constructors (`Lens`, `Prism`, `Iso`, `Traversal`, `Getter`, `Fold`) and `compose`.

## Lens — total focus for required data

`Lens` is for required, always-present structure: one location that always exists for the source type.

Why it exists and when to use:
- Read and write a single field that should always resolve.
- Model local, deterministic update paths that should be total at the type level.
- Compose nested reads/writes from small property lenses.

Practical behavior:
- `Lens<S, A>` has `get` and `set`.
- `set` accepts either a concrete value or an updater function.
- `set` returns a new source value; unchanged results can be preserved by reference.

```ts
import { Lens } from '@fuiste/optics'

type Person = { name: string; age: number }

const nameLens = Lens<Person>().prop('name')
const p: Person = { name: 'Ada', age: 31 }

nameLens.get(p) // 'Ada'
nameLens.set('Grace')(p) // { name: 'Grace', age: 31 }
nameLens.set((name) => name.toUpperCase())(p) // { name: 'ADA', age: 31 }
```

## Prism — partial focus for optional/union data

`Prism` is for optional or conditional structure: data that may not be present.

Why it exists and when to use:
- Focus into optional fields and union branches safely.
- Keep read/write APIs partial (`undefined` when missing, no-op updates).
- Preserve full source type when a branch is absent.

Practical behavior:
- `Prism<S, A>` has `get` and `set`.
- `get` returns `A | undefined`.
- `set` is safe on missing branches; updater functions are treated as no-ops when missing.

```ts
import { Prism } from '@fuiste/optics'

type User = { name: string; email?: { local: string; domain: string } }

const emailPrism = Prism<User>().of({
  get: (u) => u.email,
  set: (email) => (u) => ({ ...u, email }),
})

emailPrism.get({ name: 'Ada' }) // undefined
emailPrism.get({ name: 'Ada', email: { local: 'a', domain: 'x.com' } }) // { local: 'a', domain: 'x.com' }
emailPrism.set({ local: 'a', domain: 'mail.com' })({ name: 'Ada' }) // { name: 'Ada', email: { local: 'a', domain: 'mail.com' } }
emailPrism.set((next) => ({ ...next, domain: 'mail.com' }))({ name: 'Ada' }) // unchanged (updater no-op when missing)
emailPrism.set((next) => ({ ...next, domain: 'mail.com' }))({
  name: 'Ada',
  email: { local: 'a', domain: 'x.com' },
}) // email.domain becomes 'mail.com'
```

## Iso — invertible mapping

`Iso` is for a total one-to-one transformation between two representations.

Why it exists and when to use:
- Use when you need reversible conversion without branch loss.
- Treat the two sides as equivalent views of the same information.
- Compose with writable optics when you want to keep the outer shape intact.

Practical behavior:
- `Iso<S, A>` exposes `to` and `from`.
- There is no partial path: both directions are required.
- Composition keeps it invertible when paired with another `Iso`; with other optics, `Iso` does not block updates.

```ts
import { Iso } from '@fuiste/optics'

const numberString = Iso<number, string>({
  to: (n) => `${n}`,
  from: (s) => parseInt(s, 10),
})

numberString.to(5) // '5'
numberString.from('42') // 42
```

## Traversal — multiple-focus writable transformation

`Traversal` is for zero-or-more focused values that can be bulk-transformed.

Why it exists and when to use:
- Apply one function across all matching targets (`all`, `many`, repeated structure).
- Read collections as a list and still support bulk in-place-like immutable updates.
- Best for repeated fields, list elements, and nested composed traversals.

Practical behavior:
- `Traversal<S, A>` has `getAll` and `modify`.
- `modify` applies the function to every focused value and returns a new source.
- In composed chains, if a composed partial branch has no values, nothing changes.

```ts
import { Lens, compose, each } from '@fuiste/optics'

type Team = { members: string[] }

const teamMembers = compose(Lens<Team>().prop('members'), each<string>())

teamMembers.getAll({ members: ['ada', 'turing'] }) // ['ada', 'turing']
teamMembers.modify((name) => name.toUpperCase())({ members: ['ada', 'turing'] })
// => { members: ['ADA', 'TURING'] }
```

## Getter — read-only single-value projection

`Getter` is for derived or read-only values: one computed focus that should not be set.

Why it exists and when to use:
- Compute values without exposing write semantics.
- Project computed fields for reads, formatting, and display.
- Keep write access out of API boundaries where mutation is invalid.

Practical behavior:
- `Getter<S, A>` only has `get`.
- `set`/`modify` do not exist.
- Composing through a Getter makes results read-only.

```ts
import { Lens, Getter, compose } from '@fuiste/optics'

type Person = { firstName: string; lastName: string }
type Team = { lead: Person }

const lead = Lens<Team>().prop('lead')
const fullName = Getter<Person, string>((p) => `${p.firstName} ${p.lastName}`)

const teamLeadName = compose(lead, fullName)
teamLeadName.get({ lead: { firstName: 'Ada', lastName: 'Lovelace' } }) // 'Ada Lovelace'
```

## Fold — read-only multi-value extraction

`Fold` is for extracting many values for reading only.

Why it exists and when to use:
- Read lists of leaves from data without introducing write paths.
- Normalize or summarize without permitting mutation.
- Useful for reporting and introspection where extraction is the only operation.

Practical behavior:
- `Fold<S, A>` only has `getAll`.
- Useful to compose from traversable structures into read-only views.
- Any write capability upstream is removed once Fold is involved.

```ts
import { Fold } from '@fuiste/optics'

const words = Fold<string, string>((s) => s.split(' '))

words.getAll('focus optics') // ['focus', 'optics']
```

## Composition notes for quick selection

- Any composition containing `Fold` results in `Fold`.
- `Getter + total optic` can remain read-only (`Getter`) while `Getter + partial optic` becomes `Fold`.
- `Traversal` propagates writability for nested collection operations (`Traversal` result).
- `Iso` does not impose partiality: it lets the other side determine the kind (`Lens`, `Prism`, `Traversal`, etc.) unless both sides are `Iso`.
