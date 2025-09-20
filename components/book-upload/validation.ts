export interface BookFormData {
  title: string
  author: string
  description: string
  category: string
  language: string
}

/**
 * Validar formulario de libro
 */
export function validateBookForm(formData: BookFormData, pdfFile: File | null): string | null {
  if (!formData.title.trim()) return 'El título es obligatorio'
  if (!formData.author.trim()) return 'El autor es obligatorio'
  if (!formData.description.trim()) return 'La descripción es obligatoria'
  if (!formData.category.trim()) return 'La categoría es obligatoria'
  if (!pdfFile) return 'Debes seleccionar un archivo PDF'
  return null
}