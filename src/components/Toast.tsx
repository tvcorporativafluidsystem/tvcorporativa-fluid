import { useEffect, useState } from 'react'

type ToastState = { message: string; type: 'success' | 'error' }

export function useToast() {
  const [state, setState] = useState<ToastState | null>(null)
  const show = (message: string, type: ToastState['type'] = 'success') => setState({ message, type })
  const reset = () => setState(null)
  return { state, show, reset }
}

export default function Toast({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const id = setTimeout(onClose, 3000)
    return () => clearTimeout(id)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`px-4 py-3 rounded-md shadow-lg ${type === 'success' ? 'bg-primary-700 text-black' : 'bg-danger text-white'}`}>
        {message}
      </div>
    </div>
  )
}