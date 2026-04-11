# Getting Started

This guide helps you choose the right optic for common data-shaping tasks and shows practical TypeScript usage.

## Quick decision guide

- Use `Lens` when a value is always present and you need to read and write it.
- Use `Prism` when a value may be missing or a union branch may not match.
- Use `Iso` when you need a two-way, reversible conversion.
- Use `Traversal` when you want to read or modify many values.
- Use `Getter` when you need a read-only computed value.
- Use `Fold` when you need one read-only extraction of many values.

Each section below includes a one-sentence use case and one runnable snippet.

## Lens

Use a `Lens` for required fields where both reading and updating are needed.

```typescript
import { Lens, compose } from '@fuiste/optics'

type Author = {
  name: string
  profile: {
    handle: string
    email: string
  }
}

const profile = Lens<Author>().prop('profile')
const emailLens = compose(profile, Lens<{ handle: string; email: string }>().prop('email'))

const author: Author = {
  name: 'Maya',
  profile: { handle: 'mya', email: 'maya@example.com' },
}

emailLens.get(author) // 'maya@example.com'
const updated = emailLens.set('maya@work.example')(author)
```

## Prism

Use a `Prism` for optional paths or union branches where updates should be a no-op when absent.

```typescript
import { Prism } from '@fuiste/optics'

type Response =
  | { kind: 'ok'; data: { token: string } }
  | { kind: 'error'; message: string }

const tokenPrism = Prism<Response>().of({
  get: (r) => (r.kind === 'ok' ? r.data.token : undefined),
  set: (token) => (r) =>
    r.kind === 'ok' ? { ...r, data: { ...r.data, token } } : r,
})

const okResponse: Response = { kind: 'ok', data: { token: 'abc123' } }

tokenPrism.get(okResponse) // 'abc123'
tokenPrism.set('xyz999')(okResponse)
// => { kind: 'ok', data: { token: 'xyz999' } }

tokenPrism.set('ignored')({ kind: 'error', message: 'network' })
// => unchanged: { kind: 'error', message: 'network' }
```

## Iso

Use an `Iso` for reversible conversions between two equivalent representations.

```typescript
import { Iso } from '@fuiste/optics'

const centsToDollars = Iso<number, string>({
  to: (amount) => `$${(amount / 100).toFixed(2)}`,
  from: (text) => Math.round(Number.parseFloat(text.replace('$', '')) * 100),
})

centsToDollars.to(2599) // '$25.99'
centsToDollars.from('$12.34') // 1234
```

## Traversal

Use a `Traversal` when you need to read or transform multiple elements, such as every item in an array.

```typescript
import { Lens, each, compose } from '@fuiste/optics'

type Inventory = {
  skus: ReadonlyArray<string>
}

const allSkus = compose(Lens<Inventory>().prop('skus'), each<string>())

const stock: Inventory = { skus: ['A-01', 'B-02', 'C-03'] }

allSkus.getAll(stock) // ['A-01', 'B-02', 'C-03']
const normalized = allSkus.modify((sku) => sku.toLowerCase())(stock)
// => { skus: ['a-01', 'b-02', 'c-03'] }
```

## Getter

Use a `Getter` for read-only derived values when updates are not needed.

```typescript
import { Lens, Getter, compose } from '@fuiste/optics'

type Invoice = {
  subtotal: number
  taxRate: number
}

type Checkout = {
  invoice: Invoice
}

const invoice = Lens<Checkout>().prop('invoice')
const total = Getter<Invoice, number>((i) => i.subtotal + i.subtotal * i.taxRate)

const checkoutTotal = compose(invoice, total)

checkoutTotal.get({ invoice: { subtotal: 100, taxRate: 0.09 } }) // 109
```

## Fold

Use a `Fold` to extract several read-only values from one source.

```typescript
import { Fold } from '@fuiste/optics'

const words = Fold<string, string>((s) => s.split(/\s+/).filter(Boolean))

words.getAll('functional optics are practical') // ['functional', 'optics', 'are', 'practical']
```

## Small workflow

Start with one optic:
- If you can always read/write a required field, pick `Lens`.
- If a value can be absent, pick `Prism`.
- If all you need is a reversible transform, pick `Iso`.
- If there are many values to update, pick `Traversal`.
- If you need derived read-only views, pick `Getter`.
- If you need read-only extraction of many values, pick `Fold`.
