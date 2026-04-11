# API glossary

Scope: exported public APIs currently documented in `README.md` and exported in `src/index.ts` / `src/types.ts`.

## Conventions

- `_tag`: runtime discriminant on every optic object (`'lens' | 'prism' | 'iso' | 'traversal' | 'getter' | 'fold'`).
- Total vs partial:
  - **Total**: `get`/`to`/`from` always produce a value.
  - **Partial**: optional `A` result when focus is absent (`get` returns `undefined`).
- Writable vs read-only:
  - Writable optics expose `set` or `modify`.
  - Read-only optics expose only extraction methods.

<a id="lens"></a>
## `Lens<S, A>`

Factory form: `Lens<S>().prop<K extends keyof S>(key: K): Lens<S, S[K]>`

```ts
type Person = { name: string }
const name = Lens<Person>().prop('name')
const p: Person = { name: 'Ada' }
name.get(p) // 'Ada'
name.set('Alan')(p) // { name: 'Alan' }
```

| Property | Contract |
| --- | --- |
| `_tag` | `'lens'` |
| `get` | `(s: S) => A`, total read of one value |
| `set` | `(a: A \| ((a: A) => A)) => <T extends S>(s: T) => T` |
| `getAll` | *not present* (single focus) |
| `modify` | *not present* |
| `to` | *not present* |
| `from` | *not present* |

<a id="prism"></a>
## `Prism<S, A>`

Factory form: `Prism<S>().of<A>(spec): Prism<S, A>`

```ts
type Profile = { address?: { city: string } }
const city = Prism<Profile>().of({
  get: (p) => p.address?.city,
  set: (city) => (p) => ({ ...p, address: { city } }),
})

city.get({ address: { city: 'Paris' } }) // 'Paris'
city.set('Tokyo')({ address: { city: 'Paris' } }) // { address: { city: 'Tokyo' } }
```

| Property | Contract |
| --- | --- |
| `_tag` | `'prism'` |
| `get` | `(s: S) => A \| undefined`, partial read of one value |
| `set` | `(a: A \| ((a: A) => A)) => <T extends S>(s: T) => T`, no-op when value absent |
| `getAll` | *not present* |
| `modify` | *not present* |
| `to` | *not present* |
| `from` | *not present* |

<a id="iso"></a>
## `Iso<S, A>`

Factory form: `Iso<S, A>({ to, from })`

```ts
const numberString = Iso<number, string>({
  to: (n) => String(n),
  from: (s) => Number(s),
})

numberString.to(12) // '12'
numberString.from('34') // 34
```

| Property | Contract |
| --- | --- |
| `_tag` | `'iso'` |
| `get` | *not present* |
| `set` | *not present* |
| `getAll` | *not present* |
| `modify` | *not present* |
| `to` | `(s: S) => A`, total mapping |
| `from` | `(a: A) => S`, inverse mapping |

<a id="traversal"></a>
## `Traversal<S, A>`

Factory form: `Traversal<S, A>({ getAll, modify })`

```ts
const words = Traversal<string, string>({
  getAll: (s) => s.split(','),
  modify: (f) => (s) => s.split(',').map(f).join(','),
})
words.getAll('a,b,c') // ['a','b','c']
words.modify((w) => w.toUpperCase())('a,b,c') // 'A,B,C'
```

| Property | Contract |
| --- | --- |
| `_tag` | `'traversal'` |
| `get` | *not present* |
| `set` | *not present* |
| `getAll` | `(s: S) => ReadonlyArray<A>`, zero-or-more values |
| `modify` | `(f: (a: A) => A) => <T extends S>(s: T) => T`, applies `f` to every focused value |
| `to` | *not present* |
| `from` | *not present* |

<a id="getter"></a>
## `Getter<S, A>`

Factory form: `Getter<S, A>(get)`

