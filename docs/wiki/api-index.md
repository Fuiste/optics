# API index

Canonical glossary: `docs/wiki/api-glossary.md`

## Canonical API index (inventory-backed)

| API | Category | Canonical glossary entry | Example |
| --- | --- | --- | --- |
| `Lens` | Optic | [Lens](./api-glossary.md#lens) | [constructor + get/set](./api-glossary.md#lens) |
| `Prism` | Optic | [Prism](./api-glossary.md#prism) | [constructor + get/set](./api-glossary.md#prism) |
| `Iso` | Optic | [Iso](./api-glossary.md#iso) | [constructor + to/from](./api-glossary.md#iso) |
| `Traversal` | Optic | [Traversal](./api-glossary.md#traversal) | [constructor + getAll/modify](./api-glossary.md#traversal) |
| `Getter` | Optic | [Getter](./api-glossary.md#getter) | [constructor + get](./api-glossary.md#getter) |
| `Fold` | Optic | [Fold](./api-glossary.md#fold) | [constructor + getAll](./api-glossary.md#fold) |
| `Optic` | Utility type | [Optic](./api-glossary.md#optic) | [type example](./api-glossary.md#optic) |
| `InferSource` | Utility type | [InferSource](./api-glossary.md#infersource) | [type example](./api-glossary.md#infersource) |
| `InferTarget` | Utility type | [InferTarget](./api-glossary.md#infertarget) | [type example](./api-glossary.md#infertarget) |
| `compose` | Standalone function | [compose](./api-glossary.md#compose) | [composition example](./api-glossary.md#compose) |
| `guard` | Standalone function | [guard](./api-glossary.md#guard) | [type-guard example](./api-glossary.md#guard) |
| `at` | Standalone function | [at](./api-glossary.md#at) | [record example](./api-glossary.md#at) |
| `index` | Standalone function | [index](./api-glossary.md#index) | [array example](./api-glossary.md#index) |
| `each` | Standalone function | [each](./api-glossary.md#each) | [array example](./api-glossary.md#each) |

## Checklist

- [x] Every API listed in `api-inventory.md` appears in this index and glossary.
- [x] Every index row links to a glossary anchor that includes a handwritten example.
- [x] Method/property tables use the same heading set for each optic kind (`_tag`, `get`, `set`, `getAll`, `modify`, `to`, `from`).
- [x] Glossary path is referenced as `docs/wiki/api-glossary.md`.
