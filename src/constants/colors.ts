export interface DogColorScheme {
  bg: string
  bgLight: string
  text: string
  border: string
  badge: string
  hex: string
  tabActive: string
}

export const DOG_COLORS: DogColorScheme[] = [
  {
    bg: 'bg-terra-400',
    bgLight: 'bg-terra-100',
    text: 'text-terra-600',
    border: 'border-terra-300',
    badge: 'bg-terra-400 text-white',
    hex: '#C97B5A',
    tabActive: 'border-terra-400 text-terra-600',
  },
  {
    bg: 'bg-sage-400',
    bgLight: 'bg-sage-100',
    text: 'text-sage-600',
    border: 'border-sage-300',
    badge: 'bg-sage-400 text-white',
    hex: '#628D62',
    tabActive: 'border-sage-400 text-sage-600',
  },
  {
    bg: 'bg-amber-400',
    bgLight: 'bg-amber-100',
    text: 'text-amber-600',
    border: 'border-amber-300',
    badge: 'bg-amber-400 text-white',
    hex: '#D4913A',
    tabActive: 'border-amber-400 text-amber-600',
  },
]

export function getDogColor(index: number): DogColorScheme {
  return DOG_COLORS[index % DOG_COLORS.length]
}
