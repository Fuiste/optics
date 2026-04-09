import { describe, expect, it } from 'vitest'
import { Lens, Prism, Iso, Getter, Fold, compose, guard, at, each } from '../src'

// ── Shared fixtures ───────────────────────────────────────────────────

type Address = { street: string; city: string }
type Person = { name: string; age: number; address: Address }
type OptionalPerson = { name: string; age: number; address?: Address }

const person: Person = {
  name: 'John',
  age: 30,
  address: { street: '123 Main St', city: 'New York' },
}

const addressLens = Lens<Person>().prop('address')
const cityLens = Lens<Address>().prop('city')
const nameLens = Lens<Person>().prop('name')

const addressPrism = Prism<OptionalPerson>().of({
  get: (p) => p.address,
  set: (address) => (p) => ({ ...p, address }),
})

const cityPrism = Prism<Address>().of({
  get: (a) => a.city as string | undefined,
  set: (city) => (a) => ({ ...a, city }),
})

const numberString = Iso<number, string>({
  to: (n) => `${n}`,
  from: (s) => parseInt(s, 10),
})

// ── Iso ∘ Iso => Iso ──────────────────────────────────────────────────

describe('Iso ∘ Iso => Iso', () => {
  const double = Iso<number, number>({ to: (n) => n * 2, from: (n) => n / 2 })
  const composed = compose(numberString, double)

  it('has tag iso', () => {
    expect(composed._tag).toBe('iso')
  })

  it('composes to', () => {
    expect(composed.to(5)).toBe(10)
  })

  it('composes from', () => {
    expect(composed.from(10)).toBe(5)
  })
})

// ── Lens results ──────────────────────────────────────────────────────

describe('Lens ∘ Lens => Lens', () => {
  const personCity = compose(addressLens, cityLens)

  it('has tag lens', () => {
    expect(personCity._tag).toBe('lens')
  })

  it('gets nested property', () => {
    expect(personCity.get(person)).toBe('New York')
  })

  it('sets nested property immutably', () => {
    const updated = personCity.set('LA')(person)
    expect(updated.address.city).toBe('LA')
    expect(person.address.city).toBe('New York')
    expect(updated.name).toBe('John')
  })

  it('sets via function updater', () => {
    const updated = personCity.set((c) => c.toUpperCase())(person)
    expect(updated.address.city).toBe('NEW YORK')
  })

  it('returns the original reference for unchanged updates', () => {
    expect(personCity.set('New York')(person)).toBe(person)
    expect(personCity.set((city) => city)(person)).toBe(person)
  })
})

describe('Lens ∘ Iso => Lens', () => {
  type Model = { count: number }
  const countLens = Lens<Model>().prop('count')
  const countAsString = compose(countLens, numberString)

  it('has tag lens', () => {
    expect(countAsString._tag).toBe('lens')
  })

  it('gets through iso', () => {
    expect(countAsString.get({ count: 7 })).toBe('7')
  })

  it('sets through iso', () => {
    const updated = countAsString.set('10')({ count: 7 })
    expect(updated.count).toBe(10)
  })

  it('sets via function updater through iso', () => {
    const updated = countAsString.set((s) => `${parseInt(s, 10) + 1}`)({ count: 7 })
    expect(updated.count).toBe(8)
  })
})

describe('Iso ∘ Lens => Lens', () => {
  type Pair = { first: number; second: number }
  type Wrapper = { pair: Pair }
  const unwrap = Iso<Wrapper, Pair>({
    to: (w) => w.pair,
    from: (p) => ({ pair: p }),
  })
  const firstLens = Lens<Pair>().prop('first')
  const composed = compose(unwrap, firstLens)

  it('has tag lens', () => {
    expect(composed._tag).toBe('lens')
  })

  it('gets through iso then lens', () => {
    expect(composed.get({ pair: { first: 1, second: 2 } })).toBe(1)
  })

  it('sets through iso then lens', () => {
    const updated = composed.set(99)({ pair: { first: 1, second: 2 } })
    expect(updated).toMatchInlineSnapshot(`
      {
        "pair": {
          "first": 99,
          "second": 2,
        },
      }
    `)
  })
})

