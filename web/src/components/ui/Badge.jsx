const colors = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/10',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  yellow: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  red: 'bg-red-50 text-red-700 ring-red-600/10',
  gray: 'bg-gray-50 text-gray-600 ring-gray-500/10',
  purple: 'bg-purple-50 text-purple-700 ring-purple-600/10',
  orange: 'bg-orange-50 text-orange-700 ring-orange-600/10',
}

export default function Badge({ children, color = 'gray', dot = false, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${colors[color] || colors.gray} ${className}`}
    >
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      )}
      {children}
    </span>
  )
}
