# Lenses

Type-safe, functional optics for immutable data: lenses for required data and prisms for optional/union data.

## What and why

- Lens: Focus on a required field; always gets a value and can set immutably
- Prism: Focus on an optional or union branch; get may return undefined
- Composition: You can compose any combination of lens and prism
  - Lens ∘ Lens => Lens
  - Lens ∘ Prism => Prism
  - Prism ∘ Lens => Prism
  - Prism ∘ Prism => Prism

Core principles:

- Pure and immutable: `set` returns a new object; originals are never mutated
- Type-safe: illegal paths/types are rejected at compile time
- Ergonomic: `set` accepts either a value or an updater function `(a) => a` for both Lens and Prism

---

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

// Functional updates without intermediate variables
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

// Functional updater works the same as Lens
addressPrism.set((addr) => ({ ...addr, city: 'LA' }))({
  name: 'A',
  address: { street: '1', city: 'NYC' },
})
// => { name: 'A', address: { street: '1', city: 'LA' } }
```

### Composition

```typescript
import { Lens, Prism } from '@fuiste/optics'

type Address = { street: string; city: string }
type Person = { name: string; address?: Address }

const addressPrism = Prism<Person>().of({
  get: (p) => p.address,
  set: (address) => (p) => ({ ...p, address }),
})

const cityLens = Lens<Address>().prop('city')

// Prism ∘ Lens => Prism
const cityPrism = Prism<Person>().compose(addressPrism, cityLens)
cityPrism.get({ name: 'A', address: { street: '1', city: 'NYC' } }) // 'NYC'
cityPrism.get({ name: 'A' }) // undefined

// Setting through a missing path is a no-op for composed prisms
const updated = cityPrism.set('LA')({ name: 'A' }) // unchanged when address is undefined

// Function updaters also work
cityPrism.set((city) => city.toUpperCase())({ name: 'A', address: { street: '1', city: 'nyc' } })
// => city becomes 'NYC'
```

### Arrays

```typescript
type Company = { name: string; employees: Array<{ name: string; role: string }> }
const employeesLens = Lens<Company>().prop('employees')
const firstEmployeeLens = Lens<Company>().compose(
  employeesLens,
  Lens<Company['employees']>().prop(0),
)

const company: Company = {
  name: 'Acme',
  employees: [
    { name: 'John', role: 'Developer' },
    { name: 'Jane', role: 'Manager' },
  ],
}

firstEmployeeLens.get(company) // { name: 'John', role: 'Developer' }
firstEmployeeLens.set({ name: 'Bob', role: 'Designer' })(company)
// => updates index 0 immutably
```

### Union types with prisms

```typescript
type Circle = { type: 'circle'; radius: number }
type Square = { type: 'square'; side: number }
type Shape = Circle | Square

const circlePrism = Prism<Shape>().of({
  get: (s): Circle | undefined => (s.type === 'circle' ? s : undefined),
  set: (circle) => (_) => circle,
})

const radiusLens = Lens<Circle>().prop('radius')
const circleRadius = Prism<Shape>().compose(circlePrism, radiusLens)

circleRadius.get({ type: 'circle', radius: 5 }) // 5
circleRadius.set(7)({ type: 'circle', radius: 5 }) // { type: 'circle', radius: 7 }

// Function updater on composed prism
circleRadius.set((r) => r + 1)({ type: 'circle', radius: 6 }) // { type: 'circle', radius: 7 }
```

### Practical: deeply optional configuration

```typescript
type Configuration = {
  search?: {
    options?: { isPrefillEnabled?: boolean }
  }
}

const searchPrism = Prism<Configuration>().of({
  get: (c) => c.search,
  set: (search) => (c) => ({ ...c, search }),
})

const optionsPrism = Prism<NonNullable<Configuration['search']>>().of({
  get: (s) => s.options,
  set: (options) => (s) => ({ ...s, options }),
})

