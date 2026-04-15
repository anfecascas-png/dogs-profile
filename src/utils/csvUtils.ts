// ── CSV Parsing ────────────────────────────────────────────────────

/** Parse a CSV string into an array of row objects keyed by header name */
export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0]).map((h) => h.trim())

  return lines
    .slice(1)
    .map((line) => {
      const values = parseCSVLine(line)
      return headers.reduce<Record<string, string>>((obj, header, i) => {
        obj[header] = (values[i] ?? '').trim()
        return obj
      }, {})
    })
    .filter((row) => Object.values(row).some((v) => v !== ''))
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      // Handle escaped quote ""
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  values.push(current)
  return values
}

// ── Date parsing ──────────────────────────────────────────────────

/**
 * Accept ISO (YYYY-MM-DD) or Latin American (DD/MM/YYYY) date formats.
 * Returns ISO string or null if invalid.
 */
export function parseFlexibleDate(s: string): string | null {
  if (!s) return null

  // ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return isValidDate(s) ? s : null
  }

  // DD/MM/YYYY or D/M/YYYY
  const match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (match) {
    const iso = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
    return isValidDate(iso) ? iso : null
  }

  return null
}

function isValidDate(iso: string): boolean {
  const d = new Date(iso)
  return !isNaN(d.getTime())
}

// ── Template download ─────────────────────────────────────────────

export function downloadCSVTemplate(filename: string, headers: string[], exampleRows: string[][]): void {
  const lines = [
    headers.join(','),
    ...exampleRows.map((row) =>
      row.map((cell) => (cell.includes(',') || cell.includes('"') ? `"${cell.replace(/"/g, '""')}"` : cell)).join(',')
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Google Drive helpers ──────────────────────────────────────────

export function isGoogleDriveLink(url: string): boolean {
  return /drive\.google\.com|docs\.google\.com/.test(url)
}

export function getDriveLinkLabel(url: string): string {
  // Extract file name from URL if possible, otherwise show generic label
  const match = url.match(/\/d\/([^/]+)/)
  if (match) return `Google Drive (${match[1].slice(0, 8)}…)`
  if (url.includes('docs.google.com/document')) return 'Google Docs'
  if (url.includes('docs.google.com/spreadsheets')) return 'Google Sheets'
  if (url.includes('docs.google.com/presentation')) return 'Google Slides'
  return 'Documento externo'
}

// ── CSV template definitions ──────────────────────────────────────

export const CSV_TEMPLATES = {
  vacunas: {
    filename: 'plantilla_vacunas.csv',
    headers: ['vaccine_name', 'date_applied', 'next_due_date', 'veterinarian', 'notes'],
    example: [
      ['Antirrábica', '2024-01-15', '2025-01-15', 'Dr. García', 'Sin reacciones'],
      ['Sextuple', '2024-03-10', '2025-03-10', 'Dr. García', ''],
    ],
    requiredFields: ['vaccine_name', 'date_applied'] as string[],
  },
  historial: {
    filename: 'plantilla_historial_medico.csv',
    headers: ['event_type', 'title', 'description', 'date', 'veterinarian', 'clinic'],
    example: [
      ['consulta', 'Revisión anual', 'Control de rutina, todo normal', '2024-06-15', 'Dr. García', 'VetSalud'],
      ['enfermedad', 'Gastroenteritis', 'Vómitos y diarrea por 2 días', '2024-02-10', 'Dra. López', ''],
    ],
    requiredFields: ['title', 'description', 'date'] as string[],
  },
  medicamentos: {
    filename: 'plantilla_medicamentos.csv',
    headers: ['name', 'dose', 'frequency', 'start_date', 'end_date', 'is_active', 'reason', 'notes'],
    example: [
      ['Frontline', '1 pipeta', 'Mensual', '2024-01-01', '', 'true', 'Antipulgas', 'Aplicar en el lomo'],
      ['Drontal', '1 tableta', 'Cada 3 meses', '2024-01-01', '2024-12-31', 'false', 'Desparasitación', ''],
    ],
    requiredFields: ['name', 'dose', 'frequency', 'start_date'] as string[],
  },
  citas: {
    filename: 'plantilla_citas.csv',
    headers: ['title', 'date', 'time', 'veterinarian', 'clinic', 'address', 'status', 'notes'],
    example: [
      ['Vacunación anual', '2025-03-15', '10:00', 'Dr. García', 'VetSalud', 'Calle 123 #45', 'completada', ''],
      ['Control de peso', '2025-04-20', '09:30', 'Dra. López', 'ClínicaMed', '', 'pendiente', ''],
    ],
    requiredFields: ['title', 'date'] as string[],
  },
} as const

export type ImportType = keyof typeof CSV_TEMPLATES
