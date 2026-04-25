---
title: Iso
description: Total invertible mappings between equivalent representations.
section: API
navTitle: Iso
order: 230
---

# Iso

An `Iso<S, A>` is a total invertible mapping between two representations.

```ts
type Iso<S, A> = {
  readonly _tag: 'iso'
  readonly to: (s: S) => A
  readonly from: (a: A) => S
}
```

## Create An Iso

```ts
import { Iso } from '@fuiste/optics'

const numberString = Iso<number, string>({
  to: (value) => `${value}`,
  from: (value) => Number.parseInt(value, 10),
})

numberString.to(42)
// '42'

numberString.from('7')
// 7
```

## Compose With A Lens

```ts
import { Lens, Iso, compose } from '@fuiste/optics'

type Model = { count: number }

const count = Lens<Model>().prop('count')
const numberString = Iso<number, string>({
  to: (value) => `${value}`,
  from: (value) => Number.parseInt(value, 10),
})

const countAsString = compose(count, numberString)

countAsString.get({ count: 7 })
// '7'

countAsString.set('10')({ count: 7 })
// { count: 10 }
```

## Notes

- `to` and `from` should be inverses.
- `Iso` is transparent in most composition: `Lens ∘ Iso` is still a `Lens`.
- `Iso ∘ Iso` is an `Iso`.