const isPrefillEnabledPrism = Prism<
  NonNullable<NonNullable<Configuration['search']>['options']>
>().of({
  get: (o) => o.isPrefillEnabled,
  set: (isPrefillEnabled) => (o) => ({ ...o, isPrefillEnabled }),
})

const partialComposed = Prism<Configuration>().compose(searchPrism, optionsPrism)

const composed = Prism<Configuration>().compose(partialComposed, isPrefillEnabledPrism)

composed.get({}) // undefined
composed.set(true)({}) // unchanged (missing branches)

// Function setter is also a no-op when branches are missing
composed.set((v) => !v)({}) // unchanged
```

---

## Best practices

- Prefer composition of small optics over writing one big custom getter/setter
- Use functional setters for derived updates, e.g. `set((a) => f(a))`
- Treat optics as pure: never mutate inputs inside `set`
- For arrays, use numeric keys with `prop(index)` and compose
- For optional/union data, push creation logic into the outermost `Prism#of({ set })` if you want to materialize missing branches. By design, setting through a composed prism where any outer branch is missing is a no-op
- Use TypeScript helpers like `NonNullable<T>` and `Exclude<T, undefined>` to narrow optional shapes when building intermediate prisms

---

## API reference

### Factories

```typescript
// Lens factory for a source type S
Lens<S>()
  .prop<K extends keyof S>(key: K): Lens<S, S[K]>
  .compose<A, B>(outer: Lens<S, A>, inner: Lens<A, B> | Prism<A, B>): Lens<S, B> | Prism<S, B>

// Prism factory for a source type S
Prism<S>()
  .of<A>({ get: (s: S) => A | undefined; set: (a: A | ((a: A) => A)) => <T extends S>(s: T) => T }): Prism<S, A>
  .compose<A, B>(outer: Prism<S, A>, inner: Lens<A, B> | Prism<A, B>): Prism<S, B>
```

### Interfaces

```typescript
// A functional lens focusing a required value A inside source S
export type Lens<S, A> = {
  _tag: 'lens'
  get: (s: S) => A
  // Accepts either a value or an updater function
  set: (a: A | ((a: A) => A)) => <T extends S>(s: T) => T
}

// A functional prism focusing an optional/union value A inside source S
export type Prism<S, A> = {
  _tag: 'prism'
  get: (s: S) => A | undefined
  set: (a: A | ((a: A) => A)) => <T extends S>(s: T) => T
}
```

Notes:

- `Lens#set` and `Prism#set` both accept a value or function and return a new object of the same structural type as the input. Unchanged branches are preserved
- `Prism#get` may return `undefined`. When using composed prisms, any missing outer branch results in `undefined`
- `Prism#set` on a composed path that is currently missing is a no-op by default. If you want to create missing branches, do it in the outer prism’s `set`

### Utility types

```typescript
// Extract source/target types from optics
InferLensSource<L extends Lens<any, any>>
InferLensTarget<L extends Lens<any, any>>
InferPrismSource<P extends Prism<any, any>>
InferPrismTarget<P extends Prism<any, any>>
```

Examples:

```typescript
const nameLens = Lens<Person>().prop('name')
type PersonFromLens = InferLensSource<typeof nameLens> // Person
type Name = InferLensTarget<typeof nameLens> // string

const addressPrism = Prism<Person>().of({
  get: (p) => p.address,
  set: (a) => (p) => ({ ...p, address: a }),
})
type PersonFromPrism = InferPrismSource<typeof addressPrism> // Person
type Address = InferPrismTarget<typeof addressPrism> // { street: string; city: string }
```

---

## Examples from the test suite

### Composed lenses (deep required updates)

```typescript
type Address = { street: string; city: string }
type Person = { name: string; address: Address }

const addressLens = Lens<Person>().prop('address')
const cityLens = Lens<Address>().prop('city')
const personCityLens = Lens<Person>().compose(addressLens, cityLens)

personCityLens.get({ name: 'John', address: { street: '123 Main', city: 'New York' } }) // 'New York'
personCityLens.set('Los Angeles')({
  name: 'John',
  address: { street: '123 Main', city: 'New York' },
})
// => updates city immutably
```

