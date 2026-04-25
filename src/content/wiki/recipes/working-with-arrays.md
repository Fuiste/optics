---
title: Working With Arrays
description: Update one array element or every array element immutably.
section: Recipes
navTitle: Working With Arrays
order: 310
---

# Working With Arrays

Use `index` for one element and `each` for all elements.

## One Element

```ts
import { Lens, compose, index } from '@fuiste/optics'

type Cart = { items: Array<{ name: string; quantity: number }> }

const items = Lens<Cart>().prop('items')
const firstItem = compose(items, index<Cart['items'][number]>(0))
const quantity = Lens<Cart['items'][number]>().prop('quantity')
const firstQuantity = compose(firstItem, quantity)

firstQuantity.set((value) => value + 1)({
  items: [{ name: 'tea', quantity: 1 }],
})
// { items: [{ name: 'tea', quantity: 2 }] }
```

Out-of-bounds indexes are no-ops.

```ts
firstQuantity.set(2)({ items: [] })
// { items: [] }
```

## Every Element

```ts
import { Lens, compose, each } from '@fuiste/optics'

const allItems = compose(items, each<Cart['items'][number]>())
const allQuantities = compose(allItems, quantity)

allQuantities.modify((value) => value + 1)({
  items: [
    { name: 'tea', quantity: 1 },
    { name: 'coffee', quantity: 2 },
  ],
})
// { items: [{ name: 'tea', quantity: 2 }, { name: 'coffee', quantity: 3 }] }
```
