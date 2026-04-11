# Combinators

Combinators are small helpers for common optic patterns you hit repeatedly.

## `guard` — type-safe optional branch

Use `guard` to build partial selectors from TypeScript type guards.

```ts
import { guard, Lens, compose } from '@fuiste/optics'

type Shape = { type: 'circle'; radius: number } | { type: 'square'; side: number }

const circleRadius = compose(
  guard<Shape, { type: 'circle'; radius: number }>((shape): shape is { type: 'circle'; radius: number } =>
    shape.type === 'circle'),
  Lens<{ type: 'circle'; radius: number }>().prop('radius'),
)

circleRadius.get({ type: 'circle', radius: 10 }) // 10
circleRadius.get({ type: 'square', side: 4 }) // undefined
```

## `at` — partial record key access

Use `at` for optional fields inside objects.

```ts
import { at } from '@fuiste/optics'

const authHeader = at<string>('authorization')
const headers = { authorization: 'token-1', accept: 'application/json' } as const

authHeader.get(headers) // 'token-1'
authHeader.set('token-2')(headers) // { authorization: 'token-2', accept: 'application/json' }
```

## `index` — optional array element

Use `index` for safe per-position access.

```ts
import { index } from '@fuiste/optics'

const secondItem = index<string>(1)
secondItem.get(['a', 'b', 'c']) // 'b'
secondItem.get(['a']) // undefined
secondItem.set('z')(['a', 'b', 'c']) // ['a', 'z', 'c']
```

## `each` — traversal over all elements

Use `each` for batch extraction and updates.

```ts
import { each } from '@fuiste/optics'

const allScores = each<number>()
allScores.getAll([1, 2, 3]) // [1, 2, 3]
allScores.modify((value) => value + 1)([1, 2, 3]) // [2, 3, 4]
```

## Recommended order for first usage

1. Start with `Lens`/`Prism` constructors.
2. Reach for `each` and `index` for arrays.
3. Use `guard` and `at` when optional structure appears.

## Navigation

- [Optics Overview](optics.md)
- [Composition](composition.md)