### Prism ∘ Lens (optional then required)

```typescript
type Address = { street: string; city: string }
type Person = { name: string; age: number; address?: Address }

const addressPrism = Prism<Person>().of({
  get: (p) => p.address,
  set: (address) => (p) => ({ ...p, address }),
})
const cityLens = Lens<Address>().prop('city')
const composed = Prism<Person>().compose(addressPrism, cityLens)

composed.get({ name: 'John', age: 30, address: { street: '123', city: 'New York' } }) // 'New York'
composed.set('Los Angeles')({ name: 'John', age: 30, address: { street: '123', city: 'New York' } })
// => address.city becomes 'Los Angeles'

// Function form
composed.set((city) => city.toUpperCase())({
  name: 'John',
  age: 30,
  address: { street: '123', city: 'nyc' },
})
// => address.city becomes 'NYC'
```

### Lens ∘ Prism (required then optional)

```typescript
type Address = { street: string; city: string }
type Person = { name: string; age: number; address: Address }

const addressLens = Lens<Person>().prop('address')
const cityPrism = Prism<Address>().of({
  get: (a) => a.city,
  set: (city) => (a) => ({ ...a, city }),
})

const composed = Lens<Person>().compose(addressLens, cityPrism)
composed.get({ name: 'John', age: 30, address: { street: '123', city: 'New York' } }) // 'New York'
```

### Prism ∘ Prism (deeply optional)

```typescript
type Address = { street: string; city: string }
type Person = { name: string; age: number; address?: Address }

const addressPrism = Prism<Person>().of({
  get: (p) => p.address,
  set: (a) => (p) => ({ ...p, address: a }),
})
const cityPrism = Prism<Address>().of({
  get: (a) => a.city,
  set: (city) => (a) => ({ ...a, city }),
})

const composed = Prism<Person>().compose(addressPrism, cityPrism)
composed.get({ name: 'John', age: 30, address: { street: '123', city: 'New York' } }) // 'New York'
composed.get({ name: 'John', age: 30 }) // undefined
composed.set('Los Angeles')({ name: 'John', age: 30 }) // unchanged (no address)

// Function setter is also a no-op when a branch is missing
composed.set((city) => city.toUpperCase())({ name: 'John', age: 30 }) // unchanged
```

### Complex nested optionals (first department manager)

```typescript
type Company = {
  name: string
  departments?: Array<{
    name: string
    manager?: { name: string; email: string }
  }>
}

const firstDepartmentPrism = Prism<Company>().of({
  get: (c) => c.departments?.[0],
  set: (dept) => (c) => ({
    ...c,
    departments: c.departments ? [dept, ...c.departments.slice(1)] : [dept],
  }),
})

const managerPrism = Prism<Exclude<Company['departments'], undefined>[number]>().of({
  get: (dept) => dept.manager,
  set: (manager) => (dept) => ({ ...dept, manager }),
})

const composed = Prism<Company>().compose(firstDepartmentPrism, managerPrism)
composed.get({
  name: 'Acme',
  departments: [{ name: 'Eng', manager: { name: 'John', email: 'john@acme.com' } }],
})
// => { name: 'John', email: 'john@acme.com' }
```

---

## Tips and gotchas

- Composed prisms are safe-by-default: missing outer values mean `get` returns `undefined` and `set` is a no-op
- If you want `set` to create missing structure, do it at the nearest prism with a `set` that materializes the branch
- Arrays are first-class: numeric `prop` keys are supported and type-checked
- Share interfaces across lenses: you can make a `Lens<Interface>()` and use it safely wherever the interface applies

---

## Types at a glance

- Lens<S, A>
- Prism<S, A>
- InferLensSource<L>, InferLensTarget<L>
- InferPrismSource<P>, InferPrismTarget<P>