// ── Prism results ─────────────────────────────────────────────────────

describe('Lens ∘ Prism => Prism', () => {
  const addressLensOnPerson = Lens<Person>().prop('address')
  const composed = compose(addressLensOnPerson, cityPrism)

  it('has tag prism', () => {
    expect(composed._tag).toBe('prism')
  })

  it('gets value when present', () => {
    expect(composed.get(person)).toBe('New York')
  })

  it('sets a concrete value', () => {
    const updated = composed.set('LA')(person)
    expect(updated.address.city).toBe('LA')
  })

  it('sets via function updater', () => {
    const updated = composed.set((c) => c.toUpperCase())(person)
    expect(updated.address.city).toBe('NEW YORK')
  })
})

describe('Prism ∘ Lens => Prism', () => {
  const composed = compose(addressPrism, cityLens)
  const withAddr: OptionalPerson = {
    name: 'John',
    age: 30,
    address: { street: '123', city: 'New York' },
  }
  const withoutAddr: OptionalPerson = { name: 'John', age: 30 }

  it('has tag prism', () => {
    expect(composed._tag).toBe('prism')
  })

  it('gets when outer is present', () => {
    expect(composed.get(withAddr)).toBe('New York')
  })

  it('returns undefined when outer is absent', () => {
    expect(composed.get(withoutAddr)).toBeUndefined()
  })

  it('sets when outer is present', () => {
    const updated = composed.set('LA')(withAddr)
    expect(updated.address?.city).toBe('LA')
  })

  it('no-ops set when outer is absent', () => {
    const updated = composed.set('LA')(withoutAddr)
    expect(updated).toEqual(withoutAddr)
  })

  it('no-ops function updater when outer is absent', () => {
    const updated = composed.set((c) => c.toUpperCase())(withoutAddr)
    expect(updated).toEqual(withoutAddr)
  })

  it('applies function updater when present', () => {
    const updated = composed.set((c) => c.toUpperCase())(withAddr)
    expect(updated.address?.city).toBe('NEW YORK')
  })
})

describe('Prism ∘ Prism => Prism', () => {
  const composed = compose(addressPrism, cityPrism)
  const withAddr: OptionalPerson = {
    name: 'John',
    age: 30,
    address: { street: '123', city: 'NYC' },
  }
  const withoutAddr: OptionalPerson = { name: 'John', age: 30 }

  it('has tag prism', () => {
    expect(composed._tag).toBe('prism')
  })

  it('gets when both present', () => {
    expect(composed.get(withAddr)).toBe('NYC')
  })

  it('returns undefined when outer absent', () => {
    expect(composed.get(withoutAddr)).toBeUndefined()
  })

  it('no-ops set when outer absent (concrete)', () => {
    expect(composed.set('LA')(withoutAddr)).toEqual(withoutAddr)
  })

  it('no-ops set when outer absent (function)', () => {
    expect(composed.set((c) => c.toUpperCase())(withoutAddr)).toEqual(withoutAddr)
  })
})

describe('Prism ∘ Iso => Prism (materializes)', () => {
  type Model = { count?: number }
  const countPrism = Prism<Model>().of({
    get: (m) => m.count,
    set: (count) => (m) => ({ ...m, count }),
  })
  const composed = compose(countPrism, numberString)

  it('has tag prism', () => {
    expect(composed._tag).toBe('prism')
  })

  it('gets when present', () => {
    expect(composed.get({ count: 5 })).toBe('5')
  })

  it('returns undefined when absent', () => {
    expect(composed.get({})).toBeUndefined()
  })

  it('materializes a concrete value even when absent', () => {
    const updated = composed.set('9')({})
    expect(updated).toMatchInlineSnapshot(`
      {
        "count": 9,
      }
    `)
  })

  it('no-ops a function updater when absent', () => {
    const updated = composed.set((s) => `${parseInt(s, 10) + 1}`)({})
    expect(updated).toEqual({})
  })

  it('applies a function updater when present', () => {
    const updated = composed.set((s) => `${parseInt(s, 10) + 1}`)({ count: 3 })
    expect(updated.count).toBe(4)
  })
})

