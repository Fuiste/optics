# Docs conventions

## Scope

The wiki is maintained as plain markdown files under `docs/wiki` only.

## Link conventions

- Use only repository-local relative links inside markdown: `./` for same-level links, `../` for parent-level links.
- Use explicit `.md` filenames in all page links.
- Use anchor links only for stable section anchors (`#lowercase-hyphen` style).
- Do not document tooling or process changes outside the markdown layout scope.

## Anchor strategy

README links should point to a page slug heading (for example `.../guides/composition.md#composition-guide`).

## Shared navigation pattern

Every page uses a compact “Navigation” section that includes:

- A link back to the wiki index (`./index.md` or `../index.md` depending on depth).
- A link to this conventions page (`./conventions.md` or `../conventions.md` depending on depth).
