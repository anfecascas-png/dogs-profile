import { useState } from 'react'
import type { MedicalHistory, MedicalEventType } from '../../types'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../utils/dateUtils'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/Modal'
import { MedicalHistoryForm } from './MedicalHistoryForm'

interface Props {
  dogId: string
  records: MedicalHistory[]
  isEditor: boolean
  onRefresh: () => void
}

const eventConfig: Record<MedicalEventType, { icon: string; color: 'terra' | 'red' | 'sage' | 'gray' }> = {
  consulta: { icon: '🩺', color: 'sage' },
  enfermedad: { icon: '🤒', color: 'red' },
  cirugía: { icon: '🔬', color: 'terra' },
  otro: { icon: '📋', color: 'gray' },
}

export function MedicalHistoryList({ dogId, records, isEditor, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MedicalHistory | undefined>()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [loadingDelete, setLoadingDelete] = useState(false)

  const sorted = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  async function handleDelete(id: string) {
    setLoadingDelete(true)
    try {
      await supabase.from('medical_history').delete().eq('id', id)
      onRefresh()
    } finally {
      setLoadingDelete(false)
      setDeleting(null)
    }
  }

  return (
    <div>
      {isEditor && (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => { setEditing(undefined); setShowForm(true) }} size="sm">
            + Agregar evento
          </Button>
        </div>
      )}

      {records.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📋</div>
          <p>Sin historial médico registrado</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100" />

          <div className="flex flex-col gap-4">
            {sorted.map((r) => {
              const ec = eventConfig[r.event_type]
              return (
                <div key={r.id} className="relative pl-12 print-section">
                  {/* Timeline dot */}
                  <div className="absolute left-3 top-3 w-5 h-5 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-xs">
                    {ec.icon}
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-gray-800">{r.title}</span>
                          <Badge label={r.event_type} color={ec.color} />
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{formatDate(r.date)}</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{r.description}</p>
                        {(r.veterinarian || r.clinic) && (
                          <p className="text-xs text-gray-400 mt-2">
                            {r.veterinarian && `Dr. ${r.veterinarian}`}
                            {r.veterinarian && r.clinic && ' · '}
                            {r.clinic}
                          </p>
                        )}
                      </div>
                      {isEditor && (
                        <div className="flex gap-1 flex-shrink-0 no-print">
                          <button
                            onClick={() => { setEditing(r); setShowForm(true) }}
                            className="p-1.5 text-gray-400 hover:text-terra-500 hover:bg-terra-50 rounded-lg transition"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeleting(r.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showForm && (
        <MedicalHistoryForm
          dogId={dogId}
          record={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); onRefresh() }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          message="¿Eliminar este evento del historial médico?"
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(null)}
          loading={loadingDelete}
        />
      )}
    </div>
  )
}
