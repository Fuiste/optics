---
title: Types
description: Public TypeScript types exported by the package.
section: API
navTitle: Types
order: 280
---

# Types

The package exports runtime factories and matching public types.

```ts
import {
  Lens,
  Prism,
  Iso,
  Traversal,
  Getter,
  Fold,
  type Optic,
  type InferSource,
  type InferTarget,
} from '@fuiste/optics'
```

## `Optic`

`Optic<S, A>` is the union of every optic kind.

```ts
type Optic<S, A> =
  | Lens<S, A>
  | Prism<S, A>
  | Iso<S, A>
  | Traversal<S, A>
  | Getter<S, A>
  | Fold<S, A>
```

Use it when a function can accept any optic and branch on `_tag`.

## `InferSource`

Extracts the source type from an optic.

```ts
type Source = InferSource<typeof nameLens>
```

## `InferTarget`

Extracts the focused target type from an optic.

```ts
type Target = InferTarget<typeof nameLens>
```

## Runtime Tags

Every optic has a `_tag` discriminator.

```ts
if (optic._tag === 'lens') {
  optic.get(source)
}
```

This is intentionally boring. Boring discriminants are a gift.
