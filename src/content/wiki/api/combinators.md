---
title: Combinators
description: Helper constructors for unions, records, arrays, and traversals.
section: API
navTitle: Combinators
order: 270
---

# Combinators

Combinators cover the common optics you do not want to rebuild by hand.

## `guard`

Creates a prism from a TypeScript type guard.

```ts
import { guard } from '@fuiste/optics'

type Circle = { type: 'circle'; radius: number }
type Square = { type: 'square'; side: number }
type Shape = Circle | Square

const circle = guard<Shape, Circle>((shape): shape is Circle => shape.type === 'circle')

circle.get({ type: 'circle', radius: 5 })
// { type: 'circle', radius: 5 }

circle.get({ type: 'square', side: 4 })
// undefined
```

## `at`

Creates a prism for a record key.

```ts
import { at } from '@fuiste/optics'

const authorization = at<string>('Authorization')

authorization.get({ Authorization: 'Bearer token' })
// 'Bearer token'

authorization.set('Bearer next')({})
// { Authorization: 'Bearer next' }
```

## `index`

Creates a prism for a single array element.

```ts
import { index } from '@fuiste/optics'

const second = index<number>(1)

second.get([10, 20, 30])
// 20

second.set(99)([10, 20, 30])
// [10, 99, 30]
```

## `each`

Creates a traversal for every element in an array.

```ts
import { each } from '@fuiste/optics'

const numbers = each<number>()

numbers.modify((value) => value * 2)([1, 2, 3])
// [2, 4, 6]
```
