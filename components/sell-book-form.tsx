"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface FormData {
  title: string
  authors: string
  description: string
  category: string
  publisher: string
  isbn: string
  format: string
  publicationDate: string
  price: string
  quantity: string
}

export function SellBookForm() {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    authors: "",
    description: "",
    category: "",
    publisher: "",
    isbn: "",
    format: "paperback",
    publicationDate: "",
    price: "",
    quantity: "1",
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("Usuario no autenticado")
      }

      // Create or get category
      let categoryId = null
      if (formData.category) {
        const { data: existingCategory } = await supabase
          .from("categories")
          .select("id")
          .eq("name", formData.category)
          .single()

        if (existingCategory) {
          categoryId = existingCategory.id
        } else {
          const { data: newCategory, error: categoryError } = await supabase
            .from("categories")
            .insert({ name: formData.category })
            .select("id")
            .single()

          if (categoryError) throw categoryError
          categoryId = newCategory.id
        }
      }

      // Create book
      const { data: book, error: bookError } = await supabase
        .from("books")
        .insert({
          title: formData.title,
          description: formData.description,
          category_id: categoryId,
        })
        .select("id")
        .single()

      if (bookError) throw bookError

      // Create authors and link them
      const authorNames = formData.authors.split(",").map((name) => name.trim())
      for (const authorName of authorNames) {
        if (authorName) {
          // Create or get author
          let authorId = null
          const { data: existingAuthor } = await supabase.from("authors").select("id").eq("name", authorName).single()

          if (existingAuthor) {
            authorId = existingAuthor.id
          } else {
            const { data: newAuthor, error: authorError } = await supabase
              .from("authors")
              .insert({ name: authorName })
              .select("id")
              .single()

            if (authorError) throw authorError
            authorId = newAuthor.id
          }

          // Link book and author
          await supabase.from("book_authors").insert({
            book_id: book.id,
            author_id: authorId,
          })
        }
      }

      // Create or get publisher
      let publisherId = null
      if (formData.publisher) {
        const { data: existingPublisher } = await supabase
          .from("publishers")
          .select("id")
          .eq("name", formData.publisher)
          .single()

        if (existingPublisher) {
          publisherId = existingPublisher.id
        } else {
          const { data: newPublisher, error: publisherError } = await supabase
            .from("publishers")
            .insert({ name: formData.publisher })
            .select("id")
            .single()

          if (publisherError) throw publisherError
          publisherId = newPublisher.id
        }
      }

      // Create edition
      const { data: edition, error: editionError } = await supabase
        .from("editions")
        .insert({
          book_id: book.id,
          publisher_id: publisherId,
          format: formData.format,
          isbn: formData.isbn || null,
          publication_date: formData.publicationDate || null,
        })
        .select("id")
        .single()

      if (editionError) throw editionError

      // Create listing
      const { error: listingError } = await supabase.from("listings").insert({
        seller_id: user.id,
        edition_id: edition.id,
        type: "sale",
        price: Number.parseFloat(formData.price),
        quantity: Number.parseInt(formData.quantity),
      })

      if (listingError) throw listingError

      toast({
        title: "¡Libro publicado!",
        description: "Tu libro ha sido agregado al catálogo exitosamente.",
      })

      router.push("/catalog")
    } catch (error) {
      console.error("Error creating listing:", error)
      toast({
        title: "Error",
        description: "No se pudo publicar el libro. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Libro</CardTitle>
        <CardDescription>Completa los detalles de tu libro para agregarlo al catálogo</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Título del libro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authors">Autores *</Label>
              <Input
                id="authors"
                required
                value={formData.authors}
                onChange={(e) => handleInputChange("authors", e.target.value)}
                placeholder="Autor 1, Autor 2, ..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe el libro..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                placeholder="Ficción, No Ficción, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="publisher">Editorial</Label>
              <Input
                id="publisher"
                value={formData.publisher}
                onChange={(e) => handleInputChange("publisher", e.target.value)}
                placeholder="Nombre de la editorial"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                value={formData.isbn}
                onChange={(e) => handleInputChange("isbn", e.target.value)}
                placeholder="978-0-123456-78-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Formato</Label>
              <Select value={formData.format} onValueChange={(value) => handleInputChange("format", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paperback">Tapa Blanda</SelectItem>
                  <SelectItem value="hardcover">Tapa Dura</SelectItem>
                  <SelectItem value="ebook">Libro Electrónico</SelectItem>
                  <SelectItem value="audiobook">Audiolibro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publicationDate">Fecha de Publicación</Label>
              <Input
                id="publicationDate"
                type="date"
                value={formData.publicationDate}
                onChange={(e) => handleInputChange("publicationDate", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Precio *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                placeholder="1"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Publicando..." : "Publicar Libro"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
