export function calculateAge(birthDate: string): string {
  const birth = new Date(birthDate)
  const now = new Date()

  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()

  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--
    months += 12
  }

  if (now.getDate() < birth.getDate()) {
    months--
    if (months < 0) months = 0
  }

  if (years <= 0 && months <= 0) return 'Recién nacido'
  if (years === 0) return `${months} mes${months !== 1 ? 'es' : ''}`
  if (months === 0) return `${years} año${years !== 1 ? 's' : ''}`
  return `${years} año${years !== 1 ? 's' : ''} y ${months} mes${months !== 1 ? 'es' : ''}`
}

export type VaccinationStatus = 'al_dia' | 'por_vencer' | 'vencida' | 'sin_fecha'

export function getVaccinationStatus(nextDueDate?: string | null): VaccinationStatus {
  if (!nextDueDate) return 'sin_fecha'

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(nextDueDate)
  due.setHours(0, 0, 0, 0)

  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'vencida'
  if (diffDays <= 30) return 'por_vencer'
  return 'al_dia'
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

export function formatTime(timeStr?: string | null): string {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':')
  return `${h}:${m}`
}

export function isWithinDays(dateStr: string, days: number): boolean {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= days
}

export function isPast(dateStr: string): boolean {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return target.getTime() < now.getTime()
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}
