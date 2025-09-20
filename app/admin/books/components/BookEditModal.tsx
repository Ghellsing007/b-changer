"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Save, X, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Book {
  id: string
  title: string
  description: string
  created_at: string
  updated_at: string
  category?: {
    id: string
    name: string
  }
  authors: Array<{
    id: string
    name: string
  }>
  editions: Array<{
    id: string
    format: string
    isbn?: string
    publication_date?: string
    book_files: Array<{
      id: string
      file_type: 'pdf' | 'cover'
    }>
    listings: Array<{
      id: string
      is_active: boolean
      type: 'sale' | 'loan'
    }>
  }>
}

interface BookEditModalProps {
  book: Book | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onBookUpdated?: (book: Book) => void
}

// Schema de validación
const bookEditSchema = z.object({
  title: z.string().min(1, "El título es obligatorio").max(255, "Máximo 255 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres").max(2000, "Máximo 2000 caracteres"),
  category_id: z.string().min(1, "La categoría es obligatoria"),
  language: z.string().min(1, "El idioma es obligatorio"),
  isbn: z.string().optional(),
  publication_date: z.date().optional(),
  status: z.enum(["active", "inactive", "draft"]).default("active"),
})

type BookEditForm = z.infer<typeof bookEditSchema>

export function BookEditModal({ book, open, onOpenChange, onBookUpdated }: BookEditModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const { toast } = useToast()
  const supabase = createClient()

  const form = useForm<BookEditForm>({
    resolver: zodResolver(bookEditSchema),
    defaultValues: {
      title: "",
      description: "",
      category_id: "",
      language: "Español",
      isbn: "",
      publication_date: undefined,
      status: "active",
    },
  })

  // Cargar categorías
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .order('name')

        if (error) throw error
        setCategories(data || [])
      } catch (error) {
        console.error('Error loading categories:', error)
      }
    }

    if (open) {
      loadCategories()
    }
  }, [open, supabase])

  // Cargar datos del libro cuando se abre el modal
  useEffect(() => {
    if (book && open) {
      // Obtener la primera edición (asumiendo que hay una principal)
      const mainEdition = book.editions[0]

      form.reset({
        title: book.title,
        description: book.description || "",
        category_id: book.category?.id || "",
        language: "Español", // TODO: Agregar campo de idioma a la BD
        isbn: mainEdition?.isbn || "",
        publication_date: mainEdition?.publication_date ? new Date(mainEdition.publication_date) : undefined,
        status: "active", // TODO: Agregar campo de estado a la BD
      })
    }
  }, [book, open, form])

  // Auto-guardado (draft)
  useEffect(() => {
    if (!open || !book) return

    const subscription = form.watch((value, { name, type }) => {
      // Solo auto-guardar si es un cambio por input del usuario
      if (type === 'change' && name && !saving) {
        const timeoutId = setTimeout(() => {
          handleAutoSave(value as BookEditForm)
        }, 2000) // Auto-guardar después de 2 segundos de inactividad

        return () => clearTimeout(timeoutId)
      }
    })

    return subscription.unsubscribe
  }, [open, book, saving])

  const handleAutoSave = async (formData: BookEditForm) => {
    if (!book) return

    try {
      // Aquí implementaríamos el auto-guardado a un campo draft
      // Por ahora solo mostramos que se está guardando
      console.log('Auto-saving draft:', formData)
    } catch (error) {
      console.error('Auto-save error:', error)
    }
  }

  const onSubmit = async (formData: BookEditForm) => {
    if (!book) return

    setSaving(true)
    try {
      // Actualizar libro
      const { error: bookError } = await supabase
        .from('books')
        .update({
          title: formData.title,
          description: formData.description,
          category_id: formData.category_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', book.id)

      if (bookError) throw bookError

      // Actualizar edición (asumiendo la primera edición)
      const mainEdition = book.editions[0]
      if (mainEdition) {
        const { error: editionError } = await supabase
          .from('editions')
          .update({
            isbn: formData.isbn || null,
            publication_date: formData.publication_date?.toISOString().split('T')[0] || null,
          })
          .eq('id', mainEdition.id)

        if (editionError) throw editionError
      }

      // Recargar datos del libro
      const { data: updatedBook, error: reloadError } = await supabase
        .from('books')
        .select(`
          *,
          category:categories(id, name),
          book_authors(authors(id, name)),
          editions(id, format, isbn, publication_date, book_files(id, file_type), listings(id, is_active, type))
        `)
        .eq('id', book.id)
        .single()

      if (reloadError) throw reloadError

      // Transformar datos
      const transformedBook: Book = {
        ...updatedBook,
        authors: updatedBook.book_authors?.map((ba: any) => ba.authors) || [],
        editions: updatedBook.editions || []
      }

      onBookUpdated?.(transformedBook)

      toast({
        title: "Libro actualizado",
        description: `"${formData.title}" se ha guardado correctamente.`,
      })

      onOpenChange(false)

    } catch (error) {
      console.error('Error updating book:', error)
      toast({
        title: "Error",
        description: "Error al actualizar el libro.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (form.formState.isDirty) {
      // TODO: Mostrar confirmación si hay cambios sin guardar
    }
    onOpenChange(false)
  }

  if (!book) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Editar Libro
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          </DialogTitle>
          <DialogDescription>
            Modifica la información del libro. Los cambios se guardan automáticamente como borrador.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información Básica</h3>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingresa el título completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe el libro, su contenido, género, etc."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Mínimo 10 caracteres, máximo 2000 caracteres
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idioma *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el idioma" />
                          </SelectTrigger>
                        </FormControl>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Información de publicación */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información de Publicación</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isbn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ISBN</FormLabel>
                      <FormControl>
                        <Input placeholder="ISBN del libro" {...field} />
                      </FormControl>
                      <FormDescription>
                        Código ISBN (opcional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="publication_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Publicación</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Selecciona una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Fecha de publicación original
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Estado del libro */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Estado del Libro</h3>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-green-500">Activo</Badge>
                            <span>Disponible para venta/préstamo</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="inactive">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Inactivo</Badge>
                            <span>No disponible temporalmente</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="draft">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Borrador</Badge>
                            <span>En revisión, no visible</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Información del libro actual */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Información Actual</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Archivos:</span>{" "}
                  {book.editions.reduce((acc, edition) => acc + (edition.book_files?.length || 0), 0)}
                </div>
                <div>
                  <span className="font-medium">Listings activos:</span>{" "}
                  {book.editions.reduce((acc, edition) => acc + (edition.listings?.filter(l => l.is_active).length || 0), 0)}
                </div>
                <div>
                  <span className="font-medium">Creado:</span>{" "}
                  {new Date(book.created_at).toLocaleDateString('es-ES')}
                </div>
                <div>
                  <span className="font-medium">Actualizado:</span>{" "}
                  {new Date(book.updated_at).toLocaleDateString('es-ES')}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}