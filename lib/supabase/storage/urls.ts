import { createClient } from '../client'

/**
 * Obtiene URL pública para archivos (usado para portadas)
 */
export function getPublicUrl(filePath: string): string {
  const supabase = createClient()
  const bucketName = 'book-files'

  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath)

  return data.publicUrl
}

/**
 * Obtiene URL firmada para archivos privados (usado para PDFs)
 */
export async function getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
  const supabase = createClient()
  const bucketName = 'book-files'

  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, expiresIn)

  if (error) {
    console.error('Error creating signed URL:', error)
    throw new Error('No se pudo generar URL de acceso')
  }

  return data.signedUrl
}