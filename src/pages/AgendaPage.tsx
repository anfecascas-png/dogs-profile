import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Dog, Appointment, AppointmentStatus } from '../types'
import { formatDate, formatTime, isWithinDays, isPast } from '../utils/dateUtils'
import { Badge } from '../components/ui/Badge'
import { getDogColor } from '../constants/colors'

interface AppointmentWithDog extends Appointment {
  dog: Dog
  dogIndex: number
}

const statusConfig: Record<AppointmentStatus, { label: string; color: 'yellow' | 'green' | 'red' }> = {
  pendiente: { label: 'Pendiente', color: 'yellow' },
  completada: { label: 'Completada', color: 'green' },
  cancelada: { label: 'Cancelada', color: 'red' },
}

export default function AgendaPage() {
  const [items, setItems] = useState<AppointmentWithDog[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDog, setFilterDog] = useState<string>('todos')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [dogs, setDogs] = useState<Dog[]>([])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [dogsRes, appsRes] = await Promise.all([
          supabase.from('dogs').select('*').order('created_at'),
          supabase.from('appointments').select('*').order('date', { ascending: true }),
        ])

        const allDogs: Dog[] = dogsRes.data ?? []
        const allApps: Appointment[] = appsRes.data ?? []

        setDogs(allDogs)
        setItems(
          allApps.map((a) => {
            const dogIdx = allDogs.findIndex((d) => d.id === a.dog_id)
            return {
              ...a,
              dog: allDogs[dogIdx >= 0 ? dogIdx : 0],
              dogIndex: dogIdx >= 0 ? dogIdx : 0,
            }
          }).filter((a) => a.dog)
        )
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filtered = items.filter((a) => {
    if (filterDog !== 'todos' && a.dog_id !== filterDog) return false
    if (filterStatus !== 'todos' && a.status !== filterStatus) return false
    return true
  })

  const upcoming7 = filtered.filter((a) => a.status === 'pendiente' && isWithinDays(a.date, 7))
  const upcomingRest = filtered.filter((a) => a.status === 'pendiente' && !isWithinDays(a.date, 7) && !isPast(a.date))
  const past = filtered.filter((a) => a.status !== 'pendiente' || isPast(a.date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

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
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Agenda</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <select
          value={filterDog}
          onChange={(e) => setFilterDog(e.target.value)}
          className="flex-1 min-w-0 text-sm rounded-xl border border-gray-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-terra-300"
        >
          <option value="todos">Todos los perros</option>
          {dogs.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="flex-1 min-w-0 text-sm rounded-xl border border-gray-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-terra-300"
        >
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="completada">Completadas</option>
          <option value="cancelada">Canceladas</option>
        </select>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📅</div>
          <p className="text-gray-500">Sin citas que mostrar</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Próximos 7 días */}
          {upcoming7.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Esta semana
                </h2>
                <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {upcoming7.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {upcoming7.map((a) => <AppCard key={a.id} item={a} />)}
              </div>
            </section>
          )}

          {/* Próximas (más de 7 días) */}
          {upcomingRest.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Próximas citas
              </h2>
              <div className="flex flex-col gap-3">
                {upcomingRest.map((a) => <AppCard key={a.id} item={a} />)}
              </div>
            </section>
          )}

          {/* Pasadas */}
          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Historial
              </h2>
              <div className="flex flex-col gap-3">
                {past.map((a) => <AppCard key={a.id} item={a} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function AppCard({ item }: { item: AppointmentWithDog }) {
  const colors = getDogColor(item.dogIndex)
  const sc = statusConfig[item.status]
  const isSoon = item.status === 'pendiente' && isWithinDays(item.date, 7)

  return (
    <Link
      to={`/perro/${item.dog_id}`}
      className={[
        'block bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-shadow active:scale-[0.99] transition-transform',
        isSoon ? 'border-blue-200' : 'border-gray-100',
      ].join(' ')}
    >
      <div className="flex">
        {/* Dog color stripe */}
        <div className={`w-1 flex-shrink-0 ${colors.bg}`} />

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-medium text-gray-800">{item.title}</span>
                <Badge label={sc.label} color={sc.color} />
                {isSoon && <Badge label="Esta semana" color="blue" />}
              </div>
              <p className="text-sm text-gray-600">
                📅 {formatDate(item.date)}{item.time ? ` · ${formatTime(item.time)}` : ''}
              </p>
              {(item.veterinarian || item.clinic) && (
                <p className="text-xs text-gray-400 mt-1">
                  {item.veterinarian && `Dr. ${item.veterinarian}`}
                  {item.veterinarian && item.clinic && ' · '}
                  {item.clinic}
                </p>
              )}
            </div>
            {/* Dog avatar */}
            <div className={`w-9 h-9 rounded-full ${colors.bgLight} flex items-center justify-center flex-shrink-0`}>
              {item.dog.photo_url ? (
                <img src={item.dog.photo_url} alt={item.dog.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-base">🐾</span>
              )}
            </div>
          </div>
          <p className={`text-xs font-medium mt-2 ${colors.text}`}>{item.dog.name}</p>
        </div>
      </div>
    </Link>
  )
}
