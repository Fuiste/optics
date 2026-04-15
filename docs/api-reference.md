# API reference

This page documents the stable public surface exported from `src/index.ts`.
It stays close to the module boundary rather than to any particular docs wrapper, so the entries here correspond directly to what callers import.

## Exported optic types

### `Lens<S, A>`

```ts
type Lens<S, A> = {
  _tag: 'lens'
  get: (s: S) => A
  set: (a: A | ((a: A) => A)) => <T extends S>(s: T) => T
}
```

Total writable focus. `get` always succeeds, and `set` accepts either a concrete value or an updater function.

### `Prism<S, A>`

```ts
type Prism<S, A> = {
  _tag: 'prism'
  get: (s: S) => A | undefined
  set: (a: A | ((a: A) => A)) => <T extends S>(s: T) => T
}
```

Partial writable focus. `get` may return `undefined`. Function-updater writes are a no-op when the branch is absent.

### `Iso<S, A>`

```ts
type Iso<S, A> = {
  _tag: 'iso'
  to: (s: S) => A
  from: (a: A) => S
}
```

Total reversible mapping. The intended law is that `from(to(s)) === s` and `to(from(a)) === a`.

### `Traversal<S, A>`

```ts
type Traversal<S, A> = {
  _tag: 'traversal'
  getAll: (s: S) => ReadonlyArray<A>
  modify: (f: (a: A) => A) => <T extends S>(s: T) => T
}
```

Writable multi-focus. `getAll` extracts every focus; `modify` applies a function to each focus.

### `Getter<S, A>`

```ts
type Getter<S, A> = {
  _tag: 'getter'
  get: (s: S) => A
}
```

Read-only total focus. There is no `set`.

### `Fold<S, A>`

```ts
type Fold<S, A> = {
  _tag: 'fold'
  getAll: (s: S) => ReadonlyArray<A>
}
```

Read-only multi-focus. There is no `modify`.

### `Optic<S, A>`

```ts
type Optic<S, A> =
  | Lens<S, A>
  | Prism<S, A>
  | Iso<S, A>
  | Traversal<S, A>
  | Getter<S, A>
  | Fold<S, A>
```

The sum type of all supported optics. `compose` accepts any pair drawn from this union.

## Constructors and factories

### `Lens`

```ts
Lens<S>().prop<K extends keyof S>(key: K): Lens<S, S[K]>
```

Creates a property lens.

- Focus is total: the property is assumed to exist.
- `set` preserves reference identity when the replacement is `Object.is`-equal to the current value.
- Numeric keys also work for arrays, though [Best practices](best-practices.md) recommends `index` or `each` for collection-oriented code.

```ts
import { Lens } from '@fuiste/optics'

type Person = { name: string; age: number }

const name = Lens<Person>().prop('name')
name.get({ name: 'Ada', age: 36 }) // 'Ada'
name.set('Grace')({ name: 'Ada', age: 36 }) // { name: 'Grace', age: 36 }
```

### `Prism`

```ts
Prism<S>().of<A>({
  get: (s: S) => A | undefined
  set: (a: A) => (s: S) => S
}): Prism<S, A>
```

Creates a custom prism from explicit `get` and `set` functions.

- Use it for optional fields or branch selection when a standard combinator is not enough.
- Concrete writes delegate to your `set`, so a custom prism may materialize a missing branch.
- Function-updater writes only run when `get` finds a current value.
- Identity is preserved when an update computes the same focused value.

```ts
import { Prism } from '@fuiste/optics'

type Person = { address?: { city: string } }

const address = Prism<Person>().of({
  get: (person) => person.address,
  set: (next) => (person) => ({ ...person, address: next }),
})
```

### `Iso`

```ts
Iso<S, A>({
  to: (s: S) => A
  from: (a: A) => S
}): Iso<S, A>
```

Creates an isomorphism.

- Use it when two representations carry the same information.
- `Iso ∘ Iso` is the only composition that stays an `Iso`.
- When composed under a `Prism`, a concrete write can materialize a missing branch because `from` can synthesize the intermediate value.

