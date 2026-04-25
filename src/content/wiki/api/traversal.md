---
title: Traversal
description: Writable focus on zero or more values.
section: API
navTitle: Traversal
order: 240
---

# Traversal

A `Traversal<S, A>` focuses zero or more values `A` inside a source `S`.

```ts
type Traversal<S, A> = {
  readonly _tag: 'traversal'
  readonly getAll: (s: S) => ReadonlyArray<A>
  readonly modify: (f: (a: A) => A) => <T extends S>(s: T) => T
}
```

## Traverse An Array

```ts
import { Lens, compose, each } from '@fuiste/optics'

type Team = { members: string[] }

const members = Lens<Team>().prop('members')
const allMembers = compose(members, each<string>())

allMembers.getAll({ members: ['Ada', 'Grace'] })
// ['Ada', 'Grace']

allMembers.modify((name) => name.toUpperCase())({
  members: ['Ada', 'Grace'],
})
// { members: ['ADA', 'GRACE'] }
```

> Traversals are for uniform updates across every focus. If you want exactly one array slot, use `index`.

## Notes

- `getAll` returns every focus.
- `modify` updates every focus.
- Traversals through missing prism branches are no-ops.
- `each` is the built-in array traversal.
