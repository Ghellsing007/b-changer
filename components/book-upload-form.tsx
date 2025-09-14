"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Book, AlertCircle, CheckCircle } from "lucide-react"
import { FileUploader } from "@/components/FileUploader"
import { useFileUpload } from "@/hooks/useFileUpload"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { FileType } from "@/lib/types/database"

interface BookFormData {
  title: string
  author: string
  description: string
  category: string
  language: string
}

interface FileUploadResult {
  filePath: string
  fileUrl: string
  fileName: string
  fileSize: number
}

export function BookUploadForm() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Estado del formulario
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    description: '',
    category: '',
    language: 'Español'
  })

  // Estado de archivos
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Usuario dummy para desarrollo (sin autenticación)
  const dummyUserId = '00000000-0000-0000-0000-000000000000'

  // Hooks de upload
  const pdfUpload = useFileUpload()
  const coverUpload = useFileUpload()

  // Manejar cambios en el formulario
  const handleInputChange = (field: keyof BookFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Validar formulario
  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'El título es obligatorio'
    if (!formData.author.trim()) return 'El autor es obligatorio'
    if (!formData.description.trim()) return 'La descripción es obligatoria'
    if (!formData.category.trim()) return 'La categoría es obligatoria'
    if (!pdfFile) return 'Debes seleccionar un archivo PDF'
    return null
  }

  // Crear libro y edición en BD (sin archivos)
  const createBookInDB = async () => {
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

  // Registrar archivos en BD después de subirlos
  const registerFilesInDB = async (
    editionId: string,
    pdfResult: FileUploadResult,
    coverResult: FileUploadResult | null
  ) => {
    const fileInserts = [
      {
        edition_id: editionId,
        file_type: 'pdf',
        file_name: pdfResult.fileName,
        file_path: pdfResult.filePath,
        file_size: pdfResult.fileSize,
        mime_type: pdfFile!.type,
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

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      toast({
        title: "Error de validación",
        description: validationError,
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Crear libro y edición en BD primero
      const { bookData, editionData } = await createBookInDB()

      // Subir PDF con el UUID real de la edición
      const pdfResult = await pdfUpload.uploadFile(pdfFile!, editionData.id, 'pdf', dummyUserId)
      if (!pdfResult) {
        throw new Error('Error al subir el PDF')
      }

      // Subir portada (opcional)
      let coverResult = null
      if (coverFile) {
        coverResult = await coverUpload.uploadFile(coverFile, editionData.id, 'cover', dummyUserId)
      }

      // Registrar archivos en BD
      await registerFilesInDB(editionData.id, pdfResult, coverResult)

      toast({
        title: "¡Libro subido exitosamente!",
        description: `"${formData.title}" está ahora disponible en el catálogo.`,
      })

      // Resetear formulario
      setFormData({
        title: '',
        author: '',
        description: '',
        category: '',
        language: 'Español'
      })
      setPdfFile(null)
      setCoverFile(null)
      pdfUpload.resetState()
      coverUpload.resetState()

      // Redirigir al catálogo
      setTimeout(() => {
        router.push('/catalog')
      }, 2000)

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Error al subir libro",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <Card className="max-w-4xl mx-auto border-cyan-100">
      <CardHeader className="text-center">
        <div className="h-16 w-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Book className="h-8 w-8 text-cyan-600" />
        </div>
        <CardTitle className="text-slate-800">Subir Nuevo Libro</CardTitle>
        <CardDescription className="text-slate-600">
          Comparte tu libro con la comunidad. Sube el PDF y una portada atractiva.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Archivos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PDF Upload */}
            <div className="space-y-3">
              <Label className="text-slate-700 font-medium">
                Archivo PDF <span className="text-red-500">*</span>
              </Label>
              <FileUploader
                onFileSelect={setPdfFile}
                fileType="pdf"
                currentFile={pdfFile}
                uploadState={pdfUpload.uploadState}
                disabled={isSubmitting}
              />
            </div>

            {/* Cover Upload */}
            <div className="space-y-3">
              <Label className="text-slate-700 font-medium">
                Portada <span className="text-gray-400">(opcional)</span>
              </Label>
              <FileUploader
                onFileSelect={setCoverFile}
                fileType="cover"
                currentFile={coverFile}
                uploadState={coverUpload.uploadState}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Información del libro */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-700 font-medium">
                  Título del Libro <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Ingresa el título completo"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="border-slate-200"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author" className="text-slate-700 font-medium">
                  Autor <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="author"
                  placeholder="Nombre del autor"
                  value={formData.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  className="border-slate-200"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-700 font-medium">
                Descripción <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe el libro, su contenido, género, etc."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="border-slate-200 min-h-[100px]"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-slate-700 font-medium">
                  Categoría <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ficción">Ficción</SelectItem>
                    <SelectItem value="No Ficción">No Ficción</SelectItem>
                    <SelectItem value="Ciencia">Ciencia</SelectItem>
                    <SelectItem value="Tecnología">Tecnología</SelectItem>
                    <SelectItem value="Historia">Historia</SelectItem>
                    <SelectItem value="Biografías">Biografías</SelectItem>
                    <SelectItem value="Romance">Romance</SelectItem>
                    <SelectItem value="Misterio">Misterio</SelectItem>
                    <SelectItem value="Fantasía">Fantasía</SelectItem>
                    <SelectItem value="Ciencia Ficción">Ciencia Ficción</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="text-slate-700 font-medium">
                  Idioma
                </Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => handleInputChange('language', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Selecciona el idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Español">Español</SelectItem>
                    <SelectItem value="Inglés">Inglés</SelectItem>
                    <SelectItem value="Francés">Francés</SelectItem>
                    <SelectItem value="Alemán">Alemán</SelectItem>
                    <SelectItem value="Italiano">Italiano</SelectItem>
                    <SelectItem value="Portugués">Portugués</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Botón de envío */}
          <Button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white h-12 text-lg font-medium"
            disabled={isSubmitting || !pdfFile || !formData.title || !formData.author || !formData.description || !formData.category}
          >
            {isSubmitting ? (
              <>
                <Upload className="h-5 w-5 mr-2 animate-spin" />
                Subiendo libro...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Subir Libro
              </>
            )}
          </Button>

          {/* Mensaje de ayuda */}
          <div className="text-center text-sm text-gray-500">
            <p>Los archivos se almacenan de forma segura y privada.</p>
            <p>Solo los usuarios autorizados podrán acceder a tu contenido.</p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
