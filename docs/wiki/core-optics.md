# Core optics

This page gives a compact practical definition of the six core optic kinds used in this library.

- [Composition](composition.md) (or [README composition section](../README.md#composition)) for how optic kinds combine.
- [API reference](api-reference.md) (or [README API reference](../README.md#api-reference)) for complete type declarations and constructors.

## Lens

`Lens<S, A>` focuses on **exactly one** required target and always knows where that target is.

```typescript
type Lens<S, A> = {
  _tag: 'lens'
  get: (s: S) => A
  set: (a: A | ((a: A) => A)) => (s: S) => S
}
```

- **Total:** `get` never returns `undefined`.
- **Writable:** `set` always rebuilds `S` using an updated `A`.
- **Focus cardinality:** one value.
- **Typical construction:** `Lens<T>().prop('field')`

```typescript
type Person = { name: string }
const name = Lens<Person>().prop('name')
name.get({ name: 'Ada' }) // 'Ada'
name.set('Grace')({ name: 'Ada' }) // { name: 'Grace' }
```

## Prism

`Prism<S, A>` focuses on a value that may be absent (union alternatives, nullable/optional branches).

```typescript
type Prism<S, A> = {
  _tag: 'prism'
  get: (s: S) => A | undefined
  set: (a: A | ((a: A) => A)) => (s: S) => S
}
```

- **Partial:** `get` returns `undefined` when the focus is not present.
- **Writable:** `set` is a no-op if the focus is absent in a composed path.
- **Focus cardinality:** one value, conditionally.
- **Typical construction:** `Prism<S>().of({ get, set })`

```typescript
type Payload = { kind: 'ok'; value: string } | { kind: 'err' }
const okValue = Prism<Payload>().of({
  get: (p) => (p.kind === 'ok' ? p.value : undefined),
  set: (v) => (p) =>
    p.kind === 'ok' ? { ...p, value: v } : p
})
okValue.get({ kind: 'ok', value: 'ok' }) // 'ok'
okValue.set('fixed')({ kind: 'err' }) // { kind: 'err' }
```

## Iso

`Iso<S, A>` maps two domains back and forth; both directions are total.

```typescript
type Iso<S, A> = {
  _tag: 'iso'
  to: (s: S) => A
  from: (a: A) => S
}
```

- **Total:** both `to` and `from` are always defined.
- **Writable:** write is effectively total because `from` reconstructs `S`.
- **Focus cardinality:** one value.
- **Typical construction:** `Iso<S, A>({ to, from })`

```typescript
const upperLower = Iso<string, string>({
  to: (s) => s.toUpperCase(),
  from: (s) => s.toLowerCase(),
})
upperLower.to('abc') // 'ABC'
upperLower.from('XYZ') // 'xyz'
```

## Traversal

`Traversal<S, A>` focuses on zero-or-more values and only supports bulk transformation.

```typescript
type Traversal<S, A> = {
  _tag: 'traversal'
  getAll: (s: S) => ReadonlyArray<A>
  modify: (f: (a: A) => A) => (s: S) => S
}
```

- **Multi-focus:** zero to many targets.
- **Writable:** `modify` applies a function to each focused value.
- **No direct set:** single-value `set` is intentionally absent.
- **Typical construction:** `each<T>()` or traversal composition.

```typescript
const nums = Traversal<number[], number>({ getAll: (ns) => ns, modify: (f) => (ns) => ns.map(f) })
nums.getAll([1, 2, 3]) // [1, 2, 3]
nums.modify((n) => n * 2)([1, 2, 3]) // [2, 4, 6]
```

## Getter

`Getter<S, A>` computes a read-only projection with no way to write.

```typescript
type Getter<S, A> = {
  _tag: 'getter'
  get: (s: S) => A
}
```

- **Total:** always returns one derived/computed value.
- **Read-only:** no `set`, by design.
- **Focus cardinality:** one read-only value.
- **Typical construction:** `Getter<S, A>((s) => ...)`

```typescript
const fullName = Getter<{ first: string; last: string }, string>(
  (p) => `${p.first} ${p.last}`
)
fullName.get({ first: 'Ada', last: 'Lovelace' }) // 'Ada Lovelace'
```

## Fold

`Fold<S, A>` extracts many values for inspection only.

```typescript
type Fold<S, A> = {
  _tag: 'fold'
  getAll: (s: S) => ReadonlyArray<A>
}
```

- **Read-only:** no `modify`/`set`.
- **Multi-focus:** zero or more values, typically from traversable structures.
- **Total on structure:** returns `[]` when nothing is in focus.
- **Typical construction:** `Fold<S, A>((s) => [...])`

```typescript
const words = Fold<string, string>((s) => s.split(' '))
words.getAll('hello world') // ['hello', 'world']
```

## Behaviour quick map

- **Total vs partial**
  - Total focus: `Lens`, `Iso`, `Getter`
  - Partial focus: `Prism`
  - Multi-focus: `Traversal`, `Fold`
- **Writable vs read-only**
  - Writable: `Lens`, `Prism`, `Iso`, `Traversal`
  - Read-only: `Getter`, `Fold`

Compose any read-only optic into a writable chain and the result follows README composition rules (for the full matrix and edge cases, see [Composition](../README.md#composition)).
