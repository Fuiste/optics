# Composition guide

## Composition guide

Compose optics with `compose(outer, inner)` to preserve shape and typing.

### Recommended pattern

- Compose the smallest, most specific optic first.
- Prefer narrow + narrow composition before fallback transforms.

### Example

Use `compose(Lens(...), Prism(...))` to keep failure behavior from the outer prism.

## Navigation

- [Index](../index.md)
- [Conventions](../conventions.md)
