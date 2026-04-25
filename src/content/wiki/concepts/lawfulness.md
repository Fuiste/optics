---
title: Lawfulness
description: The practical laws that keep optics predictable.
section: Concepts
navTitle: Lawfulness
order: 120
---

# Lawfulness

Optic laws are the boring rules that make the whole thing useful. Boring in the same way brakes are boring.

## Lens Laws

A lawful `Lens` should behave like a stable focus on one required value.

```ts
const current = lens.get(source)

lens.set(current)(source) === source
lens.get(lens.set(next)(source)) === next
lens.set(second)(lens.set(first)(source)) === lens.set(second)(source)
```

The library preserves reference identity for unchanged updates when it can detect them with `Object.is`.

## Prism Laws

A lawful `Prism` may miss, but when it hits, it should update the focused value without surprising the rest of the source.

```ts
const current = prism.get(source)

if (current !== undefined) {
  prism.get(prism.set(next)(source)) === next
}
```

Function updaters are no-ops when a prism misses.

## Iso Laws

An `Iso` must be invertible.

```ts
iso.from(iso.to(source)) === source
iso.to(iso.from(target)) === target
```

If that is not true, you do not have an isomorphism. You have a serializer with commitment issues.

## Traversal Laws

A `Traversal` should visit each focus consistently and only change the source through those focuses.

```ts
traversal.modify((value) => value)(source) === source
```

The built-in `each` traversal preserves array identity when every element is unchanged.
