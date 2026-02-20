import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50">
      <p className="text-sm font-medium text-brand-600">404 error</p>
      <h1 className="mt-2 text-7xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-4 text-base text-gray-500">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <Link to="/dashboard" className="mt-8">
        <Button>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Dashboard
        </Button>
      </Link>
    </div>
  )
}
