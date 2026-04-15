# Quick start

Use this page after installing `@fuiste/optics` from the root [`README.md`](../README.md).
The aim here is not to restate the whole README, but to give you a compact path from "I have nested immutable data" to "I know which optic I need".

## The shortest taxonomy

- Use `Lens` for a required value.
- Use `Prism` for an optional value or a union branch.
- Use `Iso` for a total reversible representation change.
- Use `Traversal` for zero or more writable values.
- Use `Getter` for a computed read-only value.
- Use `Fold` for extracted read-only collections.

The distinction is categorical rather than cosmetic:

- total vs partial
- one focus vs many foci
- writable vs read-only

[Composition](composition.md) is where those axes become a matrix.

## Start with a `Lens`

`Lens` is the default when the path is required all the way down.

```ts
import { Lens, compose } from '@fuiste/optics'

type Profile = {
  user: {
    name: string
  }
}

const userLens = Lens<Profile>().prop('user')
const nameLens = Lens<Profile['user']>().prop('name')
const profileName = compose(userLens, nameLens)

const profile: Profile = { user: { name: 'Ada' } }

profileName.get(profile) // 'Ada'
profileName.set('Grace')(profile) // { user: { name: 'Grace' } }
profileName.set((name) => name.toUpperCase())(profile) // { user: { name: 'ADA' } }
```

If the update does not actually change the focused value, the library preserves the original reference where it can prove that fact. The tests assert this for `Lens`, `Prism`, `index`, and `each`; see [Semantics and laws](semantics-and-laws.md).

## Switch to `Prism` when a branch can disappear

`Prism` models partial focus. Reads may fail, so `get` returns `undefined`.

```ts
import { Lens, Prism, compose } from '@fuiste/optics'

type Address = { city: string }
type Person = { name: string; address?: Address }

const addressPrism = Prism<Person>().of({
  get: (person) => person.address,
  set: (address) => (person) => ({ ...person, address }),
})

const cityPrism = compose(addressPrism, Lens<Address>().prop('city'))

cityPrism.get({ name: 'Ada', address: { city: 'London' } }) // 'London'
cityPrism.get({ name: 'Ada' }) // undefined
cityPrism.set('Paris')({ name: 'Ada' }) // unchanged
```

That final line is important. A bare `Prism` can still materialize a missing branch if its own setter knows how to do so, but a composed partial path does not invent missing intermediate structure by default. The main exception is `Prism ∘ Iso`, covered in [Composition](composition.md).

## Use combinators when the shape is already standard

Four helpers cover the common constructors:

- `guard(predicate)` for discriminated unions
- `at(key)` for record entries
- `index(i)` for a single array slot
- `each()` for all elements of an array

```ts
import { Lens, compose, each, guard, index } from '@fuiste/optics'

type Circle = { type: 'circle'; radius: number }
type Square = { type: 'square'; side: number }
type Shape = Circle | Square
type Scene = { shapes: Shape[] }

const shapes = Lens<Scene>().prop('shapes')
const allShapes = compose(shapes, each<Shape>())
const circles = compose(
  allShapes,
  guard<Shape, Circle>((shape): shape is Circle => shape.type === 'circle'),
)
const radii = compose(circles, Lens<Circle>().prop('radius'))

radii.getAll({
  shapes: [
    { type: 'circle', radius: 2 },
    { type: 'square', side: 3 },
  ],
}) // [2]

const secondShape = compose(shapes, index<Shape>(1))
secondShape.get({
  shapes: [
    { type: 'circle', radius: 2 },
    { type: 'square', side: 3 },
  ],
})
// { type: 'square', side: 3 }
```

## Read-only optics are first-class, not second-class

Use `Getter` when you want exactly one derived value with no setter.
Use `Fold` when you want zero or more derived values with no modifier.

```ts
import { Fold, Getter, Lens, compose } from '@fuiste/optics'

type Person = { firstName: string; lastName: string }
type Team = { lead: Person; aliases: string }

const fullName = Getter<Person, string>((person) => `${person.firstName} ${person.lastName}`)
const leadName = compose(Lens<Team>().prop('lead'), fullName)

leadName.get({ lead: { firstName: 'Ada', lastName: 'Lovelace' }, aliases: 'analyst mathematician' })
// 'Ada Lovelace'

const aliasWords = compose(
  Lens<Team>().prop('aliases'),
  Fold<string, string>((s) => s.split(' ')),
)
aliasWords.getAll({
  lead: { firstName: 'Ada', lastName: 'Lovelace' },
  aliases: 'analyst mathematician',
})
// ['analyst', 'mathematician']
```

When read-only optics appear in composition, the result degrades to `Getter` or `Fold` depending on whether multiplicity or partiality has entered the picture.

## Where to go next

- Continue to [Composition](composition.md) for the result-kind matrix and the behaviour of read-only compositions.
- Continue to [Combinators](combinators.md) for the exact semantics of `guard`, `at`, `index`, and `each`.
- Continue to [API reference](api-reference.md) for the public signatures and exported utility types.
- Continue to [Semantics and laws](semantics-and-laws.md) for immutability, no-op rules, and round-trip expectations.
