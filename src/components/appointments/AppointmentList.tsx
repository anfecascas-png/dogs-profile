import { useState } from 'react'
import type { Appointment, AppointmentStatus } from '../../types'
import { supabase } from '../../lib/supabase'
import { formatDate, formatTime, isWithinDays, isPast } from '../../utils/dateUtils'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/Modal'
import { AppointmentForm } from './AppointmentForm'

interface Props {
  dogId: string
  appointments: Appointment[]
  isEditor: boolean
  onRefresh: () => void
}

const statusConfig: Record<AppointmentStatus, { label: string; color: 'yellow' | 'green' | 'red' }> = {
  pendiente: { label: 'Pendiente', color: 'yellow' },
  completada: { label: 'Completada', color: 'green' },
  cancelada: { label: 'Cancelada', color: 'red' },
}

export function AppointmentList({ dogId, appointments, isEditor, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Appointment | undefined>()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [loadingDelete, setLoadingDelete] = useState(false)

  const upcoming = appointments.filter(
    (a) => a.status === 'pendiente' && !isPast(a.date)
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const past = appointments.filter(
    (a) => a.status !== 'pendiente' || isPast(a.date)
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  async function handleDelete(id: string) {
    setLoadingDelete(true)
    try {
      await supabase.from('appointments').delete().eq('id', id)
      onRefresh()
    } finally {
      setLoadingDelete(false)
      setDeleting(null)
    }
  }

  function AppCard({ a }: { a: Appointment }) {
    const sc = statusConfig[a.status]
    const soonAlert = a.status === 'pendiente' && isWithinDays(a.date, 7)

    return (
      <div className={`bg-white rounded-xl border p-4 print-section ${soonAlert ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-medium text-gray-800">{a.title}</span>
              <Badge label={sc.label} color={sc.color} />
              {soonAlert && <Badge label="Esta semana" color="blue" />}
            </div>
            <p className="text-sm text-gray-600">
              📅 {formatDate(a.date)}{a.time ? ` a las ${formatTime(a.time)}` : ''}
            </p>
            {(a.veterinarian || a.clinic) && (
              <p className="text-xs text-gray-400 mt-1">
                {a.veterinarian && `Dr. ${a.veterinarian}`}
                {a.veterinarian && a.clinic && ' · '}
                {a.clinic}
              </p>
            )}
            {a.address && <p className="text-xs text-gray-400">📍 {a.address}</p>}
            {a.notes && <p className="text-xs text-gray-400 mt-1 italic">{a.notes}</p>}
          </div>
          {isEditor && (
            <div className="flex gap-1 flex-shrink-0 no-print">
              <button
                onClick={() => { setEditing(a); setShowForm(true) }}
                className="p-1.5 text-gray-400 hover:text-terra-500 hover:bg-terra-50 rounded-lg transition"
              >
                ✏️
              </button>
              <button
                onClick={() => setDeleting(a.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {isEditor && (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => { setEditing(undefined); setShowForm(true) }} size="sm">
            + Agendar cita
          </Button>
        </div>
      )}

      {/* Upcoming */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Próximas ({upcoming.length})
        </h4>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin citas pendientes</p>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((a) => <AppCard key={a.id} a={a} />)}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Pasadas ({past.length})
          </h4>
          <div className="flex flex-col gap-3">
            {past.map((a) => <AppCard key={a.id} a={a} />)}
          </div>
        </div>
      )}

      {showForm && (
        <AppointmentForm
          dogId={dogId}
          appointment={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); onRefresh() }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          message="¿Eliminar esta cita?"
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(null)}
          loading={loadingDelete}
        />
      )}
    </div>
  )
}
