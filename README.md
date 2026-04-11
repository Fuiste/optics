# Optics

Type-safe, functional optics for immutable data in TypeScript.

- **Lens** — total focus on a required value
- **Prism** — partial focus on an optional or union value
- **Iso** — total, invertible mapping between two types
- **Traversal** — focus on zero or more values (e.g. all elements of an array)
- **Getter** — read-only total focus (computed/derived values)
- **Fold** — read-only multi-focus (extract without modify)

All optics compose freely via a standalone `compose` function. Four ergonomic combinators — `guard`, `at`, `index`, and `each` — cover the most common construction patterns.

## Installation

```bash
# npm
npm install @fuiste/optics

# pnpm
pnpm add @fuiste/optics

# yarn
yarn add @fuiste/optics

# bun
bun add @fuiste/optics
```

## Development

- Package manager: `pnpm`
- Supported Node.js: `>=20.19.0`

## Documentation

- New contributors can start with the project wiki at [docs/index.md](docs/index.md).
- For hands-on guidance, see the [Getting Started guide](docs/guide/getting-started.md).
- Explore the full guide set:
  - [Optics Overview](docs/guide/optics.md)
  - [Composition](docs/guide/composition.md)
  - [Combinators](docs/guide/combinators.md)
- This TypeScript library is inspired by the Haskell `optics` package on Hackage: https://hackage.haskell.org/package/optics.

## Quick start

### Lens (required data)

```typescript
import { Lens } from '@fuiste/optics'

type Person = {
  name: string
  age: number
  address: { street: string; city: string }
}

const nameLens = Lens<Person>().prop('name')

const person: Person = { name: 'John', age: 30, address: { street: '123', city: 'NYC' } }

nameLens.get(person) // 'John'
nameLens.set('Jane')(person) // { name: 'Jane', age: 30, address: { ... } }
nameLens.set((name) => name.toUpperCase())(person) // name == 'JOHN'
```

### Prism (optional data)

```typescript
import { Prism } from '@fuiste/optics'

type Person = {
  name: string
  address?: { street: string; city: string }
}

const addressPrism = Prism<Person>().of({
  get: (p) => p.address,
  set: (address) => (p) => ({ ...p, address }),
})

addressPrism.get({ name: 'A' }) // undefined
addressPrism.set({ street: '456', city: 'LA' })({ name: 'A' })
// => { name: 'A', address: { street: '456', city: 'LA' } }

// Functional updater — no-op when absent
addressPrism.set((addr) => ({ ...addr, city: 'LA' }))({
  name: 'A',
  address: { street: '1', city: 'NYC' },
})
// => { name: 'A', address: { street: '1', city: 'LA' } }
```

### Iso (invertible mapping)

```typescript
import { Iso } from '@fuiste/optics'

const numberString = Iso<number, string>({ to: (n) => `${n}`, from: (s) => parseInt(s, 10) })

numberString.to(42) // '42'
numberString.from('7') // 7
```

### Traversal (multiple values)

```typescript
import { Lens, compose, each } from '@fuiste/optics'

type Team = { members: string[] }

const membersLens = Lens<Team>().prop('members')
const eachMember = each<string>()

const allMembers = compose(membersLens, eachMember)

const team: Team = { members: ['Alice', 'Bob'] }

allMembers.getAll(team) // ['Alice', 'Bob']
allMembers.modify((n) => n.toUpperCase())(team)
// => { members: ['ALICE', 'BOB'] }
```

### Getter (computed read-only value)

```typescript
import { Lens, Getter, compose } from '@fuiste/optics'

type Person = { firstName: string; lastName: string }
type Team = { lead: Person }

const fullName = Getter<Person, string>((p) => `${p.firstName} ${p.lastName}`)
const leadLens = Lens<Team>().prop('lead')

const leadName = compose(leadLens, fullName)
leadName.get({ lead: { firstName: 'Alice', lastName: 'Smith' } }) // 'Alice Smith'
// leadName has no `set` — it's read-only
```

### Fold (read-only extraction of many values)

```typescript
import { Fold } from '@fuiste/optics'

const words = Fold<string, string>((s) => s.split(' '))
words.getAll('hello world') // ['hello', 'world']
```

---

## Composition

All optics compose via the standalone `compose(outer, inner)` function. The return type is determined automatically:

