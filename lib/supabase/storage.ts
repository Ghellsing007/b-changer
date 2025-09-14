import { createClient } from './client'
import type { FileType } from '@/lib/types/database'
import { uploadFileToStorage } from './storage/upload'
import { getPublicUrl, getSignedUrl } from './storage/urls'

/**
 * Utilidades para manejar archivos en Supabase Storage
 * Gestiona PDFs y portadas de libros de manera segura
 */

export class StorageService {
  private supabase = createClient()

  /**
   * Verifica si el usuario tiene acceso a un archivo
   */
  async checkFileAccess(filePath: string, userId: string): Promise<boolean> {
    try {
      // Aquí implementarías la lógica de verificación de acceso
      // basada en compras, préstamos, etc.
      // Por ahora, permitir acceso a archivos del usuario
      const { data, error } = await this.supabase
        .from('book_files')
        .select('uploaded_by')
        .eq('file_path', filePath)
        .single()

      if (error) {
        console.error('Error checking file access:', error)
        return false
      }

      return data.uploaded_by === userId
    } catch (error) {
      console.error('Access check error:', error)
      return false
    }
  }

  /**
   * Elimina un archivo del storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from('book-files')
        .remove([filePath])

      if (error) {
        console.error('Error deleting file:', error)
        throw new Error(`Error al eliminar archivo: ${error.message}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      throw error
    }
  }

  /**
   * Obtiene información de archivos de una edición
   */
  async getEditionFiles(editionId: string): Promise<{
    pdf?: { filePath: string; fileUrl: string; fileName: string }
    cover?: { filePath: string; fileUrl: string; fileName: string }
  }> {
    try {
      const { data, error } = await this.supabase
        .from('book_files')
        .select('file_type, file_path, file_name')
        .eq('edition_id', editionId)

      if (error) {
        console.error('Error getting edition files:', error)
        return {}
      }

      const result: any = {}

      for (const file of data) {
        const fileUrl = file.file_type === 'cover'
          ? getPublicUrl(file.file_path)
          : await getSignedUrl(file.file_path)

        result[file.file_type] = {
          filePath: file.file_path,
          fileUrl,
          fileName: file.file_name
        }
      }

      return result
    } catch (error) {
      console.error('Get edition files error:', error)
      return {}
    }
  }
}

// Instancia singleton del servicio
export const storageService = new StorageService()

// Funciones de conveniencia para uso directo
export const uploadBookFile = (
  file: File,
  editionId: string,
  fileType: FileType,
  userId?: string // Opcional para desarrollo
) => uploadFileToStorage(file, editionId, fileType, userId)

export const getFileUrl = (filePath: string, fileType: FileType) =>
  fileType === 'cover'
    ? getPublicUrl(filePath)
    : getSignedUrl(filePath)

export const deleteBookFile = (filePath: string) =>
  storageService.deleteFile(filePath)

export const getEditionFiles = (editionId: string) =>
  storageService.getEditionFiles(editionId)