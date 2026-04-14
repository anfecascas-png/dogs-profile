import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Dog, Vaccination, Appointment, Medication } from '../types'
import { DogCard } from '../components/dogs/DogCard'
import { DogForm } from '../components/dogs/DogForm'
import { Button } from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'

interface DogData {
  dog: Dog
  vaccinations: Vaccination[]
  appointments: Appointment[]
  medications: Medication[]
}

export default function HomePage() {
  const { isEditor } = useAuth()
  const [dogsData, setDogsData] = useState<DogData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function fetchData() {
    setLoading(true)
    try {
      const [dogsRes, vacRes, appRes, medRes] = await Promise.all([
        supabase.from('dogs').select('*').order('created_at'),
        supabase.from('vaccinations').select('*'),
        supabase.from('appointments').select('*'),
        supabase.from('medications').select('*'),
      ])

      const dogs: Dog[] = dogsRes.data ?? []
      const vaccinations: Vaccination[] = vacRes.data ?? []
      const appointments: Appointment[] = appRes.data ?? []
      const medications: Medication[] = medRes.data ?? []

      setDogsData(
        dogs.map((dog) => ({
          dog,
          vaccinations: vaccinations.filter((v) => v.dog_id === dog.id),
          appointments: appointments.filter((a) => a.dog_id === dog.id),
          medications: medications.filter((m) => m.dog_id === dog.id),
        }))
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

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

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis perros</h1>
          <p className="text-sm text-gray-500">
            {dogsData.length} {dogsData.length === 1 ? 'perro registrado' : 'perros registrados'}
          </p>
        </div>
        {isEditor && (
          <Button onClick={() => setShowForm(true)} size="sm">
            + Agregar
          </Button>
        )}
      </div>

      {/* Dog cards */}
      {dogsData.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🐶</div>
          <p className="text-gray-500 font-medium mb-1">No hay perros registrados aún</p>
          {isEditor && (
            <p className="text-gray-400 text-sm">
              Toca el botón "Agregar" para registrar tu primer perro
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {dogsData.map(({ dog, vaccinations, appointments, medications }, index) => (
            <DogCard
              key={dog.id}
              dog={dog}
              index={index}
              vaccinations={vaccinations}
              appointments={appointments}
              medications={medications}
            />
          ))}
        </div>
      )}

      {showForm && (
        <DogForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            fetchData()
          }}
        />
      )}
    </div>
  )
}
