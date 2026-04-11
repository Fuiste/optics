# Composition reference

Composition is how you build one optical behavior from smaller behaviors.

In this package, all composition goes through:

- `compose(outerOptic, innerOptic): Optic`

`outerOptic` receives the full source `S` and returns an intermediate `A`.  
`innerOptic` receives that `A` and returns `B`.  
The composed result is a new optic for `S -> B`.

Use `compose(outer, inner)` for:

- Deep access chains (`team -> employees -> employee -> role`)
- Multi-focus traversals (`employees -> each -> role`)
- Keeping small, reusable optic constants

## Call pattern and nesting

The standard composition call is:

```typescript
import { Lens, compose, each } from '@fuiste/optics'

type Company = { employees: Array<{ name: string; role: string }>; id: string }

const employeesLens = Lens<Company>().prop('employees')
const eachEmployee = each<{ name: string; role: string }>()
const nameLens = Lens<{ name: string; role: string }>().prop('name')

// Outer then inner:
const names = compose(employeesLens, eachEmployee)
const allEmployeeNames = compose(names, nameLens)
```

Equivalent nested form is often handy for long chains:

```typescript
const allEmployeeNames = compose(compose(employeesLens, eachEmployee), nameLens)
```

Both forms are equivalent. Nested calls are just explicit right-association of several compositions.

## Composition outcome matrix

The return kind is inferred from the two inputs.

| outer ∘ inner | **Lens** | **Prism** | **Iso** | **Traversal** | **Getter** | **Fold** |
| ------------- | -------- | --------- | ------- | ------------- | ---------- | -------- |
| **Lens**      | Lens     | Prism     | Lens    | Traversal     | Getter     | Fold     |
| **Prism**     | Prism    | Prism     | Prism   | Traversal     | Fold       | Fold     |
| **Iso**       | Lens     | Prism     | Iso     | Traversal     | Getter     | Fold     |
| **Traversal** | Traversal| Traversal | Traversal| Traversal    | Fold       | Fold     |
| **Getter**    | Getter   | Fold      | Getter  | Fold          | Getter     | Fold     |
| **Fold**      | Fold     | Fold      | Fold    | Fold          | Fold       | Fold     |

### Semantics in plain terms

- Any composition involving `Fold` is read-only.
- `Getter` and `Fold` are read-only optics and can make a writable composition read-only when they appear in a path.
- `Traversal` is multi-focus; it propagates through composition and keeps traversal behavior when another optic is inserted.
- `Iso` does not block composition; the other optic usually determines the result.
- The result kind for most write-enabled paths is the same as the “least capable writer” in the chain.

## Writable and read-only examples

### Writable result

```typescript
import { Lens, compose, each } from '@fuiste/optics'

type Company = { employees: Array<{ name: string; role: string }> }

const employees = Lens<Company>().prop('employees')
const eachEmployee = each<{ name: string; role: string }>()
const roleLens = Lens<{ name: string; role: string }>().prop('role')

const allRoles = compose(compose(employees, eachEmployee), roleLens)

const company: Company = { employees: [{ name: 'Ada', role: 'Dev' }, { name: 'Bo', role: 'Ops' }] }
allRoles.modify((role) => role.toUpperCase())(company)
// => { employees: [{ name: 'Ada', role: 'DEV' }, { name: 'Bo', role: 'OPS' }] }
```

### Read-only result through Getter

```typescript
import { Getter, compose } from '@fuiste/optics'

type Person = { firstName: string; lastName: string }
type Team = { lead: Person }

const leadLens = Lens<Team>().prop('lead')
const fullName = Getter<Person, string>((person) => `${person.firstName} ${person.lastName}`)

const leadName = compose(leadLens, fullName)

leadName.get({ lead: { firstName: 'Alice', lastName: 'Doe' } }) // 'Alice Doe'
leadName.set // no `set` method on Getter result
```

### Read-only result through Fold / multi-focus propagation

```typescript
import { Fold, compose } from '@fuiste/optics'

const wordsFold = Fold<string, string>((value) => value.split(' '))
const fullName = Getter<Person, string>((person) => `${person.firstName} ${person.lastName}`)
const sentenceLeadName = compose(fullName, wordsFold)

sentenceLeadName.getAll({ firstName: 'Alice', lastName: 'Doe' }) // ['Alice', 'Doe']
sentenceLeadName.set // no `set` on read-only result
```

## Partial and transitive (no-op) behavior

Use `Prism` when a branch can be missing.

```typescript
import { Lens, Prism, compose } from '@fuiste/optics'

type Address = { street: string; city: string }
type Person = { name: string; address?: Address }

const addressPrism = Prism<Person>().of({
  get: (person) => person.address,
  set: (address) => (person) => ({ ...person, address }),
})
const cityLens = Lens<Address>().prop('city')
const cityPrism = compose(addressPrism, cityLens)

cityPrism.get({ name: 'A', address: { street: '1', city: 'NYC' } }) // 'NYC'
cityPrism.get({ name: 'A' }) // undefined
cityPrism.set('LA')({ name: 'A' }) // unchanged (outer branch missing => read/write no-op)
```

The README behavior note also applies here:

- `Prism ∘ Iso` can materialize a missing outer branch when `set` is given a concrete value.
- `Getter`/`Fold` in the chain remove write methods, while `set` and `modify` for earlier writable parts are still unavailable on the result.

## Multi-focus call guidance

For array-like paths, compose `each` in the middle of the chain and keep names small:

```typescript
import { Lens, compose, each } from '@fuiste/optics'

type Org = { departments: Array<{ name: string; members: Array<{ name: string }> }>; }

const departments = Lens<Org>().prop('departments')
const eachDepartment = each<{ name: string; members: Array<{ name: string }> }>()
const members = Lens<{ name: string; members: Array<{ name: string }> }>().prop('members')
const eachMember = each<{ name: string }>()
const memberName = Lens<{ name: string }>().prop('name')

const allMemberNames = compose(
  compose(compose(departments, eachDepartment), compose(members, eachMember)),
  memberName,
)

allMemberNames.getAll({
  departments: [
    { name: 'Engineering', members: [{ name: 'Ada' }, { name: 'Bo' }] },
    { name: 'Ops', members: [{ name: 'Cy' }] },
  ],
})
// => ['Ada', 'Bo', 'Cy']
```

## Navigation

- [Optics concepts](optics.md)
- [Combinators](combinators.md)
