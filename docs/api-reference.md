# API reference

This page names the stable exported surface from `@fuiste/optics`.
It is intentionally organized around the repository's public module rather than an external site generator's sidebar shape.

## Exported optic types

- `Lens<S, A>`
- `Prism<S, A>`
- `Iso<S, A>`
- `Traversal<S, A>`
- `Getter<S, A>`
- `Fold<S, A>`
- `Optic<S, A>`

## Constructors and factories

- `Lens<S>().prop(key)` creates a total property focus.
- `Prism<S>().of({ get, set })` creates a partial focus.
- `Iso<S, A>({ to, from })` creates an invertible mapping.
- `Traversal<S, A>({ getAll, modify })` creates a writable multi-focus.
- `Getter<S, A>(get)` creates a read-only total focus.
- `Fold<S, A>(getAll)` creates a read-only multi-focus.

## Standalone helpers

- `compose(outer, inner)` composes two optics and infers the result kind.
- `guard(predicate)` lifts a type guard into a `Prism`.
- `at(key)` focuses on a `Record` entry.
- `index(idx)` focuses on a single array element.
- `each()` traverses every element of a readonly array.

## Utility types

- `InferSource<O>`
- `InferTarget<O>`

## Documentation split

- [Quick start](quick-start.md) is the shortest path to first usage.
- [Composition](composition.md) explains result inference.
- [Semantics and laws](semantics-and-laws.md) documents behavioural guarantees that matter for callers.
