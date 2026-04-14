import { useState, FormEvent } from 'react'
import type { Vaccination } from '../../types'
import { supabase } from '../../lib/supabase'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Textarea } from '../ui/Input'
import { todayISO } from '../../utils/dateUtils'

interface Props {
  dogId: string
  vaccination?: Vaccination
  onClose: () => void
  onSaved: () => void
}

export function VaccinationForm({ dogId, vaccination, onClose, onSaved }: Props) {
  const [data, setData] = useState({
    vaccine_name: vaccination?.vaccine_name ?? '',
    date_applied: vaccination?.date_applied ?? todayISO(),
    next_due_date: vaccination?.next_due_date ?? '',
    veterinarian: vaccination?.veterinarian ?? '',
    notes: vaccination?.notes ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!data.vaccine_name.trim()) e.vaccine_name = 'El nombre de la vacuna es requerido'
    if (!data.date_applied) e.date_applied = 'La fecha de aplicación es requerida'
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
        next_due_date: data.next_due_date || null,
        veterinarian: data.veterinarian || null,
        notes: data.notes || null,
      }
      if (vaccination) {
        await supabase.from('vaccinations').update(payload).eq('id', vaccination.id)
      } else {
        await supabase.from('vaccinations').insert(payload)
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
      title={vaccination ? 'Editar vacuna' : 'Registrar vacuna'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={loading}>Guardar</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre de la vacuna *"
          value={data.vaccine_name}
          onChange={set('vaccine_name')}
          error={errors.vaccine_name}
          placeholder="Ej: Antirrábica"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Fecha de aplicación *" type="date" value={data.date_applied} onChange={set('date_applied')} error={errors.date_applied} />
          <Input label="Próxima dosis" type="date" value={data.next_due_date} onChange={set('next_due_date')} />
        </div>
        <Input label="Veterinario" value={data.veterinarian} onChange={set('veterinarian')} placeholder="Nombre del veterinario" />
        <Textarea label="Notas" value={data.notes} onChange={set('notes')} placeholder="Observaciones..." />
      </form>
    </Modal>
  )
}
