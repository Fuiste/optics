---
title: Fold
description: Read-only extraction of zero or more values.
section: API
navTitle: Fold
order: 260
---

# Fold

A `Fold<S, A>` extracts zero or more values from `S`.

```ts
type Fold<S, A> = {
  readonly _tag: 'fold'
  readonly getAll: (s: S) => ReadonlyArray<A>
}
```

## Create A Fold

```ts
import { Fold } from '@fuiste/optics'

const words = Fold<string, string>((text) => text.split(' '))

words.getAll('hello world')
// ['hello', 'world']
```

## Folds From Composition

Read-only and partial composition often produces a `Fold`.

```ts
import { Getter, Lens, Prism, compose } from '@fuiste/optics'

const address = Prism<Person>().of({
  get: (person) => person.address,
  set: (address) => (person) => ({ ...person, address }),
})
const city = Getter<Address, string>((value) => value.city)

const maybeCity = compose(address, city)
// Fold<Person, string>
```

## Notes

- Folds do not have `set` or `modify`.
- Anything composed with a `Fold` becomes a `Fold`.
- Use a fold when extraction is the point and mutation would be fiction.
