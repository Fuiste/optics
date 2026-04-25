---
title: Immutability
description: How optics update immutable data without mutating inputs.
section: Concepts
navTitle: Immutability
order: 130
---

# Immutability

All writable optics return updated values. They do not mutate their inputs.

```ts
const next = name.set('Grace')(person)

next !== person
next.name === 'Grace'
person.name !== 'Grace'
```

## Functional Updates

`Lens#set` and `Prism#set` both accept either a concrete value or an updater function.

```ts
name.set((value) => value.toUpperCase())(person)
```

For prisms, updater functions are no-ops when the target is missing.

```ts
optionalCity.set((city) => city.toUpperCase())({ name: 'Ada' })
// { name: 'Ada' }
```

## Reference Identity

When an update does not change the focused value, the library preserves the existing reference.

```ts
const same = name.set(person.name)(person)

Object.is(same, person)
// true
```

That matters for React, memoization, caches, and the general avoidance of ambient sadness.
