# Quick start

Use this page after you have installed `@fuiste/optics` via the root [`README.md`](../README.md).
The README remains the shortest path to installation and first contact; this page is the stable location for quick-start material that other docs pages can link to.

## Minimal progression

1. Start with a total focus via `Lens`.
2. Introduce `Prism` when a branch may be absent.
3. Compose optics with `compose(outer, inner)` rather than building bespoke nested accessors.
4. Reach for combinators such as `each`, `index`, `at`, and `guard` when the shape already matches their algebra.

## A first composition

```ts
import { Lens, compose } from '@fuiste/optics'

type Profile = {
  user: {
    name: string
  }
}

const userLens = Lens<Profile>().prop('user')
const nameLens = Lens<Profile['user']>().prop('name')
const profileName = compose(userLens, nameLens)

const profile: Profile = { user: { name: 'Ada' } }

profileName.get(profile) // 'Ada'
profileName.set('Grace')(profile) // { user: { name: 'Grace' } }
```

## Where to go next

- Continue to [Composition](composition.md) for the result-kind rules.
- Continue to [Combinators](combinators.md) for the standard constructors over unions, records, and arrays.
- Continue to [Semantics and laws](semantics-and-laws.md) for the guarantees around identity preservation and no-op updates.
