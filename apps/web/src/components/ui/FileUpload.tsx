import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { UploadCloud, File, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  label?: string
  accept?: string
  maxSizeMB?: number
  onFileSelect: (file: File) => void
  error?: string
  hint?: string
  containerClassName?: string
}

export function FileUpload({
  label,
  accept,
  maxSizeMB = 5,
  onFileSelect,
  error: propError,
  hint,
  containerClassName,
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const validateFile = (file: File) => {
    setError(null)
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > maxSizeMB) {
      setError(`File is too large. Max size is ${maxSizeMB}MB.`)
      return false
    }
    return true
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
        onFileSelect(file)
      }
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
        onFileSelect(file)
      }
    }
  }

  const onButtonClick = () => {
    inputRef.current?.click()
  }

  const displayedError = propError || error

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
      {label && (
        <span className="text-sm font-medium text-white/80">
          {label}
        </span>
      )}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={cn(
          'border border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 select-none min-h-[160px]',
          'bg-surface-3/30 border-white/10 hover:border-primary/40 hover:bg-surface-3/50',
          isDragActive && 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(79,70,229,0.15)]',
          displayedError && 'border-danger/40 hover:border-danger/60 bg-danger/5'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        {selectedFile ? (
          <div className="space-y-2 flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-success/15 border border-success/35 text-success flex items-center justify-center">
              <CheckCircle size={22} />
            </div>
            <p className="text-sm font-medium text-white max-w-[200px] truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted">{(selectedFile.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div className="space-y-3 flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-surface-3/80 border border-white/5 text-muted flex items-center justify-center shadow-inner">
              <UploadCloud size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Drag and drop your file here, or <span className="text-primary hover:underline">browse</span>
              </p>
              <p className="text-xs text-muted mt-1">
                Support files up to {maxSizeMB}MB
              </p>
            </div>
          </div>
        )}
      </div>
      {displayedError && (
        <p className="text-xs text-danger flex items-center gap-1.5 mt-1">
          <AlertCircle size={12} />
          {displayedError}
        </p>
      )}
      {hint && !displayedError && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}
