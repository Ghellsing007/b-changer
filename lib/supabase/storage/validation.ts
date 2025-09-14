import type { FileType } from '@/lib/types/database'

/**
 * Valida el tipo de archivo según el fileType
 */
export function validateFileType(mimeType: string, fileType: FileType): boolean {
  const validTypes = {
    pdf: ['application/pdf'],
    cover: ['image/jpeg', 'image/png', 'image/webp']
  }

  return validTypes[fileType]?.includes(mimeType) ?? false
}

/**
 * Valida el tamaño del archivo (50MB máximo)
 */
export function validateFileSize(fileSize: number): boolean {
  const maxSize = 50 * 1024 * 1024 // 50MB
  return fileSize <= maxSize
}