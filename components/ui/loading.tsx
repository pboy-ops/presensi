interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className={`flex justify-center items-center ${className || ''}`}>
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
    </div>
  )
}