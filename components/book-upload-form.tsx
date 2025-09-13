"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, ImageIcon, Book } from "lucide-react"

export function BookUploadForm() {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setPdfFile(file)
    }
  }

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setCoverImage(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    // Simulate upload process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsUploading(false)
    alert("¡Libro subido exitosamente!")
  }

  return (
    <Card className="max-w-2xl mx-auto border-cyan-100">
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PDF Upload */}
            <div className="space-y-2">
              <Label htmlFor="pdf-upload" className="text-slate-700">
                Archivo PDF
              </Label>
              <div className="border-2 border-dashed border-cyan-200 rounded-lg p-6 text-center hover:border-cyan-300 transition-colors">
                <input id="pdf-upload" type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <FileText className="h-12 w-12 text-cyan-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">{pdfFile ? pdfFile.name : "Haz clic para subir PDF"}</p>
                </label>
              </div>
            </div>

            {/* Cover Upload */}
            <div className="space-y-2">
              <Label htmlFor="cover-upload" className="text-slate-700">
                Portada
              </Label>
              <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center hover:border-blue-300 transition-colors">
                <input id="cover-upload" type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                <label htmlFor="cover-upload" className="cursor-pointer">
                  <ImageIcon className="h-12 w-12 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">
                    {coverImage ? coverImage.name : "Haz clic para subir imagen"}
                  </p>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-slate-700">
                Título del Libro
              </Label>
              <Input id="title" placeholder="Ingresa el título" className="border-slate-200" />
            </div>

            <div>
              <Label htmlFor="author" className="text-slate-700">
                Autor
              </Label>
              <Input id="author" placeholder="Nombre del autor" className="border-slate-200" />
            </div>

            <div>
              <Label htmlFor="description" className="text-slate-700">
                Descripción
              </Label>
              <Textarea
                id="description"
                placeholder="Describe el libro..."
                className="border-slate-200 min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category" className="text-slate-700">
                  Categoría
                </Label>
                <Input id="category" placeholder="Ej: Ficción, Ciencia" className="border-slate-200" />
              </div>
              <div>
                <Label htmlFor="language" className="text-slate-700">
                  Idioma
                </Label>
                <Input id="language" placeholder="Español" className="border-slate-200" />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
            disabled={isUploading || !pdfFile}
          >
            {isUploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Subir Libro
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