```ts
import { Iso } from '@fuiste/optics'

const numberString = Iso<number, string>({
  to: (n) => `${n}`,
  from: (s) => parseInt(s, 10),
})
```

### `Traversal`

```ts
Traversal<S, A>({
  getAll: (s: S) => ReadonlyArray<A>
  modify: (f: (a: A) => A) => <T extends S>(s: T) => T
}): Traversal<S, A>
```

Creates a writable multi-focus optic.

- `modify` runs the mapper across every focused value.
- When no focused values change, traversal implementations may preserve the original source reference. The built-in `each()` combinator does so.
- Composing with a traversal usually yields another traversal unless a read-only optic is involved.

### `Getter`

```ts
Getter<S, A>(get: (s: S) => A): Getter<S, A>
```

Creates a read-only total optic.

- Use it for derived values that should never be set.
- `Getter ∘ Lens`, `Lens ∘ Getter`, `Iso ∘ Getter`, `Getter ∘ Iso`, and `Getter ∘ Getter` remain `Getter`.
- Composing a `Getter` with partial or many-valued optics degrades to `Fold`.

```ts
import { Getter } from '@fuiste/optics'

type Person = { firstName: string; lastName: string }

const fullName = Getter<Person, string>((person) => `${person.firstName} ${person.lastName}`)
```

### `Fold`

```ts
Fold<S, A>(getAll: (s: S) => ReadonlyArray<A>): Fold<S, A>
```

Creates a read-only multi-focus optic.

- Use it for extraction, not mutation.
- `Fold` is absorbing under composition: any composition involving `Fold` yields `Fold`.

```ts
import { Fold } from '@fuiste/optics'

const words = Fold<string, string>((s) => s.split(' '))
words.getAll('hello world') // ['hello', 'world']
```

## Standalone helpers

### `compose`

```ts
compose<S, A, B>(outer: Optic<S, A>, inner: Optic<A, B>): Optic<S, B>
```

Universal composition over all optic pairs.

- The library exposes overloads for the whole composition matrix.
- The result kind is inferred from the pair of tags rather than from surface syntax.
- See [Composition](composition.md) for the matrix and behaviour notes.

### `guard`

```ts
guard<S, A extends S>(predicate: (s: S) => s is A): Prism<S, A>
```

Lifts a TypeScript type guard into a prism.

- `get` returns the matching branch or `undefined`.
- Concrete `set` replaces the source with the provided branch, even if the current value does not match.
- Function-updater writes are a no-op when the predicate fails.

### `at`

```ts
at<V>(key: string): Prism<Readonly<Record<string, V>>, V>
```

Creates a prism over a record entry.

- `get` returns the value at `key` or `undefined`.
- Concrete `set` upserts the key.
- Function-updater writes are a no-op when the key is absent.

### `index`

```ts
index<A>(idx: number): Prism<ReadonlyArray<A>, A>
```

Creates a prism over one array element.

- Out-of-bounds reads return `undefined`.
- Out-of-bounds writes are a no-op.
- Unchanged writes preserve the original array reference.

### `each`

```ts
each<A>(): Traversal<ReadonlyArray<A>, A>
```

Creates a traversal over all array elements.

- `getAll` returns every element.
- `modify` maps every element.
- If the mapper leaves every element `Object.is`-equal to the original, the original array reference is preserved.

## Utility types

### `InferSource<O>`

Extracts the source type `S` from any optic.

```ts
type Source = InferSource<ReturnType<typeof each<number>>> // ReadonlyArray<number>
```

### `InferTarget<O>`

Extracts the focus type `A` from any optic.

```ts
type Target = InferTarget<ReturnType<typeof each<number>>> // number
```

## Related pages

- [Quick start](quick-start.md) for the first decision about which optic to use.
- [Composition](composition.md) for result-kind inference and read-only outcomes.
- [Combinators](combinators.md) for deeper coverage of `guard`, `at`, `index`, and `each`.
- [Semantics and laws](semantics-and-laws.md) for immutability, no-op updates, and round-trip expectations.