describe('Iso ∘ Prism => Prism', () => {
  type Wrapper = { inner: { value?: number } }
  type Inner = { value?: number }
  const unwrap = Iso<Wrapper, Inner>({
    to: (w) => w.inner,
    from: (i) => ({ inner: i }),
  })
  const valuePrism = Prism<Inner>().of({
    get: (i) => i.value,
    set: (v) => (i) => ({ ...i, value: v }),
  })
  const composed = compose(unwrap, valuePrism)

  it('has tag prism', () => {
    expect(composed._tag).toBe('prism')
  })

  it('gets when present', () => {
    expect(composed.get({ inner: { value: 42 } })).toBe(42)
  })

  it('returns undefined when absent', () => {
    expect(composed.get({ inner: {} })).toBeUndefined()
  })

  it('sets when present', () => {
    const updated = composed.set(99)({ inner: { value: 42 } })
    expect(updated).toMatchInlineSnapshot(`
      {
        "inner": {
          "value": 99,
        },
      }
    `)
  })
})

// ── Getter results ────────────────────────────────────────────────────

describe('Lens ∘ Getter => Getter', () => {
  const cityLen = Getter<Address, number>((a) => a.city.length)
  const composed = compose(addressLens, cityLen)

  it('has tag getter', () => {
    expect(composed._tag).toBe('getter')
  })

  it('gets computed value through lens', () => {
    expect(composed.get(person)).toBe(8) // 'New York'.length
  })
})

describe('Getter ∘ Lens => Getter', () => {
  type Pair = { a: number; b: number }
  const pairGetter = Getter<number, Pair>((n) => ({ a: n, b: n * 2 }))
  const aLens = Lens<Pair>().prop('a')
  const composed = compose(pairGetter, aLens)

  it('has tag getter', () => {
    expect(composed._tag).toBe('getter')
  })

  it('gets through getter then lens', () => {
    expect(composed.get(5)).toBe(5)
  })
})

describe('Getter ∘ Getter => Getter', () => {
  const strlen = Getter<string, number>((s) => s.length)
  const isEven = Getter<number, boolean>((n) => n % 2 === 0)
  const composed = compose(strlen, isEven)

  it('has tag getter', () => {
    expect(composed._tag).toBe('getter')
  })

  it('composes two getters', () => {
    expect(composed.get('hello')).toBe(false) // 5 is odd
    expect(composed.get('hi')).toBe(true) // 2 is even
  })
})

describe('Iso ∘ Getter => Getter', () => {
  const isPositive = Getter<number, boolean>((n) => n > 0)
  const composed = compose(numberString, isPositive)

  it('has tag getter', () => {
    expect(composed._tag).toBe('getter')
  })

  it('gets through iso then getter', () => {
    expect(composed.get('5')).toBe(true)
    expect(composed.get('-3')).toBe(false)
  })
})

describe('Getter ∘ Iso => Getter', () => {
  const strlen = Getter<string, number>((s) => s.length)
  const composed = compose(strlen, numberString)

  it('has tag getter', () => {
    expect(composed._tag).toBe('getter')
  })

  it('gets through getter then iso', () => {
    expect(composed.get('hello')).toBe('5')
  })
})

// ── Traversal results ────────────────────────────────────────────────

