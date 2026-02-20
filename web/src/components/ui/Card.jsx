const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export default function Card({ children, className = '', hover = false, padding = 'md', ...props }) {
  return (
    <div
      className={`rounded-xl border border-surface-200 bg-surface-0 shadow-xs ${hover ? 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5' : ''} ${paddings[padding] || paddings.md} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
