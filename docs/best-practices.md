# Best practices

Use optics as small composable values, not as an excuse to launder arbitrary business logic through a setter-shaped API.

## Match the optic to the semantics

Choose the constructor that matches the data shape you actually have:

- `Lens` for total required focus
- `Prism` for optional focus or sum-type branch selection
- `Iso` for reversible representation changes
- `Traversal` for many writable foci
- `Getter` for one derived read-only value
- `Fold` for many derived read-only values

If you pick a more powerful optic than the data deserves, you will usually end up lying to the type system first and to future readers second.

## Compose one step at a time

Prefer several small optics composed with `compose(outer, inner)` over one bespoke optic that tries to explain an entire path at once.

Benefits:

- each step has a precise tag and law surface
- reuse stays easy
- tests can target the tricky step instead of the whole pipeline
- the result kind follows the matrix in [Composition](composition.md) instead of private convention

## Reach for combinators before custom optics

Prefer the exported helpers when they fit:

- `guard` for discriminated unions
- `at` for record entries
- `index` for one optional array position
- `each` for all array elements

They already encode the correct absent-branch and identity-preservation behaviour.

## Keep setters and modifiers pure

Custom `Prism`, `Traversal`, or `Iso` constructors are only as sound as the functions you supply.

- Do not mutate inside `set` or `modify`.
- Treat updater functions as pure transformations.
- Preserve untouched structure when possible.
- For `Iso`, make `to` and `from` actual inverses rather than approximate cousins.

The tests assume these contracts. A dishonest optic can still type-check; it just ceases to be an optic in any respectable sense.

## Prefer explicit partiality over invented defaults

When a branch may be absent, let `Prism#get` return `undefined` and let composed writes no-op when the path is missing.
Do not smuggle default objects into composed setters merely to make updates "convenient". That trades explicit absence for hidden data synthesis.

The deliberate exception is `Prism ∘ Iso`, where a concrete write can materialize because the `Iso` provides a lawful way back to the intermediate representation. If you need more aggressive materialization than that, model it directly in your own `Prism`.

## Use collection optics deliberately

For arrays and array-like shapes:

- use `index(i)` when you mean one optional element
- use `each()` when you mean all elements
- use `Lens<T[]>().prop(i)` only when the index is truly total in your model

The library supports numeric `Lens.prop` on arrays, but in most application code the partiality of `index` is the more honest description.

## Let read-only remain read-only

Do not fight the result of `compose` when it degrades to `Getter` or `Fold`.
That degradation is telling you something true:

- you are reading derived data
- or the path is partial or many-valued enough that a writable single-focus API would be dishonest

If you need mutation, revisit the optic choice earlier in the chain rather than trying to reconstruct mutation at the end.

## Related pages

- [API reference](api-reference.md) for the full exported surface.
- [Combinators](combinators.md) for the standard helpers.
- [Semantics and laws](semantics-and-laws.md) for the guarantees these practices rely on.
