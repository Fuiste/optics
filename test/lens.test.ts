import { describe, expect, it } from 'vitest'
import { Lens } from '../src'

type Address = { street: string; city: string }
type Person = { name: string; age: number; address: Address }

describe('Lens', () => {
  const person: Person = {
    name: 'John',
    age: 30,
    address: { street: '123 Main St', city: 'New York' },
  }

  describe('prop', () => {
    const nameLens = Lens<Person>().prop('name')

    it('gets a property value', () => {
      expect(nameLens.get(person)).toBe('John')
    })

    it('sets a property value immutably', () => {
      const updated = nameLens.set('Jane')(person)
      expect(updated.name).toBe('Jane')
      expect(person.name).toBe('John')
      expect(updated.age).toBe(30)
    })

    it('sets via a function updater', () => {
      const updated = nameLens.set((n) => n.toUpperCase())(person)
      expect(updated.name).toBe('JOHN')
      expect(person.name).toBe('John')
    })

    it('handles numeric keys for array access', () => {
      type Company = { employees: Array<{ name: string }> }
      const company: Company = { employees: [{ name: 'Alice' }, { name: 'Bob' }] }
      const firstEmployee = Lens<Company['employees']>().prop(0)
      expect(firstEmployee.get(company.employees)).toMatchInlineSnapshot(`
        {
          "name": "Alice",
        }
      `)
    })

    it('preserves arrays when setting numeric keys', () => {
      type Company = { employees: Array<{ name: string }> }
      const employees: Company['employees'] = [{ name: 'Alice' }, { name: 'Bob' }]
      const firstEmployee = Lens<Company['employees']>().prop(0)
      const updated = firstEmployee.set({ name: 'Zed' })(employees)

      expect(Array.isArray(updated)).toBe(true)
      expect(updated).toMatchInlineSnapshot(`
        [
          {
            "name": "Zed",
          },
          {
            "name": "Bob",
          },
        ]
      `)
    })

    it('returns the original reference for unchanged updates', () => {
      expect(nameLens.set('John')(person)).toBe(person)
      expect(nameLens.set((name) => name)(person)).toBe(person)
    })
  })

  describe('_tag', () => {
    it('is tagged as lens', () => {
      expect(Lens<Person>().prop('name')._tag).toBe('lens')
    })
  })
})
