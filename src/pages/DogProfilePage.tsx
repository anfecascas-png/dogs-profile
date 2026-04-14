import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Dog, Vaccination, MedicalHistory, Medication, Appointment } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { calculateAge, formatDate } from '../utils/dateUtils'
import { getDogColor } from '../constants/colors'
import { DogPhoto } from '../components/dogs/DogPhoto'
import { DogForm } from '../components/dogs/DogForm'
import { VaccinationList } from '../components/vaccinations/VaccinationList'
import { MedicalHistoryList } from '../components/medical/MedicalHistoryList'
import { MedicationList } from '../components/medications/MedicationList'
import { AppointmentList } from '../components/appointments/AppointmentList'
import { ConfirmDialog } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'

type Tab = 'perfil' | 'vacunas' | 'historial' | 'medicamentos' | 'citas'

const TABS: { id: Tab; label: string }[] = [
  { id: 'perfil', label: 'Perfil' },
  { id: 'vacunas', label: 'Vacunas' },
  { id: 'historial', label: 'Historial' },
  { id: 'medicamentos', label: 'Medicamentos' },
  { id: 'citas', label: 'Citas' },
]

export default function DogProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isEditor } = useAuth()

  const [dog, setDog] = useState<Dog | null>(null)
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [medHistory, setMedHistory] = useState<MedicalHistory[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [dogIndex, setDogIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('perfil')
  const [showEditDog, setShowEditDog] = useState(false)
  const [showDeleteDog, setShowDeleteDog] = useState(false)
  const [deletingDog, setDeletingDog] = useState(false)

  async function fetchAll() {
    if (!id) return
    setLoading(true)
    try {
      const [dogRes, allDogsRes, vacRes, histRes, medRes, appRes] = await Promise.all([
        supabase.from('dogs').select('*').eq('id', id).single(),
        supabase.from('dogs').select('id').order('created_at'),
        supabase.from('vaccinations').select('*').eq('dog_id', id).order('date_applied', { ascending: false }),
        supabase.from('medical_history').select('*').eq('dog_id', id).order('date', { ascending: false }),
        supabase.from('medications').select('*').eq('dog_id', id).order('start_date', { ascending: false }),
        supabase.from('appointments').select('*').eq('dog_id', id).order('date', { ascending: true }),
      ])

      if (!dogRes.data) { navigate('/'); return }
      setDog(dogRes.data)
      const idx = (allDogsRes.data ?? []).findIndex((d) => d.id === id)
      setDogIndex(idx >= 0 ? idx : 0)
      setVaccinations(vacRes.data ?? [])
      setMedHistory(histRes.data ?? [])
      setMedications(medRes.data ?? [])
      setAppointments(appRes.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [id])

  async function handleDeleteDog() {
    if (!dog) return
    setDeletingDog(true)
    try {
      await supabase.from('dogs').delete().eq('id', dog.id)
      navigate('/')
    } finally {
      setDeletingDog(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">🐾</div>
          <p className="text-terra-400 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!dog) return null

  const colors = getDogColor(dogIndex)

  return (
    <div className="max-w-lg mx-auto">
      {/* Hero header */}
      <div className={`${colors.bgLight} pt-6 pb-4 px-4`}>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1 no-print"
        >
          ← Inicio
        </button>

        <div className="flex items-start gap-4">
          <DogPhoto
            dog={dog}
            colorIndex={dogIndex}
            isEditor={isEditor}
            onPhotoUpdated={(url) => setDog((d) => d ? { ...d, photo_url: url } : d)}
          />
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-2xl font-bold text-gray-800">{dog.name}</h1>
            <p className="text-gray-600">{dog.breed}</p>
            <p className="text-sm text-gray-500 mt-0.5">{calculateAge(dog.birth_date)}</p>
          </div>
          {isEditor && (
            <div className="flex gap-1 no-print pt-1">
              <button
                onClick={() => setShowEditDog(true)}
                className="p-2 text-gray-500 hover:text-terra-500 hover:bg-white/60 rounded-xl transition"
                title="Editar"
              >
                ✏️
              </button>
              <button
                onClick={() => setShowDeleteDog(true)}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-white/60 rounded-xl transition"
                title="Eliminar perro"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 no-print overflow-x-auto">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? `border-terra-400 text-terra-600`
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 py-5 tab-transition">
        {activeTab === 'perfil' && (
          <ProfileTab dog={dog} isEditor={isEditor} onPrint={() => window.print()} />
        )}
        {activeTab === 'vacunas' && (
          <VaccinationList
            dogId={dog.id}
            vaccinations={vaccinations}
            isEditor={isEditor}
            onRefresh={fetchAll}
          />
        )}
        {activeTab === 'historial' && (
          <MedicalHistoryList
            dogId={dog.id}
            records={medHistory}
            isEditor={isEditor}
            onRefresh={fetchAll}
          />
        )}
        {activeTab === 'medicamentos' && (
          <MedicationList
            dogId={dog.id}
            medications={medications}
            isEditor={isEditor}
            onRefresh={fetchAll}
          />
        )}
        {activeTab === 'citas' && (
          <AppointmentList
            dogId={dog.id}
            appointments={appointments}
            isEditor={isEditor}
            onRefresh={fetchAll}
          />
        )}
      </div>

      {showEditDog && (
        <DogForm
          dog={dog}
          onClose={() => setShowEditDog(false)}
          onSaved={() => { setShowEditDog(false); fetchAll() }}
        />
      )}

      {showDeleteDog && (
        <ConfirmDialog
          message={`¿Eliminar a ${dog.name}? Se borrarán todos sus registros de vacunas, historial, medicamentos y citas. Esta acción no se puede deshacer.`}
          onConfirm={handleDeleteDog}
          onCancel={() => setShowDeleteDog(false)}
          loading={deletingDog}
        />
      )}
    </div>
  )
}

function ProfileTab({ dog, onPrint }: { dog: Dog; isEditor?: boolean; onPrint: () => void }) {
  const fields: { label: string; value: string | undefined | null }[] = [
    { label: 'Nombre', value: dog.name },
    { label: 'Raza', value: dog.breed },
    { label: 'Fecha de nacimiento', value: formatDate(dog.birth_date) },
    { label: 'Edad', value: calculateAge(dog.birth_date) },
    { label: 'Peso', value: `${dog.weight_kg} kg` },
    { label: 'Sexo', value: dog.sex.charAt(0).toUpperCase() + dog.sex.slice(1) },
    { label: 'Color / pelaje', value: dog.color },
    { label: 'Microchip', value: dog.microchip_number || 'No registrado' },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-4 print-section">
        {fields.map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-sm text-gray-800 mt-0.5 font-medium">{value}</p>
          </div>
        ))}
      </div>

      {dog.notes && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 print-section">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Notas</p>
          <p className="text-sm text-gray-700 leading-relaxed">{dog.notes}</p>
        </div>
      )}

      <div className="no-print">
        <Button variant="secondary" onClick={onPrint} size="sm" className="w-full">
          🖨️ Exportar / Imprimir perfil
        </Button>
      </div>
    </div>
  )
}
