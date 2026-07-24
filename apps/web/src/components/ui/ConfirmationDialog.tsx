import { ReactNode } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { AlertCircle } from 'lucide-react'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: ReactNode
  confirmText?: string
  cancelText?: string
  type?: 'primary' | 'danger'
  loading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'primary',
  loading = false,
}: ConfirmationDialogProps) {
  const footer = (
    <>
      <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
        {cancelText}
      </Button>
      <Button
        variant={type === 'danger' ? 'danger' : 'primary'}
        size="sm"
        onClick={onConfirm}
        loading={loading}
      >
        {confirmText}
      </Button>
    </>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer} size="sm">
      <div className="flex gap-3.5 items-start mt-1">
        <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-danger/10 text-danger border border-danger/25">
          <AlertCircle size={20} />
        </div>
        <div className="space-y-1.5 flex-1">
          <p className="text-sm text-muted leading-relaxed">{description}</p>
        </div>
      </div>
    </Modal>
  )
}
