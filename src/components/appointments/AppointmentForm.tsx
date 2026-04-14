import { useState, FormEvent } from 'react'
import type { Appointment, AppointmentStatus } from '../../types'
import { supabase } from '../../lib/supabase'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Textarea, Select } from '../ui/Input'
import { todayISO } from '../../utils/dateUtils'

interface Props {
  dogId: string
  appointment?: Appointment
  onClose: () => void
  onSaved: () => void
}

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
]

export function AppointmentForm({ dogId, appointment, onClose, onSaved }: Props) {
  const [data, setData] = useState({
    title: appointment?.title ?? '',
    date: appointment?.date ?? todayISO(),
    time: appointment?.time ?? '',
    veterinarian: appointment?.veterinarian ?? '',
    clinic: appointment?.clinic ?? '',
    address: appointment?.address ?? '',
    status: appointment?.status ?? ('pendiente' as AppointmentStatus),
    notes: appointment?.notes ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!data.title.trim()) e.title = 'El título es requerido'
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
        time: data.time || null,
        veterinarian: data.veterinarian || null,
        clinic: data.clinic || null,
        address: data.address || null,
        notes: data.notes || null,
      }
      if (appointment) {
        await supabase.from('appointments').update(payload).eq('id', appointment.id)
      } else {
        await supabase.from('appointments').insert(payload)
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
      title={appointment ? 'Editar cita' : 'Agendar cita'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={loading}>Guardar</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Título *" value={data.title} onChange={set('title')} error={errors.title} placeholder="Ej: Revisión anual" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Fecha *" type="date" value={data.date} onChange={set('date')} error={errors.date} />
          <Input label="Hora" type="time" value={data.time} onChange={set('time')} />
        </div>
        <Select label="Estado" value={data.status} onChange={set('status')} options={STATUS_OPTIONS} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Veterinario" value={data.veterinarian} onChange={set('veterinarian')} placeholder="Nombre" />
          <Input label="Clínica" value={data.clinic} onChange={set('clinic')} placeholder="Nombre" />
        </div>
        <Input label="Dirección" value={data.address} onChange={set('address')} placeholder="Dirección de la clínica" />
        <Textarea label="Notas" value={data.notes} onChange={set('notes')} placeholder="Observaciones..." />
      </form>
    </Modal>
  )
}
