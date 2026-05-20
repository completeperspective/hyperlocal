const ADJECTIVES = [
  'swift',
  'bold',
  'calm',
  'dark',
  'keen',
  'wild',
  'sage',
  'cool',
  'fast',
  'bright',
  'deep',
  'still',
  'rare',
  'free',
  'lone',
  'iron',
  'mist',
  'dawn',
  'peak',
  'vale',
]

const NOUNS = [
  'fox',
  'hawk',
  'wolf',
  'bear',
  'elk',
  'owl',
  'crow',
  'pine',
  'stone',
  'lake',
  'ridge',
  'creek',
  'glen',
  'moor',
  'reef',
  'gale',
  'tide',
  'dune',
  'vale',
  'cliff',
]

export function generateNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  return `${adj}-${noun}`
}
