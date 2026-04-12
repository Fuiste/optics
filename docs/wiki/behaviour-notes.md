# Behaviour Notes

This page captures documented edge-case behavior from the README.

## no-op behavior

- `Prism#get` may return `undefined` when focus is absent.
- `Prism#set` through a composed path with a missing outer branch is a no-op by default.
- `Prism#set` function updaters are also no-ops when the focused branch is missing.
- `index` notes the same shape-level behavior: `get` is `undefined` for out-of-bounds indices and `set` is a no-op.

## readonly propagation

- `Getter` and `Fold` are read-only and expose only read operations.
- A read-only optic in composition makes the composed result read-only.
- The README calls this out as: `getter` + partial optic → `Fold`, and `getter` + total optic → `Getter`.

## compose read-only effects

- The composition matrix defines how kinds combine; read-only contagion is explicit:
  - `Fold` with anything => `Fold`.
  - `Getter` + partial optic => `Fold`.
  - `Getter` + total optic => `Getter`.
- In general, composing with read-only optics propagates read-only results unless explicitly transformed via total optics in the documented matrix.

## read-only semantics and setter no-op behavior

- `Getter`/`Fold` have no `set`/`modify`; they are permanently read-only.
- `Prism#set` is no-op when absent in a composed setting unless the composition is `Prism ∘ Iso`:
  - providing a concrete value can still materialize through outer `Prism#set` when `get` is `undefined` because the `Iso` can always construct the intermediate value.
  - providing a function updater still remains a no-op when missing.
- This keeps update semantics conservative for readonly and missing-target paths while allowing the `Prism ∘ Iso` materialization exception.
