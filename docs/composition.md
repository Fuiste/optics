# Composition

Composition is the library's central operation.
Rather than smuggling path logic through custom getters and setters, compose small optics and let the result kind fall out of the pair you chose.

## One operator, many result kinds

All exported optics compose through `compose(outer, inner)`.
The result kind is determined by the participating optics.

| outer \\ inner | `Lens`      | `Prism`     | `Iso`       | `Traversal` | `Getter` | `Fold` |
| -------------- | ----------- | ----------- | ----------- | ----------- | -------- | ------ |
| `Lens`         | `Lens`      | `Prism`     | `Lens`      | `Traversal` | `Getter` | `Fold` |
| `Prism`        | `Prism`     | `Prism`     | `Prism`     | `Traversal` | `Fold`   | `Fold` |
| `Iso`          | `Lens`      | `Prism`     | `Iso`       | `Traversal` | `Getter` | `Fold` |
| `Traversal`    | `Traversal` | `Traversal` | `Traversal` | `Traversal` | `Fold`   | `Fold` |
| `Getter`       | `Getter`    | `Fold`      | `Getter`    | `Fold`      | `Getter` | `Fold` |
| `Fold`         | `Fold`      | `Fold`      | `Fold`      | `Fold`      | `Fold`   | `Fold` |

## Rules of thumb

- `Fold` is contagious: once a read-many optic appears, the result stays read-only and many-valued.
- `Getter` plus any partial or many-valued optic degrades to `Fold`.
- `Traversal` absorbs writable optics and keeps the result writable-many.
- `Iso` is transparent except when both sides are `Iso`.
- `Lens` composed with `Lens` stays total; any partial branch produces `Prism`.

## Example

```ts
import { Lens, Prism, compose } from '@fuiste/optics'

type Address = { city: string }
type Person = { address?: Address }

const address = Prism<Person>().of({
  get: (person) => person.address,
  set: (next) => (person) => ({ ...person, address: next }),
})

const city = Lens<Address>().prop('city')
const personCity = compose(address, city)

personCity.get({ address: { city: 'London' } }) // 'London'
personCity.get({}) // undefined
personCity.set('Paris')({}) // unchanged
```

## Stable neighbors

- [Quick start](quick-start.md) introduces the smallest useful composition.
- [Semantics and laws](semantics-and-laws.md) explains why absent composed prism paths are no-ops.
- [API reference](api-reference.md) records the exported factories and helpers.
