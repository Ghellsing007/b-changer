import { useState, useCallback } from 'react'
import { storageService } from '@/lib/supabase/storage'
import type { FileType } from '@/lib/types/database'

interface UploadState {
  isUploading: boolean
  progress: number
  error: string | null
  success: boolean
}

interface FileUploadResult {
  filePath: string
  fileUrl: string
  fileName: string
  fileSize: number
}

export function useFileUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    success: false
  })

  const resetState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      success: false
    })
  }, [])

  const validateFile = useCallback((file: File, fileType: FileType): string | null => {
    // Validar tamaño (50MB máximo)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return `Archivo demasiado grande. Máximo permitido: 50MB`
    }

    // Validar tipo de archivo
    const allowedTypes = {
      pdf: ['application/pdf'],
      cover: ['image/jpeg', 'image/png', 'image/webp']
    }

    if (!allowedTypes[fileType].includes(file.type)) {
      const expectedTypes = fileType === 'pdf' ? 'PDF' : 'imagen (JPEG, PNG, WebP)'
      return `Tipo de archivo no válido. Se esperaba: ${expectedTypes}`
    }

    return null // Sin errores
  }, [])

  const uploadFile = useCallback(async (
    file: File,
    editionId: string,
    fileType: FileType,
    userId?: string // Opcional para desarrollo
  ): Promise<FileUploadResult | null> => {
    try {
      // Resetear estado
      setUploadState({
        isUploading: true,
        progress: 0,
        error: null,
        success: false
      })

      // Validar archivo
      const validationError = validateFile(file, fileType)
      if (validationError) {
        setUploadState(prev => ({
          ...prev,
          isUploading: false,
          error: validationError
        }))
        return null
      }

      // Simular progreso inicial
      setUploadState(prev => ({ ...prev, progress: 10 }))

      // Subir archivo usando el servicio de storage
      const result = await storageService.uploadFile(file, editionId, fileType, userId)

      // Simular progreso final
      setUploadState(prev => ({ ...prev, progress: 100 }))

      // Éxito
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        success: true
      }))

      return {
        filePath: result.filePath,
        fileUrl: result.fileUrl,
        fileName: file.name,
        fileSize: file.size
      }

    } catch (error) {
      console.error('Upload error:', error)

      const errorMessage = error instanceof Error
        ? error.message
        : 'Error desconocido al subir el archivo'

      setUploadState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
        success: false
      })

      return null
    }
  }, [validateFile])

  const uploadMultipleFiles = useCallback(async (
    files: { file: File; fileType: FileType }[],
    editionId: string,
    userId?: string // Opcional para desarrollo
  ): Promise<FileUploadResult[]> => {
    const results: FileUploadResult[] = []

    for (const { file, fileType } of files) {
      const result = await uploadFile(file, editionId, fileType, userId)
      if (result) {
        results.push(result)
      } else {
        // Si falla uno, detener el proceso
        break
      }
    }

    return results
  }, [uploadFile])

  return {
    uploadState,
    uploadFile,
    uploadMultipleFiles,
    resetState,
    validateFile
  }
}