describe('Lens ∘ Traversal => Traversal', () => {
  type Team = { members: string[] }
  const membersLens = Lens<Team>().prop('members')
  const eachMember = each<string>()
  const composed = compose(membersLens, eachMember)

  it('has tag traversal', () => {
    expect(composed._tag).toBe('traversal')
  })

  it('getAll through lens into traversal', () => {
    expect(composed.getAll({ members: ['Alice', 'Bob'] })).toMatchInlineSnapshot(`
      [
        "Alice",
        "Bob",
      ]
    `)
  })

  it('modify through lens into traversal', () => {
    const updated = composed.modify((n) => n.toUpperCase())({ members: ['Alice', 'Bob'] })
    expect(updated).toMatchInlineSnapshot(`
      {
        "members": [
          "ALICE",
          "BOB",
        ],
      }
    `)
  })
})

describe('Traversal ∘ Lens => Traversal', () => {
  type Item = { name: string; price: number }
  const eachItem = each<Item>()
  const priceLens = Lens<Item>().prop('price')
  const composed = compose(eachItem, priceLens)

  it('has tag traversal', () => {
    expect(composed._tag).toBe('traversal')
  })

  it('getAll extracts all prices', () => {
    const items: Item[] = [
      { name: 'A', price: 10 },
      { name: 'B', price: 20 },
    ]
    expect(composed.getAll(items)).toMatchInlineSnapshot(`
      [
        10,
        20,
      ]
    `)
  })

  it('modify updates all prices', () => {
    const items: Item[] = [
      { name: 'A', price: 10 },
      { name: 'B', price: 20 },
    ]
    const updated = composed.modify((p) => p * 2)(items)
    expect(updated).toMatchInlineSnapshot(`
      [
        {
          "name": "A",
          "price": 20,
        },
        {
          "name": "B",
          "price": 40,
        },
      ]
    `)
  })
})

describe('Traversal ∘ Traversal => Traversal', () => {
  const outer = each<number[]>()
  const inner = each<number>()
  const composed = compose(outer, inner)

  it('has tag traversal', () => {
    expect(composed._tag).toBe('traversal')
  })

  it('flattens nested arrays', () => {
    expect(composed.getAll([[1, 2], [3], [4, 5, 6]])).toMatchInlineSnapshot(`
      [
        1,
        2,
        3,
        4,
        5,
        6,
      ]
    `)
  })

  it('modifies all nested elements', () => {
    const updated = composed.modify((n) => n * 10)([[1, 2], [3]])
    expect(updated).toMatchInlineSnapshot(`
      [
        [
          10,
          20,
        ],
        [
          30,
        ],
      ]
    `)
  })
})

describe('Prism ∘ Traversal => Traversal', () => {
  type Config = { tags?: string[] }
  const tagsPrism = Prism<Config>().of({
    get: (c) => c.tags,
    set: (tags) => (c) => ({ ...c, tags }),
  })
  const eachTag = each<string>()
  const composed = compose(tagsPrism, eachTag)

  it('has tag traversal', () => {
    expect(composed._tag).toBe('traversal')
  })

  it('getAll when present', () => {
    expect(composed.getAll({ tags: ['a', 'b'] })).toMatchInlineSnapshot(`
      [
        "a",
        "b",
      ]
    `)
  })

  it('getAll empty when absent', () => {
    expect(composed.getAll({})).toMatchInlineSnapshot(`[]`)
  })

  it('modifies when present', () => {
    const updated = composed.modify((t) => t.toUpperCase())({ tags: ['x', 'y'] })
    expect(updated).toMatchInlineSnapshot(`
      {
        "tags": [
          "X",
          "Y",
        ],
      }
    `)
  })

  it('no-ops modify when absent', () => {
    const original: Config = {}
    const updated = composed.modify((t) => t.toUpperCase())(original)
    expect(updated).toEqual(original)
  })
})

