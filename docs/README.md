# Optics documentation

This directory is the single source of truth for long-form documentation.
The same Markdown files should serve both of these consumers:

- the in-repository docs experience
- the eventual GitHub Pages wrapper

The root [`README.md`](../README.md) remains the primary installation and quick-start surface.
This docs home exists for everything that benefits from a stable permalink and a broader information architecture.

## Start here

- [Quick start](quick-start.md) for moving from install to useful optics quickly
- [Composition](composition.md) for the optic composition model and result-kind matrix
- [Combinators](combinators.md) for `guard`, `at`, `index`, and `each`
- [API reference](api-reference.md) for the exported surface area
- [Semantics and laws](semantics-and-laws.md) for operational guarantees and law-like expectations
- [Best practices](best-practices.md) for pragmatic guidance when composing optics in application code

## Content contract

- Canonical prose lives in `docs/*.md`.
- Navigation metadata lives in [`navigation.json`](navigation.json) and points at the same Markdown files.
- A site wrapper should project this tree into routes; it should not introduce a second prose corpus.

## Initial page set

| Page               | Stable path                  | Purpose                                                |
| ------------------ | ---------------------------- | ------------------------------------------------------ |
| Docs home          | `docs/README.md`             | Repository-visible home and site root source           |
| Quick start        | `docs/quick-start.md`        | Short path from install to first useful composition    |
| Composition        | `docs/composition.md`        | Composition rules, result kinds, and chain-building    |
| Combinators        | `docs/combinators.md`        | Focused guidance for the standard combinators          |
| API reference      | `docs/api-reference.md`      | Exported types, constructors, and standalone functions |
| Semantics and laws | `docs/semantics-and-laws.md` | Behavioural guarantees, law framing, and edge cases    |
| Best practices     | `docs/best-practices.md`     | Advice for ergonomic and predictable usage             |
