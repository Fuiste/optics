# Combinators

`guard`, `at`, `index`, and `each` are the most common practical combinators for building focused optics from common data shapes.

All examples below use this import style and compose path-style optics with `compose(outer, inner)`.

```ts
import { at, compose, each, guard, index, Lens } from '@fuiste/optics'
```

## `guard` — partial focus by runtime predicate

`guard` turns a type predicate into a `Prism`. Use it for discriminated unions, optional branches, and domain-specific narrowing.

```ts
type Shape = { kind: 'circle'; radius: number } | { kind: 'square'; side: number }

const circle = guard<Shape, { kind: 'circle'; radius: number }>((shape): shape is { kind: 'circle'; radius: number } => shape.kind === 'circle')

const circleRadius = compose(
  circle,
  Lens<{ kind: 'circle'; radius: number }>().prop('radius')
)

const sample = { kind: 'circle', radius: 3 } as Shape

circleRadius.get(sample) // 3
circleRadius.set(5)(sample) // { kind: 'circle', radius: 5 }
circleRadius.get({ kind: 'square', side: 4 } as Shape) // undefined
```

Common behavior worth calling out:

- `guard(...).get` returns `undefined` if the predicate fails.
- The setter is a no-op when the focused branch is not active.
- Use a type-accurate predicate; a too-broad predicate weakens downstream type safety.

## `at` — single key focus in a record/object map

`at` focuses a key in `Record<string, V>`. It behaves like a partial optic: key lookup can miss, but setting a value writes the key.

```ts
type Env = {
  metadata: Record<string, string>
}

const envKey = compose(
  Lens<Env>().prop('metadata'),
  at<string>('mode')
)

const cfg: Env = { metadata: { mode: 'prod', region: 'us-west' } }

envKey.get(cfg) // 'prod'
envKey.set('staging')(cfg) // { metadata: { mode: 'staging', region: 'us-west' } }
envKey.set((value) => value.toUpperCase())(cfg) // { metadata: { mode: 'PROD', region: 'us-west' } }
envKey.set((value) => value.toUpperCase())({ metadata: {} }) // unchanged (value updater needs existing key)
```

Common behavior worth calling out:

- `get` returns `undefined` when the key is absent.
- `set` with a plain value inserts/overwrites the key (upsert).
- `set` with updater function is a no-op when key is missing.

## `index` — single array element focus by position

`index` focuses one array position as a `Prism`. Missing indexes are treated as absent.

```ts
type LineItem = { sku: string; qty: number }
type Order = { items: LineItem[] }

const secondItem = compose(
  Lens<Order>().prop('items'),
  index<LineItem>(1)
)

const firstItemSku = compose(
  compose(Lens<Order>().prop('items'), index<LineItem>(0)),
  Lens<LineItem>().prop('sku')
)

const order: Order = {
  items: [
    { sku: 'A1', qty: 1 },
    { sku: 'B2', qty: 4 },
  ],
}

secondItem.get(order) // { sku: 'B2', qty: 4 }
secondItem.set({ sku: 'B2', qty: 10 })(order) // item at index 1 qty becomes 10
secondItem.set({ sku: 'X', qty: 1 })( { items: [] }) // unchanged
firstItemSku.get(order) // 'A1'
```

Common behavior worth calling out:

- `get` is `undefined` for negative or out-of-bounds index.
- Setting a missing index is a no-op.
- Keep indexes stable when composing with mutable UI list order assumptions.

## `each` — traversal for all array elements

`each` focuses all elements in a `ReadonlyArray<A>` as a `Traversal`. This is your multi-focus primitive for bulk reads/updates.

```ts
type Team = { members: { name: string; active: boolean }[] }

const memberStatus = compose(
  compose(
    Lens<Team>().prop('members'),
    each<{ name: string; active: boolean }>()
  ),
  Lens<{ name: string; active: boolean }>().prop('active')
)

const team: Team = {
  members: [
    { name: 'Ada', active: false },
    { name: 'Ben', active: true },
  ],
}

memberStatus.getAll(team) // [false, true]
memberStatus.modify((active) => !active)(team)
// => { members: [{ name: 'Ada', active: true }, { name: 'Ben', active: false }] }
```

Common behavior worth calling out:

- `each` works with any array shape; empty array yields empty traversal.
- `getAll` returns all focused values in order.
- `modify` returns unchanged input when the function is identity across every element.

## Traversal and mixed-focus examples

You can compose these combinators with each other for practical paths.

```ts
type Dashboard = {
  widgets: Array<{
    type: 'chart' | 'table'
    rows: { id: string; value?: number }[]
  }>
}

// Read all values from chart rows
const chartRows = compose(
  Lens<Dashboard>().prop('widgets'),
  each<{ type: 'chart' | 'table'; rows: { id: string; value?: number }[] }>()
)
const chartWidgets = compose(
  chartRows,
  guard<{ type: 'chart' | 'table'; rows: { id: string; value?: number }[] }, { type: 'chart'; rows: { id: string; value?: number }[] }>(
    (widget): widget is { type: 'chart'; rows: { id: string; value?: number }[] } => widget.type === 'chart'
  )
)
const chartRowsTraversal = compose(
  chartWidgets,
  Lens<{ type: 'chart'; rows: { id: string; value?: number }[] }>().prop('rows')
)
const chartRowValues = compose(
  compose(chartRowsTraversal, each<{ id: string; value?: number }>()),
  Lens<{ id: string; value?: number }>().prop('value')
)

const dashboard: Dashboard = {
  widgets: [
    { type: 'chart', rows: [{ id: 'r1', value: 8 }, { id: 'r2' }] },
    { type: 'table', rows: [{ id: 'r3', value: 2 }] },
  ],
}

chartRowValues.getAll(dashboard) // [8]
chartRowValues.modify(() => 10)(dashboard)
// => table rows unchanged, chart row values become [10, 10]
```

## Related pages

- [Getting Started](getting-started.md)
- [Composition](composition.md)
- [Optics Overview](optics.md)
