# Compose behavior guide

`compose(outer, inner)` wires two optics so `inner` focuses from the target of `outer`.

`compose` is defined in [`src/compose.ts`](./src/compose.ts) and delegates its return kind to `resultTag(outer._tag, inner._tag)`.

## Result-kind inference

The inferred return kind follows this table:

| outer \ inner | **Lens** | **Prism** | **Iso** | **Traversal** | **Getter** | **Fold** |
| ------------- | -------- | --------- | ------- | ------------- | ---------- | -------- |
| **Lens**      | Lens     | Prism     | Lens    | Traversal     | Getter     | Fold     |
| **Prism**     | Prism    | Prism     | Prism   | Traversal     | Fold       | Fold     |
| **Iso**       | Lens     | Prism     | Iso     | Traversal     | Getter     | Fold     |
| **Traversal** | Traversal| Traversal | Traversal| Traversal    | Fold       | Fold     |
| **Getter**    | Getter   | Fold      | Getter  | Fold          | Getter     | Fold     |
| **Fold**      | Fold     | Fold      | Fold    | Fold          | Fold       | Fold     |

The same table is also kept in [`README.md`](./README.md), and both are derived from the same `resultTag` logic.

## Read-only vs write-capable compositions

Whether the result is writable depends directly on the result kind:

- **Writable**: `lens`, `prism`, `iso`, `traversal`
  - `lens`, `prism`, `iso`: `get` plus `set`-style writes
  - `traversal`: `getAll` plus `modify`
- **Read-only**: `getter`, `fold`
  - `getter`: `get` only
  - `fold`: `getAll` only

Because `getTag` returns `getter`/`fold` when read-only optics participate, one read-only input collapses write capability unless the result is still writable.

## Behavior rules to rely on

- If either side is a `fold`, the result is always a `fold`.
- `Getter` + partial (`prism`/`traversal`) becomes `fold`; otherwise it stays `getter`.
- Any `traversal` input promotes to `traversal` (except when `fold` is already involved).
- `iso` behaves transparently unless paired with another `iso`: `iso ∘ iso` stays `iso`; otherwise the non-iso side generally wins.
- `lens ∘ lens` is the only all-lens writable combination that stays `lens`; any lens with a non-iso partial on the other side yields `prism`.

## Missing-branch and no-op behavior

- For a composed path that includes a `prism` in an outer position, if the outer `get` is `undefined`, the composed `get` is `undefined`.
- For the same scenario, `set` is a **no-op** by default (including function updaters).
  - This is demonstrated by `addressPrism ∘ cityLens` and `addressPrism ∘ cityPrism` examples in [`test/compose.test.ts`](./test/compose.test.ts).
- `Prism ∘ Iso` has one exception: concrete value writes can still materialize the missing branch because the `iso` can construct the intermediate shape before writing into the outer prism.
  - Example: composing a maybe field prism with `numberString` can write `{ count: 9 }` when `{}` had no `count`.
- Composed traversals still execute safely over partial branches:
  - `Prism ∘ Traversal` reads as an empty list when absent and does nothing on `modify` when absent.

## Practical examples

### Nested composition with `each`

This multi-step chain is composable and stays writable as a `traversal`:

```typescript
import { Lens, compose, each } from '@fuiste/optics'

type Company = { employees: Array<{ name: string; role: string }> }

const employeesLens = Lens<Company>().prop('employees')
const eachEmployee = each<{ name: string; role: string }>()
const nameLens = Lens<{ name: string; role: string }>().prop('name')

const allEmployeeNames = compose(compose(employeesLens, eachEmployee), nameLens)

const company: Company = {
  employees: [
    { name: 'Alice', role: 'Dev' },
    { name: 'Bob', role: 'PM' },
  ],
}

allEmployeeNames.getAll(company) // ['Alice', 'Bob']
allEmployeeNames.modify((name) => name.toUpperCase())(company)
// => {
//   employees: [{ name: 'ALICE', role: 'Dev' }, { name: 'BOB', role: 'PM' }]
// }
```

### `Prism` + `Iso` interaction

```typescript
import { Prism, Iso, compose } from '@fuiste/optics'

type Model = { count?: number }

const countPrism = Prism<Model>().of({
  get: (m) => m.count,
  set: (count) => (m) => ({ ...m, count }),
})

const numberString = Iso<number, string>({
  to: (n) => `${n}`,
  from: (s) => parseInt(s, 10),
})

const countText = compose(countPrism, numberString)

countText.get({ count: 5 }) // '5'
countText.set('9')({}) // { count: 9 }   // concrete-set materialization through Prism ∘ Iso
countText.set((s) => `${parseInt(s, 10) + 1}`)({}) // {}
```

### Lens + Getter stays read-only and remains safe

```typescript
import { Lens, Getter, compose } from '@fuiste/optics'

type Address = { street: string; city: string }
type Team = { lead: { firstName: string; lastName: string } }

const fullName = Getter<Team['lead'], string>((lead) => `${lead.firstName} ${lead.lastName}`)
const leadLens = Lens<Team>().prop('lead')

const leadFullName = compose(leadLens, fullName)

leadFullName.get({ lead: { firstName: 'Alice', lastName: 'Smith' } })
// 'Alice Smith'
// leadFullName._tag === 'getter'
```

## Validation checklist

- For each matrix row in `resultTag`, run through the tag outputs in [`test/compose-matrix.test.ts`](./test/compose-matrix.test.ts).
- For edge cases (`no-op` / materialization) compare with examples in [`test/compose.test.ts`](./test/compose.test.ts).
- Keep this guide aligned with:
  - `src/compose.ts` implementation
  - `README.md` composition table
