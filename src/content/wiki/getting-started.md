---
title: Getting Started
description: Install the package and build your first composed optic.
section: Guides
navTitle: Getting Started
order: 20
---

# Getting Started

Start with a `Lens` for required data. A lens can always read and always write its target.

```ts
import { Lens } from '@fuiste/optics'

type Person = {
  name: string
  age: number
  address: { city: string }
}

const name = Lens<Person>().prop('name')

const ada: Person = {
  name: 'Ada',
  age: 36,
  address: { city: 'London' },
}

name.get(ada)
// 'Ada'

name.set('Augusta')(ada)
// { name: 'Augusta', age: 36, address: { city: 'London' } }

name.set((value) => value.toUpperCase())(ada)
// { name: 'ADA', age: 36, address: { city: 'London' } }
```

## Compose A Path

Use `compose(outer, inner)` to focus deeper.

```ts
import { Lens, compose } from '@fuiste/optics'

type Person = {
  name: string
  address: { city: string }
}

const address = Lens<Person>().prop('address')
const city = Lens<Person['address']>().prop('city')
const personCity = compose(address, city)

personCity.get({ name: 'Ada', address: { city: 'London' } })
// 'London'
```

## Use Prisms For Optional Paths

When a path may be absent, use a `Prism`. Reads return `undefined`, and functional updates are no-ops when the focus is missing.

```ts
import { Lens, Prism, compose } from '@fuiste/optics'

type Person = {
  name: string
  address?: { city: string }
}

const address = Prism<Person>().of({
  get: (person) => person.address,
  set: (address) => (person) => ({ ...person, address }),
})

const city = Lens<{ city: string }>().prop('city')
const optionalCity = compose(address, city)

optionalCity.get({ name: 'Ada' })
// undefined

optionalCity.set((value) => value.toUpperCase())({ name: 'Ada' })
// { name: 'Ada' }
```

## Traverse Arrays

`each` creates a traversal over every element in an array.

```ts
import { Lens, compose, each } from '@fuiste/optics'

type Team = { members: string[] }

const members = Lens<Team>().prop('members')
const allMembers = compose(members, each<string>())

allMembers.modify((name) => name.toUpperCase())({
  members: ['Ada', 'Grace'],
})
// { members: ['ADA', 'GRACE'] }
```
