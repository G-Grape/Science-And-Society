import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  type = 'danger' // 'danger' or 'warning'
}) {
  if (!isOpen) return null

  const accentColor = type === 'danger' ? 'var(--destructive)' : '#f59e0b'
  const accentBg = type === 'danger' ? '#fee2e2' : '#fef3c7'

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div 
        className="confirm-modal-container" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Close button */}
        <button 
          className="confirm-modal-close" 
          onClick={onClose}
          aria-label="Close modal"
          disabled={loading}
        >
          <X size={18} />
        </button>

        <div className="confirm-modal-content">
          {/* Warning Icon */}
          <div 
            className="confirm-modal-icon-wrapper"
            style={{ backgroundColor: accentBg, color: accentColor }}
          >
            <AlertTriangle size={24} />
          </div>

          {/* Text content */}
          <div className="confirm-modal-text">
            <h3 className="confirm-modal-title">{title}</h3>
            <p className="confirm-modal-message">{message}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="confirm-modal-actions">
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            className="btn"
            style={{ 
              backgroundColor: accentColor, 
              color: '#fff',
              borderColor: accentColor,
              boxShadow: type === 'danger' ? '0 4px 12px rgba(239, 68, 68, 0.2)' : '0 4px 12px rgba(245, 158, 11, 0.2)'
            }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-sm" style={{ marginRight: '0.5rem' }} />
            ) : null}
            {loading ? 'Processing…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