| outer ∖ inner | **Lens** | **Prism** | **Iso** | **Traversal** | **Getter** | **Fold** |
| ------------- | -------- | --------- | ------- | ------------- | ---------- | -------- |
| **Lens**      | Lens     | Prism     | Lens    | Traversal     | Getter     | Fold     |
| **Prism**     | Prism    | Prism     | Prism   | Traversal     | Fold       | Fold     |
| **Iso**       | Lens     | Prism     | Iso     | Traversal     | Getter     | Fold     |
| **Traversal** | Traversal| Traversal | Traversal| Traversal    | Fold       | Fold     |
| **Getter**    | Getter   | Fold      | Getter  | Fold          | Getter     | Fold     |
| **Fold**      | Fold     | Fold      | Fold    | Fold          | Fold       | Fold     |

**Rules of thumb:**

- Anything with **Fold** → Fold (read-only is contagious)
- **Getter** + partial optic → Fold; **Getter** + total optic → Getter
- **Traversal** absorbs other writable optics → Traversal
- **Iso** is transparent: the other optic's kind wins
- **Lens ∘ Lens** → Lens; everything else with Prism → Prism

```typescript
import { Lens, Prism, Iso, compose } from '@fuiste/optics'

type Address = { street: string; city: string }
type Person = { name: string; address?: Address }

const addressPrism = Prism<Person>().of({
  get: (p) => p.address,
  set: (address) => (p) => ({ ...p, address }),
})
const cityLens = Lens<Address>().prop('city')

// Prism ∘ Lens => Prism
const cityPrism = compose(addressPrism, cityLens)
cityPrism.get({ name: 'A', address: { street: '1', city: 'NYC' } }) // 'NYC'
cityPrism.get({ name: 'A' }) // undefined
cityPrism.set('LA')({ name: 'A' }) // unchanged (missing path is a no-op)

// Lens ∘ Iso => Lens
type Model = { count: number }
const countLens = Lens<Model>().prop('count')
const numberString = Iso<number, string>({ to: (n) => `${n}`, from: (s) => parseInt(s, 10) })
const countAsString = compose(countLens, numberString)
countAsString.get({ count: 7 }) // '7'
countAsString.set('10')({ count: 7 }) // { count: 10 }
```

### Multi-step chains

Compose can be nested for deep paths:

```typescript
import { Lens, compose, each } from '@fuiste/optics'

type Company = { employees: Array<{ name: string; role: string }> }

const employeesLens = Lens<Company>().prop('employees')
const eachEmployee = each<{ name: string; role: string }>()
const empName = Lens<{ name: string; role: string }>().prop('name')

const allEmployeeNames = compose(compose(employeesLens, eachEmployee), empName)

allEmployeeNames.getAll(company) // ['Alice', 'Bob', ...]
allEmployeeNames.modify((n) => n.toUpperCase())(company)
```

---

## Combinators

### `guard` — type-guard prism

Creates a prism from a TypeScript type guard. Much more ergonomic than manually writing `Prism().of(...)` for discriminated unions.

```typescript
import { guard, Lens, compose } from '@fuiste/optics'

type Circle = { type: 'circle'; radius: number }
type Square = { type: 'square'; side: number }
type Shape = Circle | Square

const circlePrism = guard<Shape, Circle>((s): s is Circle => s.type === 'circle')

circlePrism.get({ type: 'circle', radius: 5 }) // { type: 'circle', radius: 5 }
circlePrism.get({ type: 'square', side: 4 }) // undefined

// Compose with a lens
const circleRadius = compose(circlePrism, Lens<Circle>().prop('radius'))
circleRadius.get({ type: 'circle', radius: 5 }) // 5
circleRadius.set(10)({ type: 'circle', radius: 5 }) // { type: 'circle', radius: 10 }
```

### `at` — record key access

Creates a prism that focuses on a key in a `Record<string, V>`. Returns `undefined` when the key is absent; sets/upserts when called.

```typescript
import { at, Lens, compose } from '@fuiste/optics'

type Config = { headers: Record<string, string> }

const headersLens = Lens<Config>().prop('headers')
const authHeader = at<string>('Authorization')

const configAuth = compose(headersLens, authHeader)

configAuth.get({ headers: { Authorization: 'Bearer x' } }) // 'Bearer x'
configAuth.get({ headers: {} }) // undefined
configAuth.set('Bearer y')({ headers: {} })
// => { headers: { Authorization: 'Bearer y' } }
```

### `index` — array element access

Creates a prism that focuses on a single array element. `get` returns `undefined` when the index is out of bounds, and `set` is a no-op when the element is missing.

