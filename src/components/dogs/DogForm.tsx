import { useState, FormEvent } from 'react'
import type { Dog } from '../../types'
import { supabase } from '../../lib/supabase'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Textarea, Select } from '../ui/Input'
import { todayISO } from '../../utils/dateUtils'

interface Props {
  dog?: Dog
  onClose: () => void
  onSaved: () => void
}

type FormData = Omit<Dog, 'id' | 'created_at' | 'photo_url'>

export function DogForm({ dog, onClose, onSaved }: Props) {
  const [data, setData] = useState<FormData>({
    name: dog?.name ?? '',
    breed: dog?.breed ?? '',
    birth_date: dog?.birth_date ?? todayISO(),
    weight_kg: dog?.weight_kg ?? 0,
    sex: dog?.sex ?? 'macho',
    color: dog?.color ?? '',
    microchip_number: dog?.microchip_number ?? '',
    notes: dog?.notes ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [loading, setLoading] = useState(false)

  function validate(): boolean {
    const e: typeof errors = {}
    if (!data.name.trim()) e.name = 'El nombre es requerido'
    if (!data.breed.trim()) e.breed = 'La raza es requerida'
    if (!data.birth_date) e.birth_date = 'La fecha de nacimiento es requerida'
    if (!data.weight_kg || data.weight_kg <= 0) e.weight_kg = 'El peso debe ser mayor a 0'
    if (!data.color.trim()) e.color = 'El color es requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (dog) {
        await supabase.from('dogs').update(data).eq('id', dog.id)
      } else {
        await supabase.from('dogs').insert(data)
      }
      onSaved()
    } finally {
      setLoading(false)
    }
  }

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setData((d) => ({ ...d, [field]: e.target.value }))
  }

  return (
    <Modal
      title={dog ? `Editar a ${dog.name}` : 'Agregar perro'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={loading}>
            {dog ? 'Guardar cambios' : 'Agregar'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Nombre *" value={data.name} onChange={set('name')} error={errors.name} placeholder="Ej: Luna" />
        <Input label="Raza *" value={data.breed} onChange={set('breed')} error={errors.breed} placeholder="Ej: Labrador" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Fecha de nacimiento *" type="date" value={data.birth_date} onChange={set('birth_date')} error={errors.birth_date} />
          <Input
            label="Peso (kg) *"
            type="number"
            step="0.1"
            min="0"
            value={data.weight_kg}
            onChange={(e) => setData((d) => ({ ...d, weight_kg: parseFloat(e.target.value) || 0 }))}
            error={errors.weight_kg}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Sexo *"
            value={data.sex}
            onChange={set('sex')}
            options={[
              { value: 'macho', label: 'Macho' },
              { value: 'hembra', label: 'Hembra' },
            ]}
          />
          <Input label="Color / pelaje *" value={data.color} onChange={set('color')} error={errors.color} placeholder="Ej: dorado" />
        </div>
        <Input
          label="Número de microchip"
          value={data.microchip_number ?? ''}
          onChange={set('microchip_number')}
          placeholder="Opcional"
        />
        <Textarea label="Notas generales" value={data.notes ?? ''} onChange={set('notes')} placeholder="Notas adicionales..." />
      </form>
    </Modal>
  )
}
