# Composition

Composition builds higher-level behavior from smaller, typed steps.

## Why compose

Composing optics keeps update logic focused and localized.

## Typical pattern
1. Start with one small optic at each data boundary.
2. Compose sequentially in source → target order.
3. Read and mutate through the combined optic.

```ts
import { Lens, compose, each } from '@fuiste/optics'

type Person = { profile: { firstName: string; lastName: string } }
const fullName = compose(
  Lens<Person>().prop('profile'),
  Lens<{ firstName: string; lastName: string }>().prop('firstName'),
)

fullName.get({ profile: { firstName: 'Ada', lastName: 'Lovelace' } }) // 'Ada'
fullName.set('Grace')({ profile: { firstName: 'Ada', lastName: 'Lovelace' } })
// => { profile: { firstName: 'Grace', lastName: 'Lovelace' } }
```

### Multi-step example

```ts
type Team = { leads: Array<{ name: string; skills: string[] }> }

const leadNames = compose(
  compose(Lens<Team>().prop('leads'), each<{ name: string; skills: string[] }>()),
  Lens<{ name: string; skills: string[] }>().prop('name'),
)

leadNames.getAll({ leads: [{ name: 'Ada', skills: ['math'] }, { name: 'Lin', skills: ['ops'] }] })
// => ['Ada', 'Lin']
leadNames.modify((name) => `${name}!`)({ leads: [{ name: 'Ada', skills: ['math'] }, { name: 'Lin', skills: ['ops'] }] })
// => { leads: [{ name: 'Ada!', ... }, { name: 'Lin!', ... }] }
```

## Related

- [Getting Started](getting-started.md) for first pass setup.
- [Combinators](combinators.md) when building by construction pattern.
