export default function Skeleton({ lines = 0, circle = false, className = '' }) {
  const baseClass = 'animate-shimmer rounded-lg bg-gradient-to-r from-surface-100 via-surface-50 to-surface-100 bg-[length:200%_100%]'

  if (circle) {
    return <div className={`${baseClass} h-10 w-10 rounded-full ${className}`} />
  }

  if (lines > 0) {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClass} h-4`}
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>
    )
  }

  return <div className={`${baseClass} h-4 ${className}`} />
}
