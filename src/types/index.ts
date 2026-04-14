export interface Profile {
  id: string
  role: 'EDITOR' | 'VIEWER'
  created_at: string
}

export interface Dog {
  id: string
  name: string
  breed: string
  birth_date: string
  weight_kg: number
  sex: 'macho' | 'hembra'
  color: string
  microchip_number?: string | null
  photo_url?: string | null
  notes?: string | null
  created_at: string
}

export interface Vaccination {
  id: string
  dog_id: string
  vaccine_name: string
  date_applied: string
  next_due_date?: string | null
  veterinarian?: string | null
  notes?: string | null
  created_at?: string
}

export type MedicalEventType = 'enfermedad' | 'cirugía' | 'consulta' | 'otro'

export interface MedicalHistory {
  id: string
  dog_id: string
  event_type: MedicalEventType
  title: string
  description: string
  date: string
  veterinarian?: string | null
  clinic?: string | null
  attachments_urls?: string[] | null
  created_at?: string
}

export interface Medication {
  id: string
  dog_id: string
  name: string
  dose: string
  frequency: string
  start_date: string
  end_date?: string | null
  is_active: boolean
  reason?: string | null
  notes?: string | null
  created_at?: string
}

export type AppointmentStatus = 'pendiente' | 'completada' | 'cancelada'

export interface Appointment {
  id: string
  dog_id: string
  title: string
  date: string
  time?: string | null
  veterinarian?: string | null
  clinic?: string | null
  address?: string | null
  status: AppointmentStatus
  notes?: string | null
  created_at?: string
}
