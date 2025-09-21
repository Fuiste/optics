import { Effect, Exit } from 'effect'
import { pipe } from 'effect/Function'
import { EffectIso, EffectLens, EffectPrism } from './effectful'

// Example domain
type Address = { street: string; city: string }
type Person = { name: string; age: number; address?: Address }

const person: Person = {
  name: 'John',
  age: 30,
  address: { street: '123 Main St', city: 'New York' },
}

// Optics
const nameL = EffectLens<Person>().prop('name')
const ageL = EffectLens<Person>().prop('age')
const addressP = EffectPrism<Person>().of({ get: (p) => p.address, set: (a) => (p) => ({ ...p, address: a }) })
const cityL = EffectLens<Address>().prop('city')
const numberString = EffectIso<number, string>({ to: (n) => `${n}`, from: (s) => parseInt(s, 10) })

// Compose effectful optics (Prism ∘ Lens)
const cityP = EffectPrism<Person>().compose(addressP, cityL)

// 1) Use inside Effect.gen (generator)
export const programGen = Effect.gen(function* (_) {
  const currentName = yield* _(nameL.get(person))
  const uppercased = currentName.toUpperCase()
  const updated = yield* _(nameL.set(uppercased)(person))
  return updated
})

// 2) Use with pipe and Exit combinators
export const cityUpperExit = pipe(
  cityP.get(person),
  Exit.map((c) => c.toUpperCase()),
)

// 3) Integrate with the Effect stdlib (map/flatMap/zip)
export const nameLenExit = Exit.map(nameL.get(person), (n) => n.length)

export const zippedExit = Exit.zip(nameL.get(person), Exit.map(ageL.get(person), (a) => a + 1))

// 4) Composition with Iso (Lens ∘ Iso)
const ageAsStringL = EffectLens<Person>().compose(ageL, numberString)
export const ageStringExit = ageAsStringL.get(person)
export const updatedAgeExit = ageAsStringL.set('31')(person)

// 5) Use prism set in a pipeline; failure when branch missing
export const setCityToLAExit = pipe(person, (p) => cityP.set('Los Angeles')(p))


