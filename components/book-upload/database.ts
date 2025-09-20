import { createClient } from "@/lib/supabase/client"

export interface BookFormData {
  title: string
  author: string
  description: string
  category: string
  language: string
}

export interface FileUploadResult {
  filePath: string
  fileUrl: string
  fileName: string
  fileSize: number
}

/**
 * Crear libro y edición en BD (sin archivos)
 */
export async function createBookInDB(formData: BookFormData) {
  const supabase = createClient()

  // Crear o encontrar autor
  const { data: authorData, error: authorError } = await supabase
    .from('authors')
    .upsert({ name: formData.author }, { onConflict: 'name' })
    .select()
    .single()

  if (authorError) throw new Error(`Error al crear autor: ${authorError.message}`)

  // Crear o encontrar categoría
  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .upsert({ name: formData.category }, { onConflict: 'name' })
    .select()
    .single()

  if (categoryError) throw new Error(`Error al crear categoría: ${categoryError.message}`)

  // Crear libro
  const { data: bookData, error: bookError } = await supabase
    .from('books')
    .insert({
      title: formData.title,
      description: formData.description,
      category_id: categoryData.id
    })
    .select()
    .single()

  if (bookError) throw new Error(`Error al crear libro: ${bookError.message}`)

  // Relacionar libro con autor
  const { error: bookAuthorError } = await supabase
    .from('book_authors')
    .insert({
      book_id: bookData.id,
      author_id: authorData.id
    })

  if (bookAuthorError) throw new Error(`Error al relacionar autor: ${bookAuthorError.message}`)

  // Crear edición
  const { data: editionData, error: editionError } = await supabase
    .from('editions')
    .insert({
      book_id: bookData.id,
      format: 'ebook',
      isbn: `PDF-${Date.now()}`, // ISBN temporal para PDFs
      publication_date: new Date().toISOString().split('T')[0]
    })
    .select()
    .single()

  if (editionError) throw new Error(`Error al crear edición: ${editionError.message}`)

  return { bookData, editionData }
}

/**
 * Registrar archivos en BD después de subirlos
 */
export async function registerFilesInDB(
  editionId: string,
  pdfResult: FileUploadResult,
  coverResult: FileUploadResult | null,
  pdfFile: File,
  coverFile: File | null,
  dummyUserId: string
) {
  const supabase = createClient()

  const fileInserts = [
    {
      edition_id: editionId,
      file_type: 'pdf',
      file_name: pdfResult.fileName,
      file_path: pdfResult.filePath,
      file_size: pdfResult.fileSize,
      mime_type: pdfFile.type,
      uploaded_by: dummyUserId
    }
  ]

  if (coverResult && coverFile) {
    fileInserts.push({
      edition_id: editionId,
      file_type: 'cover',
      file_name: coverResult.fileName,
      file_path: coverResult.filePath,
      file_size: coverResult.fileSize,
      mime_type: coverFile.type,
      uploaded_by: dummyUserId
    })
  }

  const { error: filesError } = await supabase
    .from('book_files')
    .insert(fileInserts)

  if (filesError) throw new Error(`Error al registrar archivos: ${filesError.message}`)
}