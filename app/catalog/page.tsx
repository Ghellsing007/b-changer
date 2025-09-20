"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { getSignedUrl } from "@/lib/supabase/storage/urls"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Book, Search, Filter, Heart, ShoppingCart, X, BookOpen } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import { AddToCartButton } from "@/components/add-to-cart-button"

interface BookWithDetails {
  id: string
  title: string
  description: string
  category?: { name: string }
  authors: { name: string }[]
  editions: any[]
  coverUrl?: string
  downloadUrl?: string

}

async function getBooks(): Promise<BookWithDetails[]> {
  const supabase = createClient()

  // Get all books with their editions and files
  const { data: books, error } = await supabase
    .from("books")
    .select(`
      id,
      title,
      description,
      category:categories(name),
      book_authors(
        author:authors(name)
      ),
      editions(
        id,
        format,
        isbn,
        publication_date,
        publisher:publishers(name),
        listings(
          id,
          type,
          price,
          daily_fee,
          quantity,
          is_active,
          seller:profiles!seller_id(display_name)
        ),
        book_files(
          id,
          file_type,
          file_name,
          file_path,
          file_size
        )
      )
    `)
    .limit(1000) // Aumentar límite para más libros

  if (error) {
    console.error("Error fetching books:", error)
    return []
  }

  const items = books || []
  return Promise.all(items.map(async (book: any) => {
    const coverFile = book.editions?.[0]?.book_files?.find((f: any) => f.file_type === 'cover')
    const pdfFile = book.editions?.[0]?.book_files?.find((f: any) => f.file_type === 'pdf')
    let coverUrl: string | undefined
    let downloadUrl: string | undefined
    if (coverFile) {
      try {
        coverUrl = await getSignedUrl(coverFile.file_path)
      } catch (error) {
        console.error("Error obteniendo portada firmada:", error)
      }
    }
    if (pdfFile) {
      try {
        downloadUrl = await getSignedUrl(pdfFile.file_path)
      } catch (error) {
        console.error("Error obteniendo PDF firmado:", error)
      }
    }

    return {
      ...book,
      authors: book.book_authors?.map((ba: any) => ba.author).filter(Boolean) || [],
      editions: book.editions || [],
      coverUrl,
      downloadUrl,
    }
  }))
}

