import { Either } from 'effect'
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
export const programDo = pipe(
  Either.Do,
  Either.bind('currentName', () => nameL.get(person)),
  Either.let('uppercased', ({ currentName }) => currentName.toUpperCase()),
  Either.bind('updated', ({ uppercased }) => nameL.set(uppercased)(person)),
)

// 2) Use with pipe and Exit combinators
export const cityUpperEither = pipe(cityP.get(person), Either.map((c) => c.toUpperCase()))

// 3) Integrate with the Effect stdlib (map/flatMap/zip)
export const nameLenEither = Either.map(nameL.get(person), (n) => n.length)

export const zippedEither = Either.zipWith(
  nameL.get(person),
  Either.map(ageL.get(person), (a) => a + 1),
  (name, ageP1) => ({ name, ageP1 }),
)

// 4) Composition with Iso (Lens ∘ Iso)
const ageAsStringL = EffectLens<Person>().compose(ageL, numberString)
export const ageStringEither = ageAsStringL.get(person)
export const updatedAgeEither = ageAsStringL.set('31')(person)

// 5) Use prism set in a pipeline; failure when branch missing
export const setCityToLAEither = pipe(person, (p) => cityP.set('Los Angeles')(p))