```typescript
import { index } from '@fuiste/optics'

const second = index<number>(1)

second.get([10, 20, 30]) // 20
second.get([10]) // undefined
second.set(99)([10, 20, 30]) // [10, 99, 30]
second.set(99)([10]) // unchanged
```

### `each` — array traversal

Creates a traversal over all elements of a `ReadonlyArray<A>`.

```typescript
import { each, compose, Lens } from '@fuiste/optics'

const nums = each<number>()
nums.getAll([1, 2, 3]) // [1, 2, 3]
nums.modify((n) => n * 2)([1, 2, 3]) // [2, 4, 6]
```

---

## API reference

### Types

```typescript
type Lens<S, A> = {
  _tag: 'lens'
  get: (s: S) => A
  set: (a: A | ((a: A) => A)) => (s: S) => S
}

type Prism<S, A> = {
  _tag: 'prism'
  get: (s: S) => A | undefined
  set: (a: A | ((a: A) => A)) => (s: S) => S
}

type Iso<S, A> = {
  _tag: 'iso'
  to: (s: S) => A
  from: (a: A) => S
}

type Traversal<S, A> = {
  _tag: 'traversal'
  getAll: (s: S) => ReadonlyArray<A>
  modify: (f: (a: A) => A) => (s: S) => S
}

type Getter<S, A> = {
  _tag: 'getter'
  get: (s: S) => A
}

type Fold<S, A> = {
  _tag: 'fold'
  getAll: (s: S) => ReadonlyArray<A>
}

type Optic<S, A> = Lens<S, A> | Prism<S, A> | Iso<S, A> | Traversal<S, A> | Getter<S, A> | Fold<S, A>
```

### Factories

```typescript
// Lens factory — use .prop to focus on a property key
Lens<S>().prop<K extends keyof S>(key: K): Lens<S, S[K]>

// Prism factory — use .of to build from get/set
Prism<S>().of<A>({ get, set }): Prism<S, A>

// Direct constructors
Iso<S, A>({ to, from }): Iso<S, A>
Traversal<S, A>({ getAll, modify }): Traversal<S, A>
Getter<S, A>(get: (s: S) => A): Getter<S, A>
Fold<S, A>(getAll: (s: S) => ReadonlyArray<A>): Fold<S, A>
```

### Standalone functions

```typescript
// Universal composition — 36 overloads, result type inferred from inputs
compose<S, A, B>(outer: Optic<S, A>, inner: Optic<A, B>): Optic<S, B>

// Type-guard prism
guard<S, A extends S>(predicate: (s: S) => s is A): Prism<S, A>

// Record key prism
at<V>(key: string): Prism<Record<string, V>, V>

// Array index prism
index<A>(idx: number): Prism<ReadonlyArray<A>, A>

// Array element traversal
each<A>(): Traversal<ReadonlyArray<A>, A>
```

### Utility types

```typescript
InferSource<O extends Optic>  // Extract the S from any optic
InferTarget<O extends Optic>  // Extract the A from any optic
```

---

## Behaviour notes

- `Lens#set` and `Prism#set` both accept a value or `(a) => a` updater function and return a new object. Originals are never mutated.
- Writable optics preserve the caller's source shape in their public setter signatures for compatibility with narrowed states.
- `Prism#get` may return `undefined`. In composed prisms, any missing outer branch results in `undefined`.
- `Prism#set` through a composed path where an outer branch is missing is a **no-op** by default. Function updaters are also no-ops when missing.
- **Exception — Prism ∘ Iso**: providing a concrete value materializes via the outer Prism's `set` even when `get` returns `undefined`, because the Iso can always construct the intermediate value. Function updaters remain a no-op when missing.
- `Traversal#modify` applies the function to every focused element. For composed traversals through a missing prism branch, modify is a no-op.
- Unchanged updates preserve reference identity whenever the library can detect that the focused value did not change.
- `Getter` and `Fold` are read-only — they have no `set` or `modify`. Composing any optic with a read-only optic produces a read-only result.

---

## Best practices

- Prefer composition of small optics over one big custom getter/setter
- Use `guard` for discriminated unions instead of manual `Prism().of`
- Use `each` + `compose` for bulk array operations
- Use `index()` for a single array element and `at()` for record/map keys
- Use `Getter` for derived values that shouldn't be settable
- Treat optics as pure: never mutate inputs inside `set`
- For arrays, prefer `each()` for all elements or `index(i)` for one element. `Lens<T[]>().prop(index)` remains supported for compatibility.