describe('Traversal ∘ Prism => Traversal', () => {
  type MaybeNum = { value?: number }
  const eachItem = each<MaybeNum>()
  const valuePrism = Prism<MaybeNum>().of({
    get: (m) => m.value,
    set: (v) => (m) => ({ ...m, value: v }),
  })
  const composed = compose(eachItem, valuePrism)

  it('has tag traversal', () => {
    expect(composed._tag).toBe('traversal')
  })

  it('getAll filters out missing values', () => {
    expect(composed.getAll([{ value: 1 }, {}, { value: 3 }])).toMatchInlineSnapshot(`
      [
        1,
        3,
      ]
    `)
  })

  it('modifies present values, leaves absent alone', () => {
    const updated = composed.modify((n) => n * 10)([{ value: 1 }, {}, { value: 3 }])
    expect(updated).toMatchInlineSnapshot(`
      [
        {
          "value": 10,
        },
        {},
        {
          "value": 30,
        },
      ]
    `)
  })
})

describe('Iso ∘ Traversal => Traversal', () => {
  type Wrapper = { items: number[] }
  const unwrap = Iso<Wrapper, number[]>({
    to: (w) => w.items,
    from: (items) => ({ items }),
  })
  const eachNum = each<number>()
  const composed = compose(unwrap, eachNum)

  it('has tag traversal', () => {
    expect(composed._tag).toBe('traversal')
  })

  it('getAll through iso', () => {
    expect(composed.getAll({ items: [1, 2, 3] })).toMatchInlineSnapshot(`
      [
        1,
        2,
        3,
      ]
    `)
  })

  it('modifies through iso', () => {
    const updated = composed.modify((n) => n + 1)({ items: [1, 2, 3] })
    expect(updated).toMatchInlineSnapshot(`
      {
        "items": [
          2,
          3,
          4,
        ],
      }
    `)
  })
})

describe('Traversal ∘ Iso => Traversal', () => {
  const eachNum = each<number>()
  const composed = compose(eachNum, numberString)

  it('has tag traversal', () => {
    expect(composed._tag).toBe('traversal')
  })

  it('getAll applies iso', () => {
    expect(composed.getAll([1, 2, 3])).toMatchInlineSnapshot(`
      [
        "1",
        "2",
        "3",
      ]
    `)
  })

  it('modifies through iso', () => {
    const updated = composed.modify((s) => `${parseInt(s, 10) * 2}`)([1, 2, 3])
    expect(updated).toMatchInlineSnapshot(`
      [
        2,
        4,
        6,
      ]
    `)
  })
})

// ── Fold results ──────────────────────────────────────────────────────

describe('Fold results (selected combos)', () => {
  it('Lens ∘ Fold => Fold', () => {
    const words = Fold<string, string>((s) => s.split(' '))
    const composed = compose(nameLens, words)
    expect(composed._tag).toBe('fold')
    expect(composed.getAll(person)).toMatchInlineSnapshot(`
      [
        "John",
      ]
    `)
  })

  it('Prism ∘ Getter => Fold', () => {
    const strlen = Getter<Address, number>((a) => a.city.length)
    const composed = compose(addressPrism, strlen)
    expect(composed._tag).toBe('fold')
    expect(
      composed.getAll({ name: 'A', age: 1, address: { street: 's', city: 'NYC' } }),
    ).toMatchInlineSnapshot(`
      [
        3,
      ]
    `)
    expect(composed.getAll({ name: 'A', age: 1 })).toMatchInlineSnapshot(`[]`)
  })

  it('Getter ∘ Prism => Fold', () => {
    type Obj = { x?: number }
    const getter = Getter<string, Obj>((s) => (s.length > 0 ? { x: s.length } : {}))
    const xPrism = Prism<Obj>().of({
      get: (o) => o.x,
      set: (x) => (o) => ({ ...o, x }),
    })
    const composed = compose(getter, xPrism)
    expect(composed._tag).toBe('fold')
    expect(composed.getAll('hello')).toMatchInlineSnapshot(`
      [
        5,
      ]
    `)
    expect(composed.getAll('')).toMatchInlineSnapshot(`[]`)
  })

  it('Traversal ∘ Getter => Fold', () => {
    type Item = { name: string }
    const eachItem = each<Item>()
    const nameGetter = Getter<Item, string>((i) => i.name)
    const composed = compose(eachItem, nameGetter)
    expect(composed._tag).toBe('fold')
    expect(
      composed.getAll([{ name: 'A' }, { name: 'B' }]),
    ).toMatchInlineSnapshot(`
      [
        "A",
        "B",
      ]
    `)
  })

  it('Fold ∘ Fold => Fold', () => {
    const words = Fold<string, string>((s) => s.split(' '))
    const chars = Fold<string, string>((s) => [...s])
    const composed = compose(words, chars)
    expect(composed._tag).toBe('fold')
    expect(composed.getAll('hi yo')).toMatchInlineSnapshot(`
      [
        "h",
        "i",
        "y",
        "o",
      ]
    `)
  })

  it('Fold ∘ Lens => Fold', () => {
    type Item = { value: number }
    const items = Fold<Item[], Item>((arr) => arr)
    const valueLens = Lens<Item>().prop('value')
    const composed = compose(items, valueLens)
    expect(composed._tag).toBe('fold')
    expect(
      composed.getAll([{ value: 1 }, { value: 2 }]),
    ).toMatchInlineSnapshot(`
      [
        1,
        2,
      ]
    `)
  })
})

