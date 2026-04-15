# Semantics and laws

The library is designed around immutable updates and observable identity preservation where possible.
If mutation appears to work, that is merely impurity auditioning for a future bug report.

## Lens laws

The test suite encodes the familiar lens expectations:

- get after set returns the written value
- set after get restores the original structure
- successive sets keep only the latest write

## Operational semantics

- `Lens#set` and `Prism#set` accept either a concrete value or an updater function.
- Original inputs are never mutated.
- Updaters that do not change the focused value preserve the original reference when the library can prove it.
- `Prism#get` returns `undefined` when the focused branch is absent.
- Composed prism writes through an absent branch are no-ops by default.
- `Traversal#modify` applies a transformation to every focused element.

## Important edge case

`Prism` composed with `Iso` has one special materialization rule:

- concrete writes may construct the missing intermediate via the outer prism's setter
- updater writes remain no-ops when the branch is absent

This is the one place where total invertibility leaks enough structure to synthesize the missing middle.

## Stable neighbors

- [Composition](composition.md) explains why certain pairs degrade to `Prism`, `Traversal`, or `Fold`.
- [Best practices](best-practices.md) turns these guarantees into caller guidance.
