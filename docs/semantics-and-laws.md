# Semantics and laws

The library is built around immutable updates, explicit partiality, and reference preservation when a change can be proven to be no change at all.
If a mutation-based shortcut feels tempting, that is usually a sign you are trying to smuggle side effects through an optic-shaped hole.

## Immutability

Writable optics return updated structures instead of mutating inputs.
This is exercised across the tests for `Lens`, `Prism`, `index`, composed optics, and traversals.

- `Lens#set` returns a new structure when the focus changes.
- `Prism#set` returns a new structure when the focus exists and changes, or when its concrete setter materializes a branch.
- `Traversal#modify` returns a new structure when any focused value changes.
- `Getter` and `Fold` are read-only by construction; they expose no `set` or `modify`.

## Value-or-updater semantics

`Lens#set` and `Prism#set` both accept either:

- a concrete replacement value
- an updater function `(current) => next`

The two forms are not interchangeable in partial situations.

### Concrete writes

Concrete writes can materialize when the optic itself knows how to construct the missing branch:

- a bare `Prism` created with `Prism().of(...)` delegates to its own setter
- `guard` can replace a non-matching branch with a matching one
- `at` upserts a missing key
- `Prism ∘ Iso` can materialize because the `Iso` can reconstruct the missing intermediate value

### Updater writes

Updater writes require a current focused value.
If the optic cannot read a current value, the update is a no-op.

This holds for:

- `Prism().of(...)` when `get` returns `undefined`
- `guard` on a non-matching branch
- `at` on an absent key
- `index` when out of bounds
- composed partial paths where an outer branch is missing
- `Prism ∘ Iso` when the outer branch is missing

## Absent-branch no-ops in composed paths

The key operational rule for composition is that missing intermediate branches do not get fabricated by default.

```ts
import { Lens, Prism, compose } from '@fuiste/optics'

type Address = { city: string }
type Person = { address?: Address }

const address = Prism<Person>().of({
  get: (person) => person.address,
  set: (next) => (person) => ({ ...person, address: next }),
})

const city = compose(address, Lens<Address>().prop('city'))

city.get({}) // undefined
city.set('Paris')({}) // unchanged
city.set((name) => name.toUpperCase())({}) // unchanged
```

That behaviour is what keeps a composed `Prism` honest. Without it, partial optics would quietly become structure-synthesis machinery.

## `Prism ∘ Iso` materialization

There is one explicit exception to the general no-op rule.

```ts
import { Iso, Prism, compose } from '@fuiste/optics'

type Model = { count?: number }

const count = Prism<Model>().of({
  get: (model) => model.count,
  set: (next) => (model) => ({ ...model, count: next }),
})

const asString = Iso<number, string>({
  to: (n) => `${n}`,
  from: (s) => parseInt(s, 10),
})

const countText = compose(count, asString)

countText.set('9')({}) // { count: 9 }
countText.set((value) => `${parseInt(value, 10) + 1}`)({}) // unchanged
```

The distinction is deliberate:

- a concrete value can be pushed backward through the `Iso` via `from`
- an updater function still needs an existing focused value to run against

## Traversal semantics

`Traversal` is the writable many-focus optic.

- `getAll` returns every focused value in order.
- `modify` applies the mapper to every focused value.
- If a traversal is composed through a missing outer `Prism`, `modify` is a no-op.
- The built-in `each()` traversal preserves the original array reference when no element changes.

Representative example:

```ts
import { each } from '@fuiste/optics'

const nums = each<number>()

nums.getAll([1, 2, 3]) // [1, 2, 3]
nums.modify((n) => n * 2)([1, 2, 3]) // [2, 4, 6]
nums.modify((n) => n)([1, 2, 3]) // same array reference
```

## Identity preservation

Where the implementation can prove that an update is unchanged, it returns the original source reference.
This is an observable and tested property, not an accidental optimization.

Examples covered by the tests:

- `Lens#set` with the existing value returns the original source.
- `Lens#set` with an identity updater returns the original source.
- `Prism#set` returns the original source when the branch is unchanged.
- `index(i)` returns the original array when the focused element is unchanged or out of bounds.
- `each().modify(identity)` returns the original array.
- composed `Lens` and composed `Prism` updates preserve identity when the focused value does not change.

Do not assume the converse. A changed value may still force new outer structure, because immutability is doing its job.

## Law-like expectations

### Lens laws

The test suite encodes the familiar lens laws:

- get-set: `lens.set(lens.get(s))(s) === s`
- set-get: `lens.get(lens.set(a)(s)) === a`
- set-set: the latest write wins

These are exercised on a composed lens, which is the interesting case because it verifies nested immutable updates rather than trivial projection.

### Iso round-trips

The test suite also asserts the usual isomorphism expectations:

- `from(to(s)) === s`
- `to(from(a)) === a`

Those equalities are only as honest as the functions you supply to `Iso`. An `Iso` whose `to` and `from` are not actual inverses is merely a pair of functions wearing a fake moustache.

## Read-only outcomes

When a composition yields `Getter` or `Fold`, mutation operations disappear from the API.

- `Getter` has `get` and no `set`
- `Fold` has `getAll` and no `modify`

This is both a semantic constraint and a practical one: the composed value literally lacks those methods.

## Related pages

- [Composition](composition.md) for the result-kind matrix behind these behaviours.
- [Combinators](combinators.md) for the standard partial and many-focus constructors.
- [Best practices](best-practices.md) for guidance on using these guarantees without turning your data model into performance theater.
