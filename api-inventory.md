# Exported API Inventory (Canonical)

Scope: `src/index.ts`, `src/types.ts`, and current `README.md`.
Goal: restrict future wiki scope to documented, actually-exported functionality only.

## Verified export surface

From `src/index.ts`:
- `Lens`, `Prism`, `Iso`, `Traversal`, `Getter`, `Fold` (type aliases re-exported as named types)
- `Lens`, `Prism`, `Iso`, `Traversal`, `Getter`, `Fold` (constructors/factories)
- `compose`
- `guard`, `at`, `index`, `each`
- `Optic`, `InferSource`, `InferTarget`

From `src/types.ts`:
- `Lens`, `Prism`, `Iso`, `Traversal`, `Getter`, `Fold`
- `Optic`
- `InferSource`
- `InferTarget`

From `README.md`:
- API surface documented: `Lens`, `Prism`, `Iso`, `Traversal`, `Getter`, `Fold`, `compose`, `guard`, `at`, `index`, `each`, `Optic`, `InferSource`, `InferTarget`

## Boolean coverage matrix (authoritative for wiki pages)

| API | In index exports | In types definitions | README documented | API glossary | Composition docs |
| --- | --- | --- | --- | --- | --- |
| `Lens` | true | true | true | true | true |
| `Prism` | true | true | true | true | true |
| `Iso` | true | true | true | true | true |
| `Traversal` | true | true | true | true | true |
| `Getter` | true | true | true | true | true |
| `Fold` | true | true | true | true | true |
| `compose` | true | false | true | true | true |
| `guard` | true | false | true | true | false |
| `at` | true | false | true | true | false |
| `index` | true | false | true | true | false |
| `each` | true | false | true | true | false |
| `Optic` | true | true | true | true | false |
| `InferSource` | true | true | true | true | false |
| `InferTarget` | true | true | true | true | false |

### Explicit wiki decisions for utility types
- `Optic`: documented in README → include in API glossary; exclude from composition docs
- `InferSource`: documented in README → include in API glossary; exclude from composition docs
- `InferTarget`: documented in README → include in API glossary; exclude from composition docs

## Current behavior notes (documented + implementation-backed)

- `compose` is implemented in `src/compose.ts` as `compose(outer, inner): Optic`.
- `read-only propagation` is enforced by result tagging: `Getter`/`Fold` behavior is contagious (compose outputs `getter`/`fold` when read-only participates).
- `Prism#set` in no-branch paths behaves as a no-op; compositional use through missing prism branches also no-ops by default.
- `Prism ∘ Iso` exception exists: if `current` is missing and set input is a concrete value, the `Iso` constructor is used to materialize via outer `set`; updater-function path remains no-op when missing.
- Setter/updater operations preserve reference identity when target value does not change (`Object.is` check).
- `fold` result is a read-only multi-value optic (no `set`/`modify`).
- `traversal` result applies `modify` through each focused value.
- `at` and `index` are partial prisms with `get: undefined` when missing and `set` no-op on function updates when missing.
- `each` is an array traversal with identity-preserving update semantics.

## Page-to-scope mapping

- API glossary pages should be authored only from APIs marked `API glossary = true` in the matrix.
- Composition docs should be authored only from APIs marked `Composition docs = true` in the matrix.
- No additional APIs are in-scope unless they become explicit exports in `src/index.ts` and are reflected back into README.
