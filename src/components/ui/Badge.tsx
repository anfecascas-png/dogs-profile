interface Props {
  label: string
  color?: 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'terra' | 'sage' | 'amber'
  size?: 'sm' | 'md'
}

const colorClasses = {
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-600',
  blue: 'bg-blue-100 text-blue-700',
  terra: 'bg-terra-100 text-terra-600',
  sage: 'bg-sage-100 text-sage-600',
  amber: 'bg-amber-100 text-amber-600',
}

export function Badge({ label, color = 'gray', size = 'sm' }: Props) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        colorClasses[color],
      ].join(' ')}
    >
      {label}
    </span>
  )
}
