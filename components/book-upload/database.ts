import { createClient } from "@/lib/supabase/client"

export interface FileUploadResult {
  filePath: string
  fileUrl: string
  fileName: string
  fileSize: number
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
  userId: string
) {
  const supabase = createClient()

  const fileInserts = [
    {
      edition_id: editionId,
      file_type: "pdf",
      file_name: pdfResult.fileName,
      file_path: pdfResult.filePath,
      file_size: pdfResult.fileSize,
      mime_type: pdfFile.type,
      uploaded_by: userId,
    },
  ]

  if (coverResult && coverFile) {
    fileInserts.push({
      edition_id: editionId,
      file_type: "cover",
      file_name: coverResult.fileName,
      file_path: coverResult.filePath,
      file_size: coverResult.fileSize,
      mime_type: coverFile.type,
      uploaded_by: userId,
    })
  }

  const { error: filesError } = await supabase.from("book_files").insert(fileInserts)

  if (filesError) {
    throw new Error(`Error al registrar archivos: ${filesError.message}`)
  }
}
