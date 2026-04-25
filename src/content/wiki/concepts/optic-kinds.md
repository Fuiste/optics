---
title: Optic Kinds
description: The six optic kinds and when to reach for each one.
section: Concepts
navTitle: Optic Kinds
order: 110
---

# Optic Kinds

An optic describes a relationship between a source type `S` and a focused target type `A`.

The kind tells you what operations are lawful.

| Kind              | Cardinality  | Writable | Use it for                      |
| ----------------- | ------------ | -------- | ------------------------------- |
| `Lens<S, A>`      | exactly one  | yes      | required fields                 |
| `Prism<S, A>`     | zero or one  | yes      | optional fields, union branches |
| `Iso<S, A>`       | exactly one  | yes      | invertible representations      |
| `Traversal<S, A>` | zero or more | yes      | arrays and repeated focuses     |
| `Getter<S, A>`    | exactly one  | no       | derived values                  |
| `Fold<S, A>`      | zero or more | no       | read-only extraction            |

## Total Vs Partial

A `Lens` is total. If you have a `Lens<Person, string>`, you can always get a `string` from a `Person`.

A `Prism` is partial. If you have a `Prism<Person, Address>`, `get` may return `undefined`.

```ts
const result = addressPrism.get(person)
// Address | undefined
```

## Writable Vs Read-Only

`Getter` and `Fold` deliberately have no write operations. Once a read-only optic enters composition, the result is read-only too.

This is not a limitation. It is the type system preventing you from setting a computed value and calling it a plan.
