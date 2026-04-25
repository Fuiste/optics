---
title: Introduction
description: Type-safe functional optics for immutable TypeScript data.
section: Guides
navTitle: Introduction
order: 10
---

# Introduction

`@fuiste/optics` is a small TypeScript library for focusing on immutable data without turning every update into bespoke object-spread origami.

It gives you six optic kinds:

<div class="api-grid">
  <div class="api-card"><strong>Lens</strong><p>Total focus on required data.</p></div>
  <div class="api-card"><strong>Prism</strong><p>Partial focus on optional data or union branches.</p></div>
  <div class="api-card"><strong>Iso</strong><p>Total invertible mapping between two types.</p></div>
  <div class="api-card"><strong>Traversal</strong><p>Zero-or-more focus, usually arrays.</p></div>
  <div class="api-card"><strong>Getter</strong><p>Read-only total focus.</p></div>
  <div class="api-card"><strong>Fold</strong><p>Read-only zero-or-more extraction.</p></div>
</div>

All optics compose through the standalone `compose` function. The result type is inferred from the optic kinds involved, so `Lens` plus `Prism` becomes `Prism`, anything read-only stays read-only, and traversals do what traversals do: politely eat the structure.

```ts
import { Lens, compose, each } from '@fuiste/optics'

type Team = { members: Array<{ name: string }> }

const members = Lens<Team>().prop('members')
const eachMember = each<{ name: string }>()
const name = Lens<{ name: string }>().prop('name')

const memberNames = compose(compose(members, eachMember), name)

memberNames.getAll({ members: [{ name: 'Ada' }, { name: 'Grace' }] })
// ['Ada', 'Grace']
```

> Lawful by construction: the provided factories and combinators preserve the usual optic laws. Custom optics are still your responsibility, because TypeScript cannot save us from absolutely everything.

## What This Library Optimizes For

- Immutable updates with stable, focused APIs.
- Type inference that survives composition.
- Small functional building blocks instead of class hierarchies.
- Ergonomic construction for common paths, records, arrays, and discriminated unions.

## Install

```bash
pnpm add @fuiste/optics
```

Use npm, yarn, or bun if that is your particular local weather system.
