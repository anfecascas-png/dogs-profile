import { useState, FormEvent } from 'react'
import type { MedicalHistory, MedicalEventType } from '../../types'
import { supabase } from '../../lib/supabase'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Textarea, Select } from '../ui/Input'
import { todayISO } from '../../utils/dateUtils'
import { isGoogleDriveLink, getDriveLinkLabel } from '../../utils/csvUtils'

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
  const [links, setLinks] = useState<string[]>(record?.attachments_urls ?? [])
  const [linkInput, setLinkInput] = useState('')
  const [linkError, setLinkError] = useState('')
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

  function addLink() {
    const url = linkInput.trim()
    if (!url) return
    try {
      new URL(url)
    } catch {
      setLinkError('URL inválida. Pega el link completo (https://...)')
      return
    }
    setLinks((prev) => [...prev, url])
    setLinkInput('')
    setLinkError('')
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index))
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
        attachments_urls: links.length > 0 ? links : null,
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
        <Input label="Título *" value={data.title} onChange={set('title')} error={errors.title} placeholder="Ej: Hemograma completo" />
        <Textarea label="Descripción *" value={data.description} onChange={set('description')} error={errors.description} placeholder="Resultados, observaciones del veterinario..." />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Veterinario" value={data.veterinarian} onChange={set('veterinarian')} placeholder="Nombre" />
          <Input label="Clínica" value={data.clinic} onChange={set('clinic')} placeholder="Nombre de la clínica" />
        </div>

        {/* Google Drive / external links */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Documentos adjuntos
            <span className="text-xs font-normal text-gray-400 ml-1">(links de Google Drive u otros)</span>
          </p>

          {/* Existing links */}
          {links.length > 0 && (
            <div className="flex flex-col gap-1.5 mb-2">
              {links.map((url, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-base">{isGoogleDriveLink(url) ? '📂' : '🔗'}</span>
                  <span className="text-xs text-gray-600 flex-1 truncate">
                    {isGoogleDriveLink(url) ? getDriveLinkLabel(url) : url}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLink(i)}
                    className="text-gray-400 hover:text-red-500 transition text-sm flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add link input */}
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="url"
                value={linkInput}
                onChange={(e) => { setLinkInput(e.target.value); setLinkError('') }}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                placeholder="https://drive.google.com/file/..."
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terra-300 transition"
              />
              {linkError && <p className="text-xs text-red-500 mt-1">{linkError}</p>}
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addLink} className="flex-shrink-0">
              + Agregar
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Comparte el archivo en Google Drive con "Cualquier persona con el enlace" antes de pegarlo aquí.
          </p>
        </div>
      </form>
    </Modal>
  )
}
