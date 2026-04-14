import { useState, FormEvent } from 'react'
import type { Medication } from '../../types'
import { supabase } from '../../lib/supabase'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Textarea } from '../ui/Input'
import { todayISO } from '../../utils/dateUtils'

interface Props {
  dogId: string
  medication?: Medication
  onClose: () => void
  onSaved: () => void
}

export function MedicationForm({ dogId, medication, onClose, onSaved }: Props) {
  const [data, setData] = useState({
    name: medication?.name ?? '',
    dose: medication?.dose ?? '',
    frequency: medication?.frequency ?? '',
    start_date: medication?.start_date ?? todayISO(),
    end_date: medication?.end_date ?? '',
    is_active: medication?.is_active ?? true,
    reason: medication?.reason ?? '',
    notes: medication?.notes ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!data.name.trim()) e.name = 'El nombre es requerido'
    if (!data.dose.trim()) e.dose = 'La dosis es requerida'
    if (!data.frequency.trim()) e.frequency = 'La frecuencia es requerida'
    if (!data.start_date) e.start_date = 'La fecha de inicio es requerida'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const payload = {
        ...data,
        dog_id: dogId,
        end_date: data.end_date || null,
        reason: data.reason || null,
        notes: data.notes || null,
      }
      if (medication) {
        await supabase.from('medications').update(payload).eq('id', medication.id)
      } else {
        await supabase.from('medications').insert(payload)
      }
      onSaved()
    } finally {
      setLoading(false)
    }
  }

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setData((d) => ({ ...d, [f]: e.target.value }))

  return (
    <Modal
      title={medication ? 'Editar medicamento' : 'Agregar medicamento'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={loading}>Guardar</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Medicamento *" value={data.name} onChange={set('name')} error={errors.name} placeholder="Ej: Frontline" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Dosis *" value={data.dose} onChange={set('dose')} error={errors.dose} placeholder="Ej: 1 tableta" />
          <Input label="Frecuencia *" value={data.frequency} onChange={set('frequency')} error={errors.frequency} placeholder="Ej: Cada 24 hs" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Inicio *" type="date" value={data.start_date} onChange={set('start_date')} error={errors.start_date} />
          <Input label="Fin (vacío = indefinido)" type="date" value={data.end_date} onChange={set('end_date')} />
        </div>
        <Input label="Motivo" value={data.reason} onChange={set('reason')} placeholder="Diagnóstico o motivo" />
        <Textarea label="Notas" value={data.notes} onChange={set('notes')} placeholder="Instrucciones adicionales..." />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.is_active}
            onChange={(e) => setData((d) => ({ ...d, is_active: e.target.checked }))}
            className="w-4 h-4 rounded accent-terra-400"
          />
          <span className="text-sm font-medium text-gray-700">Tratamiento activo</span>
        </label>
      </form>
    </Modal>
  )
}
