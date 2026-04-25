---
title: Prism
description: Partial writable focus on optional data or union branches.
section: API
navTitle: Prism
order: 220
---

# Prism

A `Prism<S, A>` focuses zero or one value `A` inside a source `S`.

```ts
type Prism<S, A> = {
  readonly _tag: 'prism'
  readonly get: (s: S) => A | undefined
  readonly set: (a: A | ((a: A) => A)) => <T extends S>(s: T) => T
}
```

## Create A Prism

```ts
import { Prism } from '@fuiste/optics'

type Person = {
  name: string
  address?: { city: string }
}

const address = Prism<Person>().of({
  get: (person) => person.address,
  set: (address) => (person) => ({ ...person, address }),
})
```

## Missing Targets

```ts
address.get({ name: 'Ada' })
// undefined

address.set((value) => ({ ...value, city: 'London' }))({ name: 'Ada' })
// { name: 'Ada' }
```

Concrete `set` values can materialize optional data when the prism's own setter does so.

```ts
address.set({ city: 'London' })({ name: 'Ada' })
// { name: 'Ada', address: { city: 'London' } }
```

## Notes

- `get` returns `undefined` for absent targets.
- Functional updates are no-ops when the target is absent.
- `guard`, `at`, and `index` are prism combinators for common cases.
