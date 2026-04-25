---
title: Optional Data
description: Use prisms to read and update optional branches.
section: Recipes
navTitle: Optional Data
order: 320
---

# Optional Data

Optional fields are prism territory.

```ts
import { Lens, Prism, compose } from '@fuiste/optics'

type User = {
  id: string
  profile?: {
    displayName: string
  }
}

const profile = Prism<User>().of({
  get: (user) => user.profile,
  set: (profile) => (user) => ({ ...user, profile }),
})

const displayName = Lens<NonNullable<User['profile']>>().prop('displayName')
const userDisplayName = compose(profile, displayName)
```

## Read

```ts
userDisplayName.get({ id: 'u_1' })
// undefined
```

## Update When Present

```ts
userDisplayName.set((value) => value.trim())({
  id: 'u_1',
  profile: { displayName: ' Ada ' },
})
// { id: 'u_1', profile: { displayName: 'Ada' } }
```

## No-Op When Missing

```ts
userDisplayName.set((value) => value.trim())({ id: 'u_1' })
// { id: 'u_1' }
```

Concrete values can materialize the optional branch when the prism setter can construct it.
