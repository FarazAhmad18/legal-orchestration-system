import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useProject } from '../../hooks/useProjects'

function Breadcrumbs() {
  const location = useLocation()
  const { id } = useParams()
  const { data: project } = useProject(id)

  const parts = location.pathname.split('/').filter(Boolean)
  const crumbs = [{ label: 'Dashboard', to: '/dashboard' }]

  if (parts[0] === 'projects' && parts[1] === 'new') {
    crumbs.push({ label: 'New Project' })
  } else if (parts[0] === 'projects' && id) {
    crumbs.push({ label: project?.name || 'Project', to: `/projects/${id}` })
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && (
            <svg className="h-3.5 w-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          )}
          {crumb.to && i < crumbs.length - 1 ? (
            <Link to={crumb.to} className="text-gray-500 hover:text-gray-700 transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-gray-900">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

export default function Header() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const initial = (user?.email || 'U')[0].toUpperCase()

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="flex h-14 items-center justify-between border-b border-surface-200 bg-surface-0 px-6">
      <Breadcrumbs />

      {/* Right: user dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-surface-100"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
            {initial}
          </div>
          <svg className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-surface-200 bg-surface-0 py-2 shadow-lg animate-fade-in" role="menu">
            <div className="px-4 py-2.5 border-b border-surface-100">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
              <p className="mt-0.5 text-xs text-gray-500 capitalize">{user?.role || 'user'}</p>
            </div>
            <div className="px-2 py-1.5">
              <button
                onClick={() => { setOpen(false); logout() }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-surface-100 hover:text-gray-900"
                role="menuitem"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
