export default function Input({ label, error, hint, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`block w-full rounded-lg border bg-surface-50 px-3.5 py-2.5 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-1 focus:bg-surface-0 placeholder:text-gray-400 ${
          error ? 'border-danger' : 'border-surface-200'
        }`}
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  )
}
