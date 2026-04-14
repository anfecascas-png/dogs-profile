import { useState } from 'react'
import type { Vaccination } from '../../types'
import { supabase } from '../../lib/supabase'
import { getVaccinationStatus } from '../../utils/dateUtils'
import { formatDate } from '../../utils/dateUtils'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/Modal'
import { VaccinationForm } from './VaccinationForm'

interface Props {
  dogId: string
  vaccinations: Vaccination[]
  isEditor: boolean
  onRefresh: () => void
}

const statusConfig = {
  al_dia: { label: 'Al día', color: 'green' as const },
  por_vencer: { label: 'Por vencer', color: 'yellow' as const },
  vencida: { label: 'Vencida', color: 'red' as const },
  sin_fecha: { label: 'Sin próxima dosis', color: 'gray' as const },
}

export function VaccinationList({ dogId, vaccinations, isEditor, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Vaccination | undefined>()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [loadingDelete, setLoadingDelete] = useState(false)

  const sorted = [...vaccinations].sort(
    (a, b) => new Date(b.date_applied).getTime() - new Date(a.date_applied).getTime()
  )

  async function handleDelete(id: string) {
    setLoadingDelete(true)
    try {
      await supabase.from('vaccinations').delete().eq('id', id)
      onRefresh()
    } finally {
      setLoadingDelete(false)
      setDeleting(null)
    }
  }

  if (vaccinations.length === 0 && !isEditor) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-2">💉</div>
        <p>No hay vacunas registradas</p>
      </div>
    )
  }

  return (
    <div>
      {isEditor && (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => { setEditing(undefined); setShowForm(true) }} size="sm">
            + Agregar vacuna
          </Button>
        </div>
      )}

      {vaccinations.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">💉</div>
          <p>Sin vacunas registradas aún</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((v) => {
            const status = getVaccinationStatus(v.next_due_date)
            const sc = statusConfig[status]
            return (
              <div key={v.id} className="bg-white rounded-xl border border-gray-100 p-4 print-section">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-800">{v.vaccine_name}</span>
                      <Badge label={sc.label} color={sc.color} />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Aplicada: {formatDate(v.date_applied)}</p>
                    {v.next_due_date && (
                      <p className="text-sm text-gray-500">Próxima: {formatDate(v.next_due_date)}</p>
                    )}
                    {v.veterinarian && (
                      <p className="text-xs text-gray-400 mt-1">Dr. {v.veterinarian}</p>
                    )}
                    {v.notes && <p className="text-xs text-gray-400 mt-1 italic">{v.notes}</p>}
                  </div>
                  {isEditor && (
                    <div className="flex gap-1 flex-shrink-0 no-print">
                      <button
                        onClick={() => { setEditing(v); setShowForm(true) }}
                        className="p-1.5 text-gray-400 hover:text-terra-500 hover:bg-terra-50 rounded-lg transition"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setDeleting(v.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <VaccinationForm
          dogId={dogId}
          vaccination={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); onRefresh() }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          message="¿Eliminar este registro de vacuna? Esta acción no se puede deshacer."
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(null)}
          loading={loadingDelete}
        />
      )}
    </div>
  )
}
