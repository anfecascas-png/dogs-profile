import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export default function Layout() {
  return (
    <div className="min-h-screen bg-cream-50 pb-24">
      <Outlet />
      <BottomNav />
    </div>
  )
}
