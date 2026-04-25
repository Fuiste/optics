---
title: Composition
description: How optic kinds compose and what result types to expect.
section: Concepts
navTitle: Composition
order: 140
---

# Composition

All optics compose with `compose(outer, inner)`.

```ts
import { Lens, compose } from '@fuiste/optics'

const address = Lens<Person>().prop('address')
const city = Lens<Address>().prop('city')

const personCity = compose(address, city)
// Lens<Person, string>
```

## Result Matrix

| outer / inner | Lens      | Prism     | Iso       | Traversal | Getter | Fold |
| ------------- | --------- | --------- | --------- | --------- | ------ | ---- |
| Lens          | Lens      | Prism     | Lens      | Traversal | Getter | Fold |
| Prism         | Prism     | Prism     | Prism     | Traversal | Fold   | Fold |
| Iso           | Lens      | Prism     | Iso       | Traversal | Getter | Fold |
| Traversal     | Traversal | Traversal | Traversal | Traversal | Fold   | Fold |
| Getter        | Getter    | Fold      | Getter    | Fold      | Getter | Fold |
| Fold          | Fold      | Fold      | Fold      | Fold      | Fold   | Fold |

## Rules Of Thumb

- `Fold` is contagious.
- `Getter` plus partial or multiple focus becomes `Fold`.
- `Traversal` absorbs writable optics into another `Traversal`.
- `Iso` is transparent unless both sides are `Iso`.
- `Lens` plus `Lens` is still `Lens`.
- Anything involving a partial writable path tends toward `Prism`.

## Nested Composition

Composition is binary, so compose longer paths by nesting.

```ts
const allEmployeeNames = compose(compose(employees, eachEmployee), name)
```

Yes, a variadic compose would be cute. No, the type inference gods do not grant wishes for free.
