# Composition

Composition is the center of the library.
Instead of writing bespoke nested accessors and hoping the edge cases line up, you compose small optics and let the result kind be inferred from the pair.

## The result-kind matrix

All six optic kinds compose through `compose(outer, inner)`.
The tests cover the full matrix below.

| outer \\ inner | `Lens`      | `Prism`     | `Iso`       | `Traversal` | `Getter` | `Fold` |
| -------------- | ----------- | ----------- | ----------- | ----------- | -------- | ------ |
| `Lens`         | `Lens`      | `Prism`     | `Lens`      | `Traversal` | `Getter` | `Fold` |
| `Prism`        | `Prism`     | `Prism`     | `Prism`     | `Traversal` | `Fold`   | `Fold` |
| `Iso`          | `Lens`      | `Prism`     | `Iso`       | `Traversal` | `Getter` | `Fold` |
| `Traversal`    | `Traversal` | `Traversal` | `Traversal` | `Traversal` | `Fold`   | `Fold` |
| `Getter`       | `Getter`    | `Fold`      | `Getter`    | `Fold`      | `Getter` | `Fold` |
| `Fold`         | `Fold`      | `Fold`      | `Fold`      | `Fold`      | `Fold`   | `Fold` |

This is not merely type-level decoration. The tag determines which operations exist on the composed optic:

- `Lens` and `Prism` expose `get` and `set`
- `Traversal` exposes `getAll` and `modify`
- `Getter` exposes only `get`
- `Fold` exposes only `getAll`
- `Iso` exposes `to` and `from`

## Why the matrix looks this way

### Total, partial, and many

- `Lens` is total and singular.
- `Prism` is partial and singular.
- `Traversal` is many-valued.
- `Getter` is total and read-only.
- `Fold` is many-valued and read-only.
- `Iso` is total and reversible, so it acts like a transparent representation change unless paired with another `Iso`.

The result kind is the least surprising optic that can still represent the combined behaviour.

### Read-only is contagious

`Getter` and `Fold` never grow setters by composition.

- `Getter ∘ Lens` is still `Getter`.
- `Getter ∘ Iso` is still `Getter`.
- `Lens ∘ Getter` is `Getter`.
- As soon as partiality or multiplicity enters a `Getter` composition, the result becomes `Fold`.
- Any pair involving `Fold` yields `Fold`.

Representative examples:

```ts
import { Fold, Getter, Lens, Prism, compose } from '@fuiste/optics'

type Person = { firstName: string; lastName: string; address?: { city: string } }

const fullName = Getter<Person, string>((person) => `${person.firstName} ${person.lastName}`)
const city = compose(
  Getter<Person, Person>((person) => person),
  Prism<Person>().of({
    get: (person) => person.address,
    set: (address) => (person) => ({ ...person, address }),
  }),
)

fullName._tag // 'getter'
city._tag // 'fold'
```

The second result is `Fold` because a read-only optic composed with a partial optic cannot promise a total single focus.

### Traversal absorbs writable optics

When a writable many-focus optic participates, the result stays writable-many unless read-only forces degradation.

- `Lens ∘ Traversal` is `Traversal`
- `Traversal ∘ Prism` is `Traversal`
- `Traversal ∘ Traversal` is `Traversal`
- `Traversal ∘ Getter` is `Fold`

This reflects the shape of the operations: once you can focus on many writable values, later single-focus writable optics simply refine each element.

### `Iso` is transparent, except when it is not

`Iso` behaves like a representational isomorphism, so the other optic kind usually wins:

- `Lens ∘ Iso` is `Lens`
- `Iso ∘ Lens` is `Lens`
- `Prism ∘ Iso` is `Prism`
- `Iso ∘ Traversal` is `Traversal`

Only `Iso ∘ Iso` remains `Iso`, because invertibility survives on both sides.

## Representative compositions

### `Lens ∘ Lens => Lens`

```ts
import { Lens, compose } from '@fuiste/optics'

type Address = { city: string }
type Person = { address: Address }

const city = compose(Lens<Person>().prop('address'), Lens<Address>().prop('city'))

city.get({ address: { city: 'London' } }) // 'London'
city.set('Paris')({ address: { city: 'London' } }) // { address: { city: 'Paris' } }
```

Because both optics are total and singular, the result remains total and singular.

### `Prism ∘ Lens => Prism`

```ts
import { Lens, Prism, compose } from '@fuiste/optics'

type Address = { city: string }
type Person = { address?: Address }

const address = Prism<Person>().of({
  get: (person) => person.address,
  set: (next) => (person) => ({ ...person, address: next }),
})

const city = compose(address, Lens<Address>().prop('city'))

city.get({ address: { city: 'London' } }) // 'London'
city.get({}) // undefined
city.set('Paris')({}) // unchanged
```

The outer partiality dominates. Once the branch is missing, a composed write is a no-op rather than an invented nested update.

### `Lens ∘ Getter => Getter`

```ts
import { Getter, Lens, compose } from '@fuiste/optics'

type Person = { firstName: string; lastName: string }
type Team = { lead: Person }

const fullName = Getter<Person, string>((person) => `${person.firstName} ${person.lastName}`)
const leadName = compose(Lens<Team>().prop('lead'), fullName)

leadName.get({ lead: { firstName: 'Ada', lastName: 'Lovelace' } }) // 'Ada Lovelace'
```

The result is read-only because the inner optic is read-only.

### `Lens ∘ Fold => Fold`

```ts
import { Fold, Lens, compose } from '@fuiste/optics'

type Team = { aliases: string }

const aliasWords = compose(
  Lens<Team>().prop('aliases'),
  Fold<string, string>((s) => s.split(' ')),
)

aliasWords.getAll({ aliases: 'lead mentor reviewer' }) // ['lead', 'mentor', 'reviewer']
```

Read-many stays read-many.

### `Lens ∘ Traversal => Traversal`

```ts
import { Lens, compose, each } from '@fuiste/optics'

type Team = { members: string[] }

const allMembers = compose(Lens<Team>().prop('members'), each<string>())

allMembers.getAll({ members: ['Ada', 'Grace'] }) // ['Ada', 'Grace']
allMembers.modify((name) => name.toUpperCase())({ members: ['Ada', 'Grace'] })
// { members: ['ADA', 'GRACE'] }
```

`Traversal#modify` maps every focus and preserves identity when no focused element changes.

## The `Prism ∘ Iso` exception

Most composed prism writes are no-ops when the outer branch is missing.
One exception is deliberate: `Prism ∘ Iso` can materialize a concrete value because the `Iso` can reconstruct the missing intermediate.

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

countText.get({}) // undefined
countText.set('9')({}) // { count: 9 }
countText.set((value) => `${parseInt(value, 10) + 1}`)({}) // unchanged
```

Concrete writes can materialize because `from('9')` yields a number that the outer prism can set.
Function-updater writes still require an existing focus and remain a no-op when absent.

## Composition discipline

The practical rule is simple:

- Build the smallest optic that describes one step.
- Compose outward-to-inward with `compose(outer, inner)`.
- Let the resulting tag tell you whether you now have `set`, `modify`, `get`, or `getAll`.

If you find yourself guessing the result kind, consult the matrix instead of relying on intuition. Mutable code has already done enough damage without type-level wishful thinking joining in.

## Related pages

- [Quick start](quick-start.md) for the first few compositions.
- [Combinators](combinators.md) for the helpers that commonly appear in compositions.
- [Semantics and laws](semantics-and-laws.md) for no-op behaviour, identity preservation, and round-trip expectations.