// ── Practical integration ─────────────────────────────────────────────

describe('multi-step composition chains', () => {
  it('Lens ∘ Traversal ∘ Lens: all employee names', () => {
    type Company = { employees: Array<{ name: string; role: string }> }
    const employeesLens = Lens<Company>().prop('employees')
    const eachEmployee = each<{ name: string; role: string }>()
    const empNameLens = Lens<{ name: string; role: string }>().prop('name')

    const allNames = compose(compose(employeesLens, eachEmployee), empNameLens)
    const company: Company = {
      employees: [
        { name: 'Alice', role: 'Dev' },
        { name: 'Bob', role: 'PM' },
      ],
    }

    expect(allNames.getAll(company)).toMatchInlineSnapshot(`
      [
        "Alice",
        "Bob",
      ]
    `)

    const updated = allNames.modify((n) => n.toUpperCase())(company)
    expect(updated.employees).toMatchInlineSnapshot(`
      [
        {
          "name": "ALICE",
          "role": "Dev",
        },
        {
          "name": "BOB",
          "role": "PM",
        },
      ]
    `)
  })

  it('guard ∘ Lens: radius of circles only', () => {
    type Circle = { type: 'circle'; radius: number }
    type Square = { type: 'square'; side: number }
    type Shape = Circle | Square

    const circlePrism = guard<Shape, Circle>((s): s is Circle => s.type === 'circle')
    const radiusLens = Lens<Circle>().prop('radius')
    const circleRadius = compose(circlePrism, radiusLens)

    expect(circleRadius.get({ type: 'circle', radius: 5 })).toBe(5)
    expect(circleRadius.get({ type: 'square', side: 4 })).toBeUndefined()
    expect(circleRadius.set(10)({ type: 'circle', radius: 5 })).toMatchInlineSnapshot(`
      {
        "radius": 10,
        "type": "circle",
      }
    `)
  })

  it('Lens ∘ at: record key access through a lens', () => {
    type Config = { headers: Record<string, string> }
    const headersLens = Lens<Config>().prop('headers')
    const authHeader = at<string>('Authorization')
    const configAuth = compose(headersLens, authHeader)

    expect(
      configAuth.get({ headers: { Authorization: 'Bearer x' } }),
    ).toBe('Bearer x')
    expect(configAuth.get({ headers: {} })).toBeUndefined()

    const updated = configAuth.set('Bearer y')({ headers: { Authorization: 'Bearer x' } })
    expect(updated.headers['Authorization']).toBe('Bearer y')
  })
})