function BookCard({ book }: { book: BookWithDetails }) {
  const firstEdition = book.editions[0]
  const hasListings = firstEdition?.listings && firstEdition.listings.length > 0
  const hasFiles = firstEdition?.book_files && firstEdition.book_files.length > 0
  const downloadUrl = book.downloadUrl

  // Buscar archivos disponibles
  const coverUrl = book.coverUrl
  const displayCover = coverUrl ?? "/book-placeholder.jpg"
  const pdfFile = firstEdition?.book_files?.find((f: any) => f.file_type === 'pdf')

  // Determinar tipo de libro
  const isDownloadable = hasFiles && pdfFile
  const isForSale = hasListings && firstEdition.listings.some((l: any) => l.type === "sale")
  const isForLoan = hasListings && firstEdition.listings.some((l: any) => l.type === "loan")

  // Calcular precios mínimos
  const listings = firstEdition?.listings || []
  const saleListings = listings.filter((l: any) => l.type === "sale")
  const loanListings = listings.filter((l: any) => l.type === "loan")
  const minPrice = saleListings.length > 0 ? Math.min(...saleListings.map((l: any) => l.price)) : 0
  const minDailyFee = loanListings.length > 0 ? Math.min(...loanListings.map((l: any) => l.daily_fee)) : 0
  const saleListingId = saleListings[0]?.id

  return (
    <Card className="h-full flex flex-col bg-white hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-cyan-200 group overflow-hidden">
      {/* Portada grande en la parte superior */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <img
          src={displayCover}
          alt={`Portada de ${book.title}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Overlay con indicadores */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 bg-white/90 hover:bg-white text-red-500 hover:text-red-600 rounded-full shadow-sm"
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        {/* Badges de tipo en la parte inferior */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1">
          {isDownloadable && (
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 text-xs px-2 py-1">
              📥 Descargable
            </Badge>
          )}
          {isForSale && (
            <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 text-xs px-2 py-1">
              💰 ${minPrice}
            </Badge>
          )}
          {isForLoan && (
            <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 text-xs px-2 py-1">
              🔄 ${minDailyFee}/día
            </Badge>
          )}
          {!isDownloadable && !isForSale && !isForLoan && (
            <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 text-xs px-2 py-1">
              📚 Próximamente
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="flex-1 flex flex-col p-4">
        {/* Información del libro */}
        <div className="flex-1 space-y-2">
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-900 line-clamp-2 text-lg leading-tight">
              {book.title}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-1">
              por {book.authors.map((a) => a.name).join(", ")}
            </p>
          </div>

          {book.category && (
            <Badge
              variant="secondary"
              className="w-fit bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border border-cyan-200 text-xs"
            >
              {book.category.name}
            </Badge>
          )}

          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
            {book.description}
          </p>
        </div>

        {/* Botones de acción */}
        <div className="mt-4 space-y-2">
          {/* Layout adaptativo: si tiene múltiples acciones, usar columnas */}
          <div className={`flex gap-2 ${(!isDownloadable && isForSale && isForLoan) ? 'flex-col' : ''}`}>
            <Button
              asChild
              size="sm"
              variant="outline"
              className={`${(!isDownloadable && isForSale && isForLoan) ? 'w-full' : 'flex-1'} border-gray-300 hover:bg-gray-50 hover:border-cyan-300 transition-colors`}
            >
              <Link href={`/catalog/${book.id}`}>Ver Detalles</Link>
            </Button>

            {/* Botones de acción unificados */}
            {isDownloadable && downloadUrl && (
              <Button
                asChild
                size="sm"
                className={`${(!isDownloadable && isForSale && isForLoan) ? 'w-full' : 'flex-1'} bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-sm hover:shadow-md transition-all`}
              >
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Book className="h-4 w-4 mr-1" />
                  Descargar
                </a>
              </Button>
            )}

            {!isDownloadable && (
              <>
                {isForSale && saleListingId && (
                  <AddToCartButton
                    listingId={saleListingId}
                    className={`${(!isDownloadable && isForSale && isForLoan) ? 'w-full' : 'flex-1'} bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-sm hover:shadow-md transition-all`}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Comprar
                  </AddToCartButton>
                )}

                {isForLoan && (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className={`${(!isDownloadable && isForSale && isForLoan) ? 'w-full' : 'flex-1'} border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 transition-all`}
                  >
                    <Link href={`/catalog/${book.id}`}>
                      <BookOpen className="h-4 w-4 mr-1" />
                      Pedir Prestado
                    </Link>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface CatalogFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategory: string
  onCategoryChange: (category: string) => void
  selectedType: string
  onTypeChange: (type: string) => void
  availableCategories: string[]
  bookCount: number
  filteredCount: number
}

function CatalogFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedType,
  onTypeChange,
  availableCategories,
  bookCount,
  filteredCount
}: CatalogFiltersProps) {
  return (
    <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Book className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Catálogo de Libros</h1>
          </div>
          <Button asChild className="bg-white text-cyan-600 hover:bg-gray-100">
            <Link href="/upload">Subir Libro</Link>
          </Button>
        </div>

        <div className="space-y-4">
          {/* Barra de búsqueda */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
              <Input
                placeholder="Buscar libros, autores, ISBN..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/70 focus:bg-white/20"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>

            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-48 bg-white/10 backdrop-blur-sm border-white/30 text-white">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {availableCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={onTypeChange}>
              <SelectTrigger className="w-48 bg-white/10 backdrop-blur-sm border-white/30 text-white">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="downloadable">📥 Descargables</SelectItem>
                <SelectItem value="for-sale">💰 En venta</SelectItem>
                <SelectItem value="for-loan">🔄 Para préstamo</SelectItem>
                <SelectItem value="coming-soon">📚 Próximamente</SelectItem>
              </SelectContent>
            </Select>

            {/* Estadísticas */}
            <div className="ml-auto text-sm">
              {filteredCount !== bookCount ? (
                <span>{filteredCount} de {bookCount} libros</span>
              ) : (
                <span>{bookCount} libros disponibles</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BookGrid({ books }: { books: BookWithDetails[] }) {
  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay libros disponibles</h3>
        <p className="text-muted-foreground mb-4">Sé el primero en agregar libros al catálogo</p>
        <Button asChild>
          <Link href="/upload">Subir tu Primer Libro</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  )
}

export default function CatalogPage() {
  const [books, setBooks] = useState<BookWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")

  // Cargar libros al montar el componente
  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true)
        const data = await getBooks()
        setBooks(data)
      } catch (error) {
        console.error("Error loading books:", error)
      } finally {
        setLoading(false)
      }
    }
    loadBooks()
  }, [])

  // Obtener categorías disponibles
  const availableCategories = useMemo(() => {
    const categories = new Set<string>()
    books.forEach(book => {
      if (book.category?.name) {
        categories.add(book.category.name)
      }
    })
    return Array.from(categories).sort()
  }, [books])

  // Filtrar libros
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      // Filtro de búsqueda
      const matchesSearch = !searchQuery ||
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.authors.some(author => author.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        book.description?.toLowerCase().includes(searchQuery.toLowerCase())

      // Filtro de categoría
      const matchesCategory = selectedCategory === "all" || book.category?.name === selectedCategory

      // Filtro de tipo
      let matchesType = true
      if (selectedType !== "all") {
        const firstEdition = book.editions[0]
        const hasFiles = firstEdition?.book_files && firstEdition.book_files.length > 0
        const hasListings = firstEdition?.listings && firstEdition.listings.length > 0
        const isDownloadable = hasFiles && firstEdition.book_files.some((f: any) => f.file_type === 'pdf')
        const isForSale = hasListings && firstEdition.listings.some((l: any) => l.type === "sale")
        const isForLoan = hasListings && firstEdition.listings.some((l: any) => l.type === "loan")

        switch (selectedType) {
          case "downloadable":
            matchesType = isDownloadable
            break
          case "for-sale":
            matchesType = isForSale
            break
          case "for-loan":
            matchesType = isForLoan
            break
          case "coming-soon":
            matchesType = !isDownloadable && !isForSale && !isForLoan
            break
        }
      }

      return matchesSearch && matchesCategory && matchesType
    })
  }, [books, searchQuery, selectedCategory, selectedType])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando catálogo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <CatalogFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        availableCategories={availableCategories}
        bookCount={books.length}
        filteredCount={filteredBooks.length}
      />

      <main className="container mx-auto px-4 py-8">
        <BookGrid books={filteredBooks} />
      </main>
    </div>
  )
}
