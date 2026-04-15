import { useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  parseCSV,
  parseFlexibleDate,
  downloadCSVTemplate,
  CSV_TEMPLATES,
  type ImportType,
} from '../../utils/csvUtils'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface Props {
  dogId: string
  dogName: string
  onClose: () => void
  onImported: () => void
}

interface ImportResult {
  success: number
  errors: string[]
}

const TAB_LABELS: Record<ImportType, string> = {
  vacunas: '💉 Vacunas',
  historial: '📋 Historial',
  medicamentos: '💊 Medicamentos',
  citas: '📅 Citas',
}

const EVENT_TYPES = ['consulta', 'enfermedad', 'cirugía', 'otro']
const APPOINTMENT_STATUSES = ['pendiente', 'completada', 'cancelada']

export function ImportModal({ dogId, dogName, onClose, onImported }: Props) {
  const [activeTab, setActiveTab] = useState<ImportType>('vacunas')
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const template = CSV_TEMPLATES[activeTab]

  function handleTabChange(tab: ImportType) {
    setActiveTab(tab)
    setRows([])
    setFileName('')
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text)
      setRows(parsed)
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function handleImport() {
    if (rows.length === 0) return
    setImporting(true)
    const errors: string[] = []
    let success = 0

    try {
      if (activeTab === 'vacunas') {
        const records = rows
          .map((row, i) => {
            const date = parseFlexibleDate(row.date_applied)
            if (!row.vaccine_name) { errors.push(`Fila ${i + 2}: falta vaccine_name`); return null }
            if (!date) { errors.push(`Fila ${i + 2}: fecha inválida "${row.date_applied}"`); return null }
            return {
              dog_id: dogId,
              vaccine_name: row.vaccine_name,
              date_applied: date,
              next_due_date: parseFlexibleDate(row.next_due_date) ?? null,
              veterinarian: row.veterinarian || null,
              notes: row.notes || null,
            }
          })
          .filter(Boolean)

        if (records.length > 0) {
          const { error } = await supabase.from('vaccinations').insert(records)
          if (error) errors.push(`Error de base de datos: ${error.message}`)
          else success = records.length
        }
      }

      if (activeTab === 'historial') {
        const records = rows
          .map((row, i) => {
            const date = parseFlexibleDate(row.date)
            if (!row.title) { errors.push(`Fila ${i + 2}: falta title`); return null }
            if (!row.description) { errors.push(`Fila ${i + 2}: falta description`); return null }
            if (!date) { errors.push(`Fila ${i + 2}: fecha inválida "${row.date}"`); return null }
            const eventType = EVENT_TYPES.includes(row.event_type) ? row.event_type : 'consulta'
            return {
              dog_id: dogId,
              event_type: eventType,
              title: row.title,
              description: row.description,
              date,
              veterinarian: row.veterinarian || null,
              clinic: row.clinic || null,
              attachments_urls: null,
            }
          })
          .filter(Boolean)

        if (records.length > 0) {
          const { error } = await supabase.from('medical_history').insert(records)
          if (error) errors.push(`Error de base de datos: ${error.message}`)
          else success = records.length
        }
      }

      if (activeTab === 'medicamentos') {
        const records = rows
          .map((row, i) => {
            const startDate = parseFlexibleDate(row.start_date)
            if (!row.name) { errors.push(`Fila ${i + 2}: falta name`); return null }
            if (!row.dose) { errors.push(`Fila ${i + 2}: falta dose`); return null }
            if (!row.frequency) { errors.push(`Fila ${i + 2}: falta frequency`); return null }
            if (!startDate) { errors.push(`Fila ${i + 2}: start_date inválida "${row.start_date}"`); return null }
            const isActive = row.is_active?.toLowerCase() !== 'false' && row.is_active !== '0'
            return {
              dog_id: dogId,
              name: row.name,
              dose: row.dose,
              frequency: row.frequency,
              start_date: startDate,
              end_date: parseFlexibleDate(row.end_date) ?? null,
              is_active: isActive,
              reason: row.reason || null,
              notes: row.notes || null,
            }
          })
          .filter(Boolean)

        if (records.length > 0) {
          const { error } = await supabase.from('medications').insert(records)
          if (error) errors.push(`Error de base de datos: ${error.message}`)
          else success = records.length
        }
      }

      if (activeTab === 'citas') {
        const records = rows
          .map((row, i) => {
            const date = parseFlexibleDate(row.date)
            if (!row.title) { errors.push(`Fila ${i + 2}: falta title`); return null }
            if (!date) { errors.push(`Fila ${i + 2}: fecha inválida "${row.date}"`); return null }
            const status = APPOINTMENT_STATUSES.includes(row.status) ? row.status : 'pendiente'
            return {
              dog_id: dogId,
              title: row.title,
              date,
              time: row.time || null,
              veterinarian: row.veterinarian || null,
              clinic: row.clinic || null,
              address: row.address || null,
              status,
              notes: row.notes || null,
            }
          })
          .filter(Boolean)

        if (records.length > 0) {
          const { error } = await supabase.from('appointments').insert(records)
          if (error) errors.push(`Error de base de datos: ${error.message}`)
          else success = records.length
        }
      }

      setResult({ success, errors })
      if (success > 0) onImported()
    } finally {
      setImporting(false)
    }
  }

  const previewHeaders = template.headers.slice(0, 4)

  return (
    <Modal
      title={`Importar datos — ${dogName}`}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
          <p className="font-medium mb-1">¿Cómo usar el importador?</p>
          <ol className="list-decimal list-inside space-y-0.5 text-xs">
            <li>Descarga la plantilla de la pestaña que necesitas</li>
            <li>Ábrela en Google Sheets (File → Import) o Excel</li>
            <li>Llena los datos de tu perro (una fila por registro)</li>
            <li>Exporta como CSV y súbela aquí</li>
          </ol>
        </div>

        {/* Tab bar */}
        <div className="flex overflow-x-auto gap-1 border-b border-gray-100 pb-1">
          {(Object.keys(CSV_TEMPLATES) as ImportType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={[
                'flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab
                  ? 'bg-terra-100 text-terra-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
              ].join(' ')}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Template download */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Plantilla CSV</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Columnas requeridas: {template.requiredFields.join(', ')}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadCSVTemplate(template.filename, [...template.headers], template.example.map((r) => [...r]))}
          >
            ⬇️ Descargar
          </Button>
        </div>

        {/* File upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subir CSV
          </label>
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-terra-300 hover:bg-terra-50/30 transition"
            onClick={() => fileInputRef.current?.click()}
          >
            {fileName ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">📄</span>
                <span className="text-sm font-medium text-gray-700">{fileName}</span>
                <span className="text-xs text-gray-400">({rows.length} filas)</span>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500">Toca para seleccionar el archivo CSV</p>
                <p className="text-xs text-gray-400 mt-1">Exportado desde Google Sheets o Excel</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Preview */}
        {rows.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Vista previa ({rows.length} {rows.length === 1 ? 'registro' : 'registros'})
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {previewHeaders.map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      {previewHeaders.map((h) => (
                        <td key={h} className="px-3 py-2 text-gray-600 max-w-[120px] truncate">
                          {row[h] || <span className="text-gray-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {rows.length > 5 && (
                    <tr className="border-t border-gray-50">
                      <td colSpan={previewHeaders.length} className="px-3 py-2 text-gray-400 text-center">
                        … y {rows.length - 5} más
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`rounded-xl p-3 text-sm ${result.success > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {result.success > 0 && (
              <p className="font-medium text-green-700">
                ✅ {result.success} {result.success === 1 ? 'registro importado' : 'registros importados'} correctamente
              </p>
            )}
            {result.errors.length > 0 && (
              <div className={result.success > 0 ? 'mt-2' : ''}>
                <p className="font-medium text-red-600 mb-1">Errores ({result.errors.length}):</p>
                <ul className="text-xs text-red-500 space-y-0.5">
                  {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 justify-end pt-1">
          <Button variant="secondary" onClick={onClose}>
            {result?.success ? 'Cerrar' : 'Cancelar'}
          </Button>
          {rows.length > 0 && !result?.success && (
            <Button onClick={handleImport} loading={importing}>
              Importar {rows.length} {rows.length === 1 ? 'registro' : 'registros'}
            </Button>
          )}
          {result?.success && rows.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => {
                setRows([])
                setFileName('')
                setResult(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
            >
              Importar más
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
