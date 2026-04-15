# Optics documentation

This directory is the long-form reference for `@fuiste/optics`.
The root [`README.md`](../README.md) stays responsible for installation and first contact; these pages exist for the parts that benefit from stable permalinks, denser examples, and a less hurried explanation.

## Mental model

Every exported optic can be understood along the same semantic axes:

| Kind        | Cardinality | Read/write | Typical use                        |
| ----------- | ----------- | ---------- | ---------------------------------- |
| `Lens`      | total       | writable   | required properties                |
| `Prism`     | partial     | writable   | optional fields and union branches |
| `Iso`       | total       | invertible | representational changes           |
| `Traversal` | many        | writable   | zero or more mutable foci          |
| `Getter`    | total       | read-only  | computed values                    |
| `Fold`      | many        | read-only  | extracted collections              |

Those categories matter more than the spelling of a constructor. `compose(outer, inner)` combines the categories first and the concrete methods second, which is why `Getter` and `Fold` infect a composition with read-only behaviour and why a `Traversal` turns a single focus into a many-focus result.

## Start here

- [Quick start](quick-start.md) introduces the six optic kinds and the smallest useful compositions.
- [Composition](composition.md) explains the full result-kind matrix, read-only degradation, and the `Prism ∘ Iso` materialization exception.
- [Combinators](combinators.md) covers the standard helpers: `guard`, `at`, `index`, and `each`.
- [API reference](api-reference.md) documents every public constructor, helper, and exported utility type from `src/index.ts`.
- [Semantics and laws](semantics-and-laws.md) records immutability, no-op behaviour, identity preservation, and round-trip expectations.
- [Best practices](best-practices.md) turns those semantics into practical usage guidance.

## Coverage map

The public module exports:

- Factories and constructors: `Lens`, `Prism`, `Iso`, `Traversal`, `Getter`, `Fold`
- Standalone helpers: `compose`, `guard`, `at`, `index`, `each`
- Types: `Optic`, `InferSource`, `InferTarget`

The pages in this directory cover all of them without introducing any extra runtime API.

## How the pages fit together

If you are deciding which optic to start with, use [Quick start](quick-start.md).
If you already have optics and need to know what their composition becomes, use [Composition](composition.md).
If your data shape already looks like "optional branch", "record key", "array slot", or "all array elements", use [Combinators](combinators.md).
If you need signatures and behaviour in one place, use [API reference](api-reference.md).

## Documentation contract

- Canonical prose lives in `docs/*.md`.
- Navigation metadata lives in [`navigation.json`](navigation.json) and points at the same Markdown files.
- Other wrappers may project this tree into routes, but they should not fork the prose into a second corpus.
