# Intro and Getting Started

Optics gives you a focused, composable way to read and update immutable structures in TypeScript. If you have data like `user.profile.address.street`, optics let you work with that exact path without repeatedly writing clone-and-update code.

## Philosophy

- Focus exactly on the value you care about with `Lens`, `Prism`, `Iso`, `Traversal`, `Getter`, and `Fold`.
- Keep reads and updates pure and predictable by returning new values instead of mutating inputs.
- Compose small optics into domain-specific paths that stay easy to test and reuse.
- Prefer read-only optics (`Getter`, `Fold`) when you only need extraction, not mutation.

The result is less boilerplate and fewer accidental mutations when navigating nested, optional, or repeated fields.

## Why optics?

In plain TypeScript, immutable updates for deep paths often become repetitive object copies:

```typescript
const updated = {
  ...state,
  user: { ...state.user, settings: { ...state.user.settings, theme: 'dark' } },
}
```

`@fuiste/optics` centralizes this pattern into reusable optics so you can:

- read (`get`) values,
- write (`set`) values,
- transform (`modify`) values in one place.

All optics compose through the same `compose` function.

## Installation

Use the package manager already shown in the README:

```bash
# npm
npm install @fuiste/optics

# pnpm
pnpm add @fuiste/optics

# yarn
yarn add @fuiste/optics

# bun
bun add @fuiste/optics
```

## Quick start

Start with one concrete object.

```typescript
type Profile = {
  id: number
  email: string
  permissions: string[]
}

type AppState = {
  user: {
    name: string
    profile?: Profile
  }
}

const state: AppState = {
  user: {
    name: 'Dana',
    profile: { id: 101, email: 'dana@example.com', permissions: ['read', 'write'] },
  },
}
```

### 1) Focus and read (`get`)

```typescript
import { Lens, Prism, compose } from '@fuiste/optics'

const userLens = Lens<AppState>().prop('user')
const profileLens = Lens<{ name: string; profile?: Profile }>().prop('profile')
const emailLens = Lens<Profile>().prop('email')

const userProfileEmail = compose(userLens, compose(profileLens, emailLens))

userProfileEmail.get(state) // 'dana@example.com'
```

Use `Prism` when the path can be missing:

```typescript
const profilePrism = Prism<AppState>().of({
  get: (s) => s.user.profile,
  set: (profile) => (s) => ({ ...s, user: { ...s.user, profile } }),
})

const userEmailWithPrism = compose(profilePrism, Lens<Profile>().prop('email'))
userEmailWithPrism.get(state) // 'dana@example.com'
```

### 2) Write (`set`)

```typescript
const setUserEmail = userEmailWithPrism.set('dana+alerts@example.com')

setUserEmail(state)
// {
//   user: {
//     name: 'Dana',
//     profile: { id: 101, email: 'dana+alerts@example.com', permissions: ['read', 'write'] }
//   }
// }
```

Missing branches remain unchanged when using `Prism#set` unless the update provides a full branch:

```typescript
const noProfileState: AppState = { user: { name: 'Dana' } }
userEmailWithPrism.set('x@z')(noProfileState) // { user: { name: 'Dana' } }
```

### 3) Transform (`modify`)

Use `modify` for function-based updates. With `each` you can apply it across a collection:

```typescript
import { each } from '@fuiste/optics'

type ProjectState = {
  permissions: string[]
}

const projectState: ProjectState = { permissions: ['read', 'write'] }
const allPermissions = compose(Lens<ProjectState>().prop('permissions'), each<string>())

allPermissions.modify((permission) => permission.toUpperCase())(projectState)
// => { permissions: ['READ', 'WRITE'] }
```

## Next steps and references

- [API glossary](./README.md#api-reference) for every optic type and constructor signature
- [Quick start examples](./README.md#quick-start) for concise usage
- [Composition examples](./README.md#composition) to build longer paths
- [Combinator examples](./README.md#combinators) for `guard`, `at`, `index`, and `each`

Once this feels natural, start from your domain model and build optics by small property paths, then compose them into reusable selectors and updaters.
