---
title: Derived Values
description: Model computed reads with Getter and Fold.
section: Recipes
navTitle: Derived Values
order: 340
---

# Derived Values

Use `Getter` when a value is computed and should not be set.

```ts
import { Getter, Lens, compose } from '@fuiste/optics'

type Person = {
  firstName: string
  lastName: string
}

type Team = {
  lead: Person
}

const fullName = Getter<Person, string>((person) => `${person.firstName} ${person.lastName}`)

const lead = Lens<Team>().prop('lead')
const leadFullName = compose(lead, fullName)

leadFullName.get({
  lead: { firstName: 'Ada', lastName: 'Lovelace' },
})
// 'Ada Lovelace'
```

The result has no `set`. That is the point.

## Extract Many Derived Values

```ts
import { Fold } from '@fuiste/optics'

const words = Fold<string, string>((text) => text.split(/\s+/))

words.getAll('optics compose nicely')
// ['optics', 'compose', 'nicely']
```

Folds are read-only, multi-focus optics. Use them when you want extraction, not mutation cosplay.
