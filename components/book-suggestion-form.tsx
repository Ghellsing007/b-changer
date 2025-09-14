"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Lightbulb, Send } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface BookSuggestionFormData {
  title: string
  author: string
  description: string
  category: string
  language: string
}

export function BookSuggestionForm() {
  const { toast } = useToast()
  const supabase = createClient()

  const [formData, setFormData] = useState<BookSuggestionFormData>({
    title: '',
    author: '',
    description: '',
    category: '',
    language: 'Español'
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof BookSuggestionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'El título es obligatorio'
    if (!formData.author.trim()) return 'El autor es obligatorio'
    if (!formData.category.trim()) return 'La categoría es obligatoria'
    return null
  }

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
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Error de autenticación",
          description: "Debes iniciar sesión para enviar sugerencias",
          variant: "destructive"
        })
        return
      }

      const { error } = await supabase
        .from('book_suggestions')
        .insert({
          title: formData.title.trim(),
          author: formData.author.trim(),
          description: formData.description.trim(),
          category: formData.category,
          language: formData.language,
          suggested_by: user.id
        })

      if (error) throw error

      toast({
        title: "¡Sugerencia enviada!",
        description: `"${formData.title}" ha sido agregada a la lista de libros pedidos.`,
      })

      // Resetear formulario
      setFormData({
        title: '',
        author: '',
        description: '',
        category: '',
        language: 'Español'
      })

    } catch (error) {
      console.error('Error submitting suggestion:', error)
      toast({
        title: "Error al enviar sugerencia",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto border-amber-100">
      <CardHeader className="text-center">
        <div className="h-16 w-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lightbulb className="h-8 w-8 text-amber-600" />
        </div>
        <CardTitle className="text-slate-800">Sugerir un Libro</CardTitle>
        <CardDescription className="text-slate-600">
          ¿No encuentras el libro que buscas? ¡Pídelo aquí! La comunidad podrá subirlo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
              Descripción (opcional)
            </Label>
            <Textarea
              id="description"
              placeholder="Describe brevemente el libro, su género, o por qué lo recomiendas..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="border-slate-200 min-h-[80px]"
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

          <Button
            type="submit"
            className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12 text-lg font-medium"
            disabled={isSubmitting || !formData.title || !formData.author || !formData.category}
          >
            {isSubmitting ? (
              <>
                <Send className="h-5 w-5 mr-2 animate-spin" />
                Enviando sugerencia...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                Enviar Sugerencia
              </>
            )}
          </Button>

          <div className="text-center text-sm text-gray-500">
            <p>Las sugerencias ayudan a la comunidad a crecer.</p>
            <p>¡Entre más votos tenga, más probable que alguien lo suba!</p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}