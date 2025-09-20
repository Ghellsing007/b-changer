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
import { Upload, Book } from "lucide-react"
import { FileUploader } from "@/components/FileUploader"
import { useFileUpload } from "@/hooks/useFileUpload"
import { useToast } from "@/hooks/use-toast"
import type { FileType } from "@/lib/types/database"
import { createClient } from "@/lib/supabase/client"
import { registerFilesInDB, type FileUploadResult } from "./book-upload/database"
import { validateBookForm, type BookFormData } from "./book-upload/validation"

export function BookUploadForm() {
  const router = useRouter()
  const { toast } = useToast()

  // Estado del formulario
  const [formData, setFormData] = useState<BookFormData>({
    title: "",
    author: "",
    description: "",
    category: "",
    language: "Español",
  })

  // Estado de archivos
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Hooks de upload
  const pdfUpload = useFileUpload()
  const coverUpload = useFileUpload()

  // Pre-llenar formulario con parámetros de URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const title = urlParams.get("title")
    const author = urlParams.get("author")
    const category = urlParams.get("category")

    if (title || author || category) {
      setFormData((prev) => ({
        ...prev,
        title: title || prev.title,
        author: author || prev.author,
        category: category || prev.category,
      }))
    }
  }, [])

  // Manejar cambios en el formulario
  const handleInputChange = (field: keyof BookFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateBookForm(formData, pdfFile)
    if (validationError) {
      toast({
        title: "Error de validación",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        toast({
          title: "Autenticación requerida",
          description: "Inicia sesión para subir un libro",
          variant: "destructive",
        })
        router.push("/auth/login?redirect=/upload")
        return
      }

      const response = await fetch("/api/books/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? "No se pudo crear el registro del libro")
      }

      const { editionId } = (await response.json()) as { bookId: string; editionId: string }
      if (!editionId) {
        throw new Error("No se recibió la edición creada")
      }

      const pdfResult = await pdfUpload.uploadFile(pdfFile!, editionId, "pdf", user.id)
      if (!pdfResult) {
        throw new Error("Error al subir el PDF")
      }

      let coverResult: FileUploadResult | null = null
      if (coverFile) {
        coverResult = await coverUpload.uploadFile(coverFile, editionId, "cover", user.id)
      }

      await registerFilesInDB(editionId, pdfResult, coverResult, pdfFile!, coverFile, user.id)

      toast({
        title: "¡Libro subido exitosamente!",
        description: `"${formData.title}" está ahora disponible en el catálogo.`,
      })

      setFormData({
        title: "",
        author: "",
        description: "",
        category: "",
        language: "Español",
      })
      setPdfFile(null)
      setCoverFile(null)
      pdfUpload.resetState()
      coverUpload.resetState()

      setTimeout(() => {
        router.push("/catalog")
      }, 2000)
    } catch (error) {
      console.error("Upload error:", error)
      const description = error instanceof Error ? error.message : "Error desconocido"
      toast({
        title: "Error al subir libro",
        description,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileSelect = (file: File, type: FileType) => {
    if (type === "pdf") {
      setPdfFile(file)
    } else {
      setCoverFile(file)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto shadow-lg border-cyan-100">
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-cyan-100 flex items-center justify-center shadow-inner">
            <Upload className="h-8 w-8 text-cyan-600" />
          </div>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-3xl font-bold text-slate-800">Subir nuevo libro</CardTitle>
          <CardDescription className="text-slate-600">
            Comparte tus libros con la comunidad. Los archivos se almacenan de manera segura y privada.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Book className="h-5 w-5 text-cyan-600" /> Información del libro
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-slate-700 font-medium">
                      Título del Libro <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="Ingresa el título completo"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
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
                      onChange={(e) => handleInputChange("author", e.target.value)}
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
                    onChange={(e) => handleInputChange("description", e.target.value)}
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
                      onValueChange={(value) => handleInputChange("category", value)}
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
                    <Label htmlFor="language" className="text-slate-700 font-medium">Idioma</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => handleInputChange("language", value)}
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
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-800">Archivos</h2>
                <div className="space-y-6">
                  <FileUploader
                    fileType="pdf"
                    onFileSelect={(file) => handleFileSelect(file, "pdf")}
                    currentFile={pdfFile}
                    uploadState={pdfUpload.uploadState}
                    disabled={isSubmitting}
                  />

                  <FileUploader
                    fileType="cover"
                    onFileSelect={(file) => handleFileSelect(file, "cover")}
                    currentFile={coverFile}
                    uploadState={coverUpload.uploadState}
                    disabled={isSubmitting}
                    className="border-dashed"
                  />
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white h-12 text-lg font-medium"
            disabled={
              isSubmitting ||
              !pdfFile ||
              !formData.title ||
              !formData.author ||
              !formData.description ||
              !formData.category
            }
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

          <div className="text-center text-sm text-gray-500">
            <p>Los archivos se almacenan de forma segura y privada.</p>
            <p>Solo los usuarios autorizados podrán acceder a tu contenido.</p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
