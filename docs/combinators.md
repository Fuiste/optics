# Combinators

The exported combinators cover the shapes that appear constantly in application code:

- union branches
- record keys
- single array indices
- all array elements

They matter because they encode the right partiality and multiplicity semantics by construction, which is preferable to re-deriving them with ad hoc setters and hoping impurity does not sneak in sideways.

## Quick chooser

| Helper  | Result kind | Focus shape | Read behaviour                   | Write behaviour                                                |
| ------- | ----------- | ----------- | -------------------------------- | -------------------------------------------------------------- |
| `guard` | `Prism`     | one branch  | `undefined` when predicate fails | concrete set replaces; updater set no-ops when predicate fails |
| `at`    | `Prism`     | one key     | `undefined` when key is absent   | concrete set upserts; updater set no-ops when key is absent    |
| `index` | `Prism`     | one slot    | `undefined` when out of bounds   | no-op when out of bounds                                       |
| `each`  | `Traversal` | all slots   | returns every element            | `modify` maps every element                                    |

## `guard`

```ts
guard<S, A extends S>(predicate: (s: S) => s is A): Prism<S, A>
```

`guard` lifts a TypeScript type guard into a prism.
It is the intended constructor for discriminated unions.

```ts
import { Lens, compose, guard } from '@fuiste/optics'

type Circle = { type: 'circle'; radius: number }
type Square = { type: 'square'; side: number }
type Shape = Circle | Square

const circle = guard<Shape, Circle>((shape): shape is Circle => shape.type === 'circle')
const radius = compose(circle, Lens<Circle>().prop('radius'))

radius.get({ type: 'circle', radius: 5 }) // 5
radius.get({ type: 'square', side: 4 }) // undefined
```

Behaviour notes grounded in the tests:

- `get` returns the matching branch or `undefined`.
- A concrete `set` replaces the source with the supplied matching branch, even when the original source was a different branch.
- A function-updater `set` only runs when the predicate matches; otherwise it is a no-op.

That asymmetric behaviour is intentional. Concrete replacement is always possible because you already supplied a valid `A`.

## `at`

```ts
at<V>(key: string): Prism<Readonly<Record<string, V>>, V>
```

`at` focuses on a key in a record-like object.

```ts
import { at } from '@fuiste/optics'

const auth = at<string>('Authorization')

auth.get({ Authorization: 'Bearer x' }) // 'Bearer x'
auth.get({}) // undefined
auth.set('Bearer y')({}) // { Authorization: 'Bearer y' }
```

Semantics:

- Reads return `undefined` when the key is absent.
- Concrete writes upsert the key.
- Function-updater writes are a no-op when the key is absent.
- If the updated value is unchanged, the original object reference is preserved.

Because the result is a `Prism`, composing `at` with a `Lens` or `Iso` still yields a partial optic.

## `index`

```ts
index<A>(idx: number): Prism<ReadonlyArray<A>, A>
```

`index` focuses on one optional array element.

```ts
import { index } from '@fuiste/optics'

const second = index<number>(1)

second.get([10, 20, 30]) // 20
second.get([10]) // undefined
second.set(99)([10, 20, 30]) // [10, 99, 30]
second.set(99)([10]) // unchanged
```

Semantics:

- Out-of-bounds reads return `undefined`.
- Out-of-bounds writes are a no-op.
- Concrete and updater writes both preserve the original array when the focused value is unchanged.

Use `index` when you mean "maybe one element". Use `each()` when you mean "all elements". If you reach for `Lens<T[]>().prop(i)`, you are encoding totality that the data structure generally does not deserve.

## `each`

```ts
each<A>(): Traversal<ReadonlyArray<A>, A>
```

`each` creates a traversal over every array element.

```ts
import { each } from '@fuiste/optics'

const nums = each<number>()

nums.getAll([1, 2, 3]) // [1, 2, 3]
nums.modify((n) => n * 2)([1, 2, 3]) // [2, 4, 6]
```

Semantics:

- `getAll` returns the original sequence of focused values.
- `modify` applies the mapper to every element.
- When the mapper leaves every element unchanged, `each()` returns the original array reference.

`each` is often the bridge from singular to many-valued composition:

```ts
import { Lens, compose, each } from '@fuiste/optics'

type Team = { members: Array<{ name: string }> }

const memberNames = compose(
  compose(Lens<Team>().prop('members'), each<{ name: string }>()),
  Lens<{ name: string }>().prop('name'),
)

memberNames.getAll({ members: [{ name: 'Ada' }, { name: 'Grace' }] }) // ['Ada', 'Grace']
```

## Combinators in composition

The combinators follow the same matrix as hand-built optics:

- `guard ∘ Lens` is `Prism`
- `at ∘ Iso` is `Prism`
- `Lens ∘ each` is `Traversal`
- `Getter ∘ index` is `Fold`

See [Composition](composition.md) for the full matrix and [Semantics and laws](semantics-and-laws.md) for absent-path behaviour once these helpers are composed.

## Related pages

- [Composition](composition.md) for result-kind inference.
- [API reference](api-reference.md) for signatures and export coverage.
- [Best practices](best-practices.md) for when to prefer combinators over custom optics.
