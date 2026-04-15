# Combinators

The standard combinators capture the common cases where writing a custom optic would be ceremonial at best.
They are the small basis that keeps most code from degenerating into ad hoc shape surgery.

## `guard`

`guard` lifts a TypeScript type guard into a `Prism`.
Use it for discriminated unions instead of hand-rolled `Prism().of(...)` definitions.

```ts
import { Lens, compose, guard } from '@fuiste/optics'

type Circle = { type: 'circle'; radius: number }
type Square = { type: 'square'; side: number }
type Shape = Circle | Square

const circle = guard<Shape, Circle>((shape): shape is Circle => shape.type === 'circle')
const radius = compose(circle, Lens<Circle>().prop('radius'))
```

## `at`

`at(key)` creates a prism over a record entry.
Missing keys read as `undefined`; concrete writes upsert; updater writes are no-ops when the key is absent.

## `index`

`index(i)` creates a prism over an array slot.
It is partial by construction, so out-of-bounds reads return `undefined` and writes become no-ops.

## `each`

`each()` creates a traversal over every element of a readonly array.
Compose it when you want to transform every focus rather than a single optional position.

## Choosing the right combinator

- Use `guard` for discriminated unions.
- Use `at` for keyed records.
- Use `index` for one optional array position.
- Use `each` for all elements in an array.

## Stable neighbors

- [Composition](composition.md) explains how combinators affect result kinds once composed.
- [Best practices](best-practices.md) covers when a combinator is preferable to a bespoke optic.
