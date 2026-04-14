import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function HomeIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function PawIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

export function BottomNav() {
  const location = useLocation()
  const { id } = useParams()
  const { signOut } = useAuth()

  const isHome = location.pathname === '/'
  const isDogProfile = location.pathname.startsWith('/perro/')
  const isAgenda = location.pathname === '/agenda'

  const navItem = (
    to: string,
    icon: React.ReactNode,
    label: string,
    active: boolean
  ) => (
    <Link
      to={to}
      className={[
        'flex flex-col items-center gap-1 flex-1 py-2 transition-colors',
        active ? 'text-terra-500' : 'text-gray-400 hover:text-gray-600',
      ].join(' ')}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </Link>
  )

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 shadow-lg safe-bottom no-print">
      <div className="flex items-stretch max-w-lg mx-auto">
        {navItem('/', <HomeIcon />, 'Inicio', isHome)}
        {navItem(
          isDogProfile && id ? `/perro/${id}` : '/',
          <PawIcon />,
          isDogProfile ? 'Perfil' : 'Perros',
          isDogProfile
        )}
        {navItem('/agenda', <CalendarIcon />, 'Agenda', isAgenda)}
        <button
          onClick={() => signOut()}
          className="flex flex-col items-center gap-1 flex-1 py-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-xs font-medium">Salir</span>
        </button>
      </div>
    </nav>
  )
}