```ts
type Person = { firstName: string; lastName: string }
const fullName = Getter<Person, string>((p) => `${p.firstName} ${p.lastName}`)
fullName.get({ firstName: 'Ada', lastName: 'Lovelace' }) // 'Ada Lovelace'
```

| Property | Contract |
| --- | --- |
| `_tag` | `'getter'` |
| `get` | `(s: S) => A`, total read of one value |
| `set` | *not present* (read-only) |
| `getAll` | *not present* |
| `modify` | *not present* |
| `to` | *not present* |
| `from` | *not present* |

<a id="fold"></a>
## `Fold<S, A>`

Factory form: `Fold<S, A>(getAll)`

```ts
const words = Fold<string, string>((s) => s.split(' '))
words.getAll('hello world') // ['hello', 'world']
```

| Property | Contract |
| --- | --- |
| `_tag` | `'fold'` |
| `get` | *not present* |
| `set` | *not present* (read-only) |
| `getAll` | `(s: S) => ReadonlyArray<A>`, zero-or-more values |
| `modify` | *not present* |
| `to` | *not present* |
| `from` | *not present* |

<a id="compose"></a>
## `compose`

Signature:
`compose<S, A, B>(outer: Optic<S, A>, inner: Optic<A, B>): Optic<S, B>`

```ts
const nameLens = Lens<{ person: { name: string } }>().prop('person')
const name = Lens<{ name: string }>().prop('name')
const personName = compose(nameLens, name)
personName.get({ person: { name: 'Ada' } }) // 'Ada'
```

| Property | Contract |
| --- | --- |
| `_tag` | computed from pairwise composition rules |
| `get / getAll` | delegated to composed optics |
| `set / modify` | present only when result is writable |
| `to / from` | present only when result is an `Iso` |

<a id="guard"></a>
## `guard`

Signature:
`guard<S, A extends S>(predicate: (s: S) => s is A): Prism<S, A>`

```ts
type Shape = { kind: 'circle'; radius: number } | { kind: 'square'; side: number }
const isCircle = guard<Shape, Extract<Shape, { kind: 'circle' }>>((s): s is Extract<Shape, { kind: 'circle' }> => s.kind === 'circle')
isCircle.get({ kind: 'circle', radius: 2 }) // { kind: 'circle', radius: 2 }
```

<a id="at"></a>
## `at`

Signature:
`at<V>(key: string): Prism<Readonly<Record<string, V>>, V>`

```ts
const host = at<string>('host')
host.get({ host: 'api.example' }) // 'api.example'
host.set('localhost')({ host: 'api.example' }) // { host: 'localhost' }
```

<a id="index"></a>
## `index`

Signature:
`index<A>(idx: number): Prism<ReadonlyArray<A>, A>`

```ts
const second = index<string>(1)
second.get(['first', 'second']) // 'second'
second.set((x) => x.toUpperCase())(['first', 'second']) // ['first', 'SECOND']
```

<a id="each"></a>
## `each`

Signature:
`each<A>(): Traversal<ReadonlyArray<A>, A>`

```ts
const all = each<number>()
all.getAll([1, 2, 3]) // [1, 2, 3]
all.modify((n) => n + 1)([1, 2, 3]) // [2, 3, 4]
```

## Utility types

<a id="optic"></a>
### `Optic<S = any, A = any>`

Runtime shape union:
`Lens<S, A> | Prism<S, A> | Iso<S, A> | Traversal<S, A> | Getter<S, A> | Fold<S, A>`

```ts
type PersonOptic = Optic<Person, string>
```

<a id="infersource"></a>
### `InferSource<O extends Optic>`

Extracts source type `S` from an optic type.

```ts
type Source = InferSource<Lens<{ id: string }, string>> // { id: string }
```

<a id="infertarget"></a>
### `InferTarget<O extends Optic>`

Extracts target type `A` from an optic type.

```ts
type Target = InferTarget<Lens<{ id: string }, string>> // string
```
