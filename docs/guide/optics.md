# Optics

This page introduces each optic kind and shows one practical usage pattern per kind.

## What is Optics?

Optics are composable, typed lenses for immutable data. They are useful for safe reads and updates without imperative object mutation.

## Lens — focus a required value

Use `Lens` when the field is guaranteed to exist.

```ts
import { Lens } from '@fuiste/optics'

type Person = { name: string; age: number }

const nameLens = Lens<Person>().prop('name')
nameLens.get({ name: 'Ada', age: 30 }) // 'Ada'
nameLens.set('Ada Lovelace')({ name: 'Ada', age: 30 }) // { name: 'Ada Lovelace', age: 30 }
```

## Prism — focus a partial/optional value

Use `Prism` when the target may be absent.

```ts
import { Prism } from '@fuiste/optics'

type Person = { name: string; address?: { city: string } }
const addressPrism = Prism<Person>().of({
  get: (person) => person.address,
  set: (address) => (person) => ({ ...person, address }),
})

addressPrism.get({ name: 'Ada' }) // undefined
addressPrism.set({ city: 'London' })({ name: 'Ada', address: { city: 'Oxford' } }) // { name: 'Ada', address: { city: 'London' } }
```

## Iso — map bidirectionally

Use `Iso` when you need lossless conversion between two representations.

```ts
import { Iso } from '@fuiste/optics'

const numberString = Iso<number, string>({
  to: (value) => `${value}`,
  from: (text) => Number.parseInt(text, 10),
})

numberString.to(7) // '7'
numberString.from('42') // 42
```

## Traversal — focus many values

Use `Traversal` for arrays or bulk transforms.

```ts
import { Lens, compose, each } from '@fuiste/optics'

type Team = { members: string[] }
const members = compose(Lens<Team>().prop('members'), each<string>())

members.getAll({ members: ['Ada', 'Lin'] }) // ['Ada', 'Lin']
members.modify((name) => name.toUpperCase())({ members: ['Ada', 'Lin'] })
// => { members: ['ADA', 'LIN'] }
```

## Getter and Fold — read-only views

Use `Getter` for a single derived value and `Fold` for multiple extracted values.

```ts
import { Getter, Fold } from '@fuiste/optics'

const words = Fold<string, string>((text) => text.split(' '))
words.getAll('a b c') // ['a', 'b', 'c']

const fullName = Getter<{ first: string; last: string }, string>(
  (person) => `${person.first} ${person.last}`,
)
fullName.get({ first: 'Ada', last: 'Lovelace' }) // 'Ada Lovelace'
```

## Where to read next

- [Composition](composition.md) for combining these primitives.
- [Combinators](combinators.md) for ready-made helpers around these shapes.
