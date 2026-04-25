---
title: Discriminated Unions
description: Focus union branches with guard prisms.
section: Recipes
navTitle: Discriminated Unions
order: 330
---

# Discriminated Unions

Use `guard` to focus one branch of a union.

```ts
import { Lens, compose, guard } from '@fuiste/optics'

type Loading = { status: 'loading' }
type Success = { status: 'success'; value: number }
type Failure = { status: 'failure'; error: string }
type State = Loading | Success | Failure

const success = guard<State, Success>((state): state is Success => state.status === 'success')

const value = Lens<Success>().prop('value')
const successValue = compose(success, value)
```

## Read One Branch

```ts
successValue.get({ status: 'success', value: 42 })
// 42

successValue.get({ status: 'loading' })
// undefined
```

## Update One Branch

```ts
successValue.set((value) => value + 1)({
  status: 'success',
  value: 42,
})
// { status: 'success', value: 43 }

successValue.set((value) => value + 1)({ status: 'loading' })
// { status: 'loading' }
```

That is the whole trick: let the branch that exists change, leave the branch that does not exist alone.
