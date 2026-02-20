import Button from './Button'

export default function EmptyState({ icon, title, description, actionLabel, onAction, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-200 px-6 py-16 text-center ${className}`}>
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 text-gray-400">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      )}
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-gray-500">{description}</p>
      )}
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  )
}
