# Composition

## `compose(outer, inner)`

The composition function is:

```ts
compose<S, A, B>(outer: Optic<S, A>, inner: Optic<A, B>): Optic<S, B>
```

Compose two optics by chaining a broader view (`outer`) with a focused view (`inner`).

```ts
import { Lens, Prism, Iso, Getter, Fold, Traversal, compose } from '@fuiste/optics'

const addressPrism = Prism<{ name?: string; address?: { city: string } }>().of({
  get: (p) => p.address,
  set: (address) => (p) => ({ ...p, address }),
})

const cityLens = Lens<{ city: string }>().prop('city')

const city = compose(addressPrism, cityLens)

city.get({ name: 'Mina', address: { city: 'Seattle' } }) // 'Seattle'
city.get({ name: 'Mina' }) // undefined
city.set('Denver')({ name: 'Mina', address: { city: 'Seattle' } }) // { ...city: 'Denver' }
```

## Inference table

| outer ∖ inner | **Lens** | **Prism** | **Iso** | **Traversal** | **Getter** | **Fold** |
| ------------- | -------- | --------- | ------- | ------------- | ---------- | -------- |
| **Lens**      | Lens     | Prism     | Lens    | Traversal     | Getter     | Fold     |
| **Prism**     | Prism    | Prism     | Prism   | Traversal     | Fold       | Fold     |
| **Iso**       | Lens     | Prism     | Iso     | Traversal     | Getter     | Fold     |
| **Traversal** | Traversal| Traversal | Traversal| Traversal    | Fold       | Fold     |
| **Getter**    | Getter   | Fold      | Getter  | Fold          | Getter     | Fold     |
| **Fold**      | Fold     | Fold      | Fold    | Fold          | Fold       | Fold     |
| **Fold**      | Fold     | Fold      | Fold    | Fold          | Fold       | Fold     |

Rules to remember:

- Any composition involving `Fold` becomes `Fold`.
- A `Traversal` composed with any writable optic stays writable as `Traversal`.
- `Iso` is transparent: if one side is `Iso`, the other side drives the result.
- `Getter` + partial optic is read-only `Fold`; `Getter` + total optic stays `Getter`.

## Inference-by-example edge cases

### No-op behavior for missing branches

```ts
const addressPrism = Prism<{ name: string; address?: { city: string } }>().of({
  get: (p) => p.address,
  set: (address) => (p) => ({ ...p, address }),
})
const cityLens = Lens<{ city: string }>().prop('city')
const city = compose(addressPrism, cityLens)

const missing = { name: 'Mina' }
city.get(missing) // undefined
city.set('NYC')(missing) // unchanged
city.set((city) => city.toUpperCase())(missing) // unchanged
```

### `Prism ∘ Prism` follows absence propagation

```ts
const countPrism = Prism<{ count?: number }>().of({
  get: (m) => m.count,
  set: (count) => (m) => ({ ...m, count }),
})
const countString = Iso<number, string>({ to: String, from: Number })
const countAsText = compose(countPrism, countString)

countAsText.get({}) // undefined
countAsText.set('42')({}) // unchanged
countAsText.set((s) => `${Number(s) + 1}`)({}) // unchanged
```

### `Prism ∘ Iso` materializes concrete values

```ts
const toText = compose(countPrism, countString)

toText.set('9')({}) // { count: 9 }
toText.set((text) => `${Number(text) + 1}`)({}) // unchanged
```

### Traversal composition through missing prism branches

```ts
const tagsPrism = Prism<{ tags?: string[] }>().of({
  get: (c) => c.tags,
  set: (tags) => (c) => ({ ...c, tags }),
})
const uppercased = compose(tagsPrism, each<string>())

uppercased.getAll({}) // []
uppercased.modify((s) => s.toUpperCase())({}) // unchanged
uppercased.getAll({ tags: ['a', 'b'] }) // ['A', 'B']
```

### Read-only behavior

```ts
const words = Fold<string, string>((s) => s.split(' '))
const chars = Fold<string, string>((s) => [...s])
const doubled = compose(words, chars)

doubled.set // compile-time unavailable

doubled.getAll('ab') // ['a', 'b', 'a', 'b']
```

### Multi-step composition still follows inference table

```ts
const people = Lens<{ employees: { name: string }[] }>().prop('employees')
const eachPerson = each<{ name: string }>()
const name = Lens<{ name: string }>().prop('name')

const allNames = compose(compose(people, eachPerson), name)
allNames._tag // 'traversal'
allNames.getAll({ employees: [{ name: 'A' }, { name: 'B' }] }) // ['A', 'B']
```
