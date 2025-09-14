"use client"

import React, { useCallback, useState } from 'react'
import { Upload, FileText, ImageIcon, X, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { FileType } from '@/lib/types/database'

interface FileUploaderProps {
  onFileSelect: (file: File) => void
  fileType: FileType
  currentFile?: File | null
  uploadState?: {
    isUploading: boolean
    progress: number
    error: string | null
    success: boolean
  }
  className?: string
  disabled?: boolean
}

export function FileUploader({
  onFileSelect,
  fileType,
  currentFile,
  uploadState,
  className,
  disabled = false
}: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Configuración según tipo de archivo
  const config = {
    pdf: {
      accept: '.pdf',
      icon: FileText,
      label: 'Archivo PDF',
      description: 'Arrastra tu PDF aquí o haz clic para seleccionar',
      maxSize: '50MB',
      color: 'text-red-500'
    },
    cover: {
      accept: 'image/*',
      icon: ImageIcon,
      label: 'Portada',
      description: 'Arrastra una imagen o haz clic para seleccionar',
      maxSize: '10MB',
      color: 'text-blue-500'
    }
  }

  const currentConfig = config[fileType]
  const Icon = currentConfig.icon

  // Manejar selección de archivo
  const handleFileSelect = useCallback((file: File) => {
    if (fileType === 'cover' && file.type.startsWith('image/')) {
      // Crear preview para imágenes
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }

    onFileSelect(file)
  }, [fileType, onFileSelect])

  // Manejar drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0]
      if (fileType === 'pdf' && file.type === 'application/pdf') {
        handleFileSelect(file)
      } else if (fileType === 'cover' && file.type.startsWith('image/')) {
        handleFileSelect(file)
      }
    }
  }, [disabled, fileType, handleFileSelect])

  // Manejar click en input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  // Abrir selector de archivos
  const openFileSelector = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled])

  // Remover archivo
  const removeFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    // Aquí podrías llamar a una función para limpiar el archivo seleccionado
  }, [])

  return (
    <div className={cn("space-y-4", className)}>
      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={currentConfig.accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Área de drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileSelector}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200",
          "hover:border-primary/50 hover:bg-primary/5",
          isDragOver && "border-primary bg-primary/10 scale-[1.02]",
          disabled && "opacity-50 cursor-not-allowed",
          uploadState?.error && "border-red-300 bg-red-50",
          uploadState?.success && "border-green-300 bg-green-50",
          currentFile && "border-green-300 bg-green-50"
        )}
      >
        {/* Contenido del área de drop */}
        <div className="space-y-4">
          {/* Icono */}
          <div className="flex justify-center">
            {uploadState?.success || currentFile ? (
              <CheckCircle className="h-12 w-12 text-green-500" />
            ) : uploadState?.error ? (
              <AlertCircle className="h-12 w-12 text-red-500" />
            ) : (
              <Icon className={cn("h-12 w-12", currentConfig.color)} />
            )}
          </div>

          {/* Texto */}
          <div>
            <p className="text-sm font-medium text-gray-900">
              {currentConfig.label}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {currentConfig.description}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Máximo: {currentConfig.maxSize}
            </p>
          </div>

          {/* Archivo seleccionado */}
          {currentFile && (
            <div className="flex items-center justify-center space-x-2 p-2 bg-white rounded border">
              <Icon className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700 truncate max-w-[200px]">
                {currentFile.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="h-6 w-6 p-0 hover:bg-red-100"
              >
                <X className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          )}

          {/* Preview de imagen */}
          {preview && (
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Preview"
                className="h-20 w-20 object-cover rounded border"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 rounded-full"
              >
                <X className="h-3 w-3 text-white" />
              </Button>
            </div>
          )}

          {/* Estado de carga */}
          {uploadState?.isUploading && (
            <div className="space-y-2">
              <Progress value={uploadState.progress} className="w-full" />
              <p className="text-xs text-gray-500">
                Subiendo... {uploadState.progress}%
              </p>
            </div>
          )}

          {/* Mensaje de éxito */}
          {uploadState?.success && (
            <p className="text-xs text-green-600 font-medium">
              ¡Archivo subido exitosamente!
            </p>
          )}

          {/* Mensaje de error */}
          {uploadState?.error && (
            <p className="text-xs text-red-600 font-medium">
              {uploadState.error}
            </p>
          )}
        </div>

        {/* Overlay para drag */}
        {isDragOver && (
          <div className="absolute inset-0 bg-primary/10 rounded-lg flex items-center justify-center">
            <p className="text-primary font-medium">Suelta el archivo aquí</p>
          </div>
        )}
      </div>
    </div>
  )
}