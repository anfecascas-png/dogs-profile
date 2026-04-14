import { useState } from 'react'
import type { Medication } from '../../types'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../utils/dateUtils'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/Modal'
import { MedicationForm } from './MedicationForm'

interface Props {
  dogId: string
  medications: Medication[]
  isEditor: boolean
  onRefresh: () => void
}

export function MedicationList({ dogId, medications, isEditor, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Medication | undefined>()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const active = medications.filter((m) => m.is_active)
  const history = medications.filter((m) => !m.is_active)

  async function handleDelete(id: string) {
    setLoadingDelete(true)
    try {
      await supabase.from('medications').delete().eq('id', id)
      onRefresh()
    } finally {
      setLoadingDelete(false)
      setDeleting(null)
    }
  }

  function MedCard({ m }: { m: Medication }) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 print-section">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-medium text-gray-800">💊 {m.name}</span>
              {m.is_active ? (
                <Badge label="Activo" color="green" />
              ) : (
                <Badge label="Histórico" color="gray" />
              )}
            </div>
            <p className="text-sm text-gray-600">{m.dose} · {m.frequency}</p>
            <p className="text-xs text-gray-400 mt-1">
              Desde {formatDate(m.start_date)}
              {m.end_date ? ` hasta ${formatDate(m.end_date)}` : ' (indefinido)'}
            </p>
            {m.reason && <p className="text-xs text-gray-500 mt-1">Motivo: {m.reason}</p>}
            {m.notes && <p className="text-xs text-gray-400 mt-1 italic">{m.notes}</p>}
          </div>
          {isEditor && (
            <div className="flex gap-1 flex-shrink-0 no-print">
              <button
                onClick={() => { setEditing(m); setShowForm(true) }}
                className="p-1.5 text-gray-400 hover:text-terra-500 hover:bg-terra-50 rounded-lg transition"
              >
                ✏️
              </button>
              <button
                onClick={() => setDeleting(m.id)}
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
            + Agregar medicamento
          </Button>
        </div>
      )}

      {/* Active */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Activos ({active.length})
        </h4>
        {active.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Sin medicamentos activos</p>
        ) : (
          <div className="flex flex-col gap-3">
            {active.map((m) => <MedCard key={m.id} m={m} />)}
          </div>
        )}
      </div>

      {/* History toggle */}
      {history.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 hover:text-gray-700 transition"
          >
            <span>Historial ({history.length})</span>
            <span className="text-xs">{showHistory ? '▲' : '▼'}</span>
          </button>
          {showHistory && (
            <div className="flex flex-col gap-3">
              {history.map((m) => <MedCard key={m.id} m={m} />)}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <MedicationForm
          dogId={dogId}
          medication={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); onRefresh() }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          message="¿Eliminar este medicamento del registro?"
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(null)}
          loading={loadingDelete}
        />
      )}
    </div>
  )
}
