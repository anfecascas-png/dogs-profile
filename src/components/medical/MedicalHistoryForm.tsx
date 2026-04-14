import { useState, FormEvent } from 'react'
import type { MedicalHistory, MedicalEventType } from '../../types'
import { supabase } from '../../lib/supabase'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Textarea, Select } from '../ui/Input'
import { todayISO } from '../../utils/dateUtils'

interface Props {
  dogId: string
  record?: MedicalHistory
  onClose: () => void
  onSaved: () => void
}

const EVENT_TYPES: { value: MedicalEventType; label: string }[] = [
  { value: 'consulta', label: 'Consulta' },
  { value: 'enfermedad', label: 'Enfermedad' },
  { value: 'cirugía', label: 'Cirugía' },
  { value: 'otro', label: 'Otro' },
]

export function MedicalHistoryForm({ dogId, record, onClose, onSaved }: Props) {
  const [data, setData] = useState({
    event_type: record?.event_type ?? ('consulta' as MedicalEventType),
    title: record?.title ?? '',
    description: record?.description ?? '',
    date: record?.date ?? todayISO(),
    veterinarian: record?.veterinarian ?? '',
    clinic: record?.clinic ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!data.title.trim()) e.title = 'El título es requerido'
    if (!data.description.trim()) e.description = 'La descripción es requerida'
    if (!data.date) e.date = 'La fecha es requerida'
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
        veterinarian: data.veterinarian || null,
        clinic: data.clinic || null,
      }
      if (record) {
        await supabase.from('medical_history').update(payload).eq('id', record.id)
      } else {
        await supabase.from('medical_history').insert(payload)
      }
      onSaved()
    } finally {
      setLoading(false)
    }
  }

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setData((d) => ({ ...d, [f]: e.target.value }))

  return (
    <Modal
      title={record ? 'Editar evento médico' : 'Registrar evento médico'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={loading}>Guardar</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Select label="Tipo de evento *" value={data.event_type} onChange={set('event_type')} options={EVENT_TYPES} />
          <Input label="Fecha *" type="date" value={data.date} onChange={set('date')} error={errors.date} />
        </div>
        <Input label="Título *" value={data.title} onChange={set('title')} error={errors.title} placeholder="Ej: Consulta de rutina" />
        <Textarea label="Descripción *" value={data.description} onChange={set('description')} error={errors.description} placeholder="Describe el evento..." />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Veterinario" value={data.veterinarian} onChange={set('veterinarian')} placeholder="Nombre" />
          <Input label="Clínica" value={data.clinic} onChange={set('clinic')} placeholder="Nombre de la clínica" />
        </div>
      </form>
    </Modal>
  )
}
