import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback(({ message, type = 'default' }) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  toast.success = (msg) => toast({ message: msg, type: 'success' })
  toast.error   = (msg) => toast({ message: msg, type: 'error' })

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">
              {t.type === 'success' ? <CheckCircle size={16} /> : t.type === 'error' ? <XCircle size={16} /> : null}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
