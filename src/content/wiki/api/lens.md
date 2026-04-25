---
title: Lens
description: Total writable focus on required data.
section: API
navTitle: Lens
order: 210
---

# Lens

A `Lens<S, A>` focuses exactly one required value `A` inside a source `S`.

```ts
type Lens<S, A> = {
  readonly _tag: 'lens'
  readonly get: (s: S) => A
  readonly set: (a: A | ((a: A) => A)) => <T extends S>(s: T) => T
}
```

## Create A Property Lens

```ts
import { Lens } from '@fuiste/optics'

type Person = {
  name: string
  age: number
}

const name = Lens<Person>().prop('name')
```

## Read And Write

```ts
name.get({ name: 'Ada', age: 36 })
// 'Ada'

name.set('Grace')({ name: 'Ada', age: 36 })
// { name: 'Grace', age: 36 }

name.set((value) => value.toUpperCase())({ name: 'Ada', age: 36 })
// { name: 'ADA', age: 36 }
```

## Notes

- `get` always succeeds.
- `set` never mutates the input.
- Unchanged values preserve reference identity.
- Array numeric property lenses are supported, but `index` and `each` are usually clearer.
