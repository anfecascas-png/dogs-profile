import { Link } from 'react-router-dom'
import type { Dog, Appointment, Vaccination, Medication } from '../../types'
import { calculateAge, getVaccinationStatus, isWithinDays } from '../../utils/dateUtils'
import { getDogColor } from '../../constants/colors'

interface Props {
  dog: Dog
  index: number
  appointments: Appointment[]
  vaccinations: Vaccination[]
  medications: Medication[]
}

export function DogCard({ dog, index, appointments, vaccinations, medications }: Props) {
  const colors = getDogColor(index)

  const hasUpcomingAppointment = appointments.some(
    (a) => a.status === 'pendiente' && isWithinDays(a.date, 7)
  )
  const activeMeds = medications.filter((m) => m.is_active)
  const overdueOrSoonVaccinations = vaccinations.filter((v) => {
    const s = getVaccinationStatus(v.next_due_date)
    return s === 'vencida' || s === 'por_vencer'
  })

  const alerts = [
    hasUpcomingAppointment ? 'Cita próxima' : null,
    activeMeds.length > 0 ? `${activeMeds.length} medicamento${activeMeds.length !== 1 ? 's' : ''}` : null,
    overdueOrSoonVaccinations.length > 0 ? 'Vacunas' : null,
  ].filter(Boolean)

  return (
    <Link
      to={`/perro/${dog.id}`}
      className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow active:scale-95 transition-transform"
    >
      {/* Color banner */}
      <div className={`h-2 ${colors.bg}`} />

      <div className="p-4">
        {/* Photo + name */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-14 h-14 rounded-full ${colors.bgLight} flex items-center justify-center overflow-hidden flex-shrink-0`}>
            {dog.photo_url ? (
              <img
                src={dog.photo_url}
                alt={dog.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl">🐾</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 truncate">{dog.name}</h3>
            <p className="text-sm text-gray-500 truncate">{dog.breed}</p>
            <p className="text-xs text-gray-400">{calculateAge(dog.birth_date)}</p>
          </div>
        </div>

        {/* Info row */}
        <div className="flex gap-3 text-xs text-gray-500 mb-3">
          <span>{dog.weight_kg} kg</span>
          <span>·</span>
          <span className="capitalize">{dog.sex}</span>
        </div>

        {/* Alert badges */}
        {alerts.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {hasUpcomingAppointment && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600 font-medium">
                📅 Cita próxima
              </span>
            )}
            {activeMeds.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-sage-50 text-sage-600 font-medium">
                💊 {activeMeds.length} medicamento{activeMeds.length !== 1 ? 's' : ''}
              </span>
            )}
            {overdueOrSoonVaccinations.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-50 text-yellow-600 font-medium">
                ⚠️ Vacunas
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
