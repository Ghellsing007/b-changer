import { createClient } from '../client'
import type { FileType } from '@/lib/types/database'
import { validateFileType, validateFileSize } from './validation'
import { getPublicUrl, getSignedUrl } from './urls'

/**
 * Sube un archivo a Supabase Storage (solo subida, sin registro en BD)
 */
export async function uploadFileToStorage(
  file: File,
  editionId: string,
  fileType: FileType,
  userId?: string // Opcional para desarrollo
): Promise<{ filePath: string; fileUrl: string }> {
  const supabase = createClient()
  const bucketName = 'book-files'

  try {
    // Generar path seguro
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const timestamp = Date.now()
    const safeFileName = `${editionId}_${fileType}_${timestamp}.${fileExt}`
    const filePath = `${editionId}/${fileType}/${safeFileName}`

    // Validar tipo de archivo
    if (!validateFileType(file.type, fileType)) {
      throw new Error(`Tipo de archivo no válido para ${fileType}`)
    }

    // Validar tamaño (50MB máximo)
    if (!validateFileSize(file.size)) {
      throw new Error('Archivo demasiado grande (máximo 50MB)')
    }

    // Subir archivo
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading file:', error)
      throw new Error(`Error al subir archivo: ${error.message}`)
    }

    // Obtener URL pública (para portadas) o firmada (para PDFs)
    const fileUrl = fileType === 'cover'
      ? getPublicUrl(filePath)
      : await getSignedUrl(filePath)

    return {
      filePath,
      fileUrl
    }
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}