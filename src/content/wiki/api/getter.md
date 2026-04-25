---
title: Getter
description: Read-only total focus for computed values.
section: API
navTitle: Getter
order: 250
---

# Getter

A `Getter<S, A>` reads exactly one value `A` from `S`.

```ts
type Getter<S, A> = {
  readonly _tag: 'getter'
  readonly get: (s: S) => A
}
```

## Create A Getter

```ts
import { Getter } from '@fuiste/optics'

type Person = {
  firstName: string
  lastName: string
}

const fullName = Getter<Person, string>((person) => `${person.firstName} ${person.lastName}`)
```

## Compose Read-Only Paths

```ts
import { Getter, Lens, compose } from '@fuiste/optics'

type Team = { lead: Person }

const lead = Lens<Team>().prop('lead')
const leadName = compose(lead, fullName)

leadName.get({
  lead: { firstName: 'Ada', lastName: 'Lovelace' },
})
// 'Ada Lovelace'
```

## Notes

- Getters do not have `set`.
- `Getter` plus total focus remains `Getter`.
- `Getter` plus partial or multiple focus becomes `Fold`.
