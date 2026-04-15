# Best practices

Use optics as small composable values, not as an excuse to hide arbitrary business logic behind a setter-shaped curtain.

## Prefer small optics

Compose tiny optics with `compose` instead of building one large custom optic for an entire path.
Smaller optics are easier to test, reuse, and reason about.

## Match the constructor to the shape

- Use `Lens` when the focus is total.
- Use `Prism` when the focus may be absent.
- Use `Traversal` when there are many writable targets.
- Use `Getter` or `Fold` when read-only is semantically correct.

## Reach for combinators first

Prefer `guard`, `at`, `index`, and `each` when they fit.
They encode the partiality and multiplicity rules directly, which is preferable to re-deriving them poorly in application code.

## Preserve purity

- Do not mutate inside `set`, `modify`, or custom constructors.
- Treat updater functions as pure transformations.
- Rely on no-op behaviour for absent partial paths instead of smuggling in sentinel defaults.

## Stable neighbors

- [Combinators](combinators.md) covers the standard constructors.
- [Semantics and laws](semantics-and-laws.md) explains the behavioural guarantees these practices rely on.
