import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Book, Search, Filter, Heart, ShoppingCart } from "lucide-react"
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
}

interface FileUploadResult {
  filePath: string
  fileUrl: string
  fileName: string
  fileSize: number
}

async function getBooks(): Promise<BookWithDetails[]> {
  const supabase = await createClient()

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
    .limit(100)

  if (error) {
    console.error("Error fetching books:", error)
    return []
  }

  return (books || [])
    .map((book: any) => ({
      ...book,
      authors: book.book_authors?.map((ba: any) => ba.author).filter(Boolean) || [],
      editions: book.editions || [],
      // Add cover URL if available
      coverUrl: book.editions?.[0]?.book_files?.find((f: any) => f.file_type === 'cover')?.file_path
    }))
}

function BookCard({ book }: { book: BookWithDetails }) {
  const firstEdition = book.editions[0]
  const hasListings = firstEdition?.listings && firstEdition.listings.length > 0
  const hasFiles = firstEdition?.book_files && firstEdition.book_files.length > 0

  // Si tiene archivos (descargable) - PRIORIDAD sobre listings
  if (hasFiles) {
    const pdfFile = firstEdition.book_files!.find((f: any) => f.file_type === 'pdf')
    const coverFile = firstEdition.book_files!.find((f: any) => f.file_type === 'cover')

    return (
      <Card className="h-full flex flex-col bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-all duration-300 border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            {/* Portada pequeña a la izquierda */}
            {coverFile && (
              <div className="flex-shrink-0 w-16 h-20 overflow-hidden rounded-md border">
                <img
                  src={coverFile.file_path}
                  alt={`Portada de ${book.title}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2 text-gray-800">{book.title}</CardTitle>
                  <CardDescription className="mt-1 text-gray-600">
                    {book.authors.map((a) => a.name).join(", ")}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
              {book.category && (
                <Badge
                  variant="secondary"
                  className="w-fit bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 border-0 mt-2"
                >
                  {book.category.name}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col pt-0">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{book.description}</p>

          <div className="mt-auto space-y-3">
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
              Descargable Gratis
            </Badge>

            <div className="flex gap-2">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="flex-1 border-gray-300 hover:bg-gray-50 bg-transparent"
              >
                <Link href={`/catalog/${book.id}`}>Ver Detalles</Link>
              </Button>
              {pdfFile && (
                <Button
                  asChild
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0"
                >
                  <a href={pdfFile.file_path} target="_blank" rel="noopener noreferrer">
                    <Book className="h-4 w-4 mr-1" />
                    Descargar
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Si tiene listings (venta/préstamo)
  if (hasListings) {
    const listings = firstEdition.listings || []
    const hasForSale = listings.some((l: any) => l.type === "sale")
    const hasForLoan = listings.some((l: any) => l.type === "loan")
    const saleListings = listings.filter((l: any) => l.type === "sale")
    const loanListings = listings.filter((l: any) => l.type === "loan")
    const minPrice = saleListings.length > 0 ? Math.min(...saleListings.map((l: any) => l.price)) : 0
    const minDailyFee = loanListings.length > 0 ? Math.min(...loanListings.map((l: any) => l.daily_fee)) : 0
    const saleListingId = saleListings[0]?.id

    return (
      <Card className="h-full flex flex-col bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-all duration-300 border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2 text-gray-800">{book.title}</CardTitle>
              <CardDescription className="mt-1 text-gray-600">
                {book.authors.map((a) => a.name).join(", ")}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
          {book.category && (
            <Badge
              variant="secondary"
              className="w-fit bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 border-0"
            >
              {book.category.name}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col pt-0">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{book.description}</p>

          <div className="mt-auto space-y-3">
            <div className="flex flex-wrap gap-2">
              {hasForSale && (
                <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0">
                  Venta: ${minPrice}
                </Badge>
              )}
              {hasForLoan && (
                <Badge variant="outline" className="border-cyan-300 text-cyan-700 bg-cyan-50">
                  Préstamo: ${minDailyFee}/día
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="flex-1 border-gray-300 hover:bg-gray-50 bg-transparent"
              >
                <Link href={`/catalog/${book.id}`}>Ver Detalles</Link>
              </Button>
              {hasForSale && saleListingId && (
                <AddToCartButton
                  listingId={saleListingId}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0"
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Comprar
                </AddToCartButton>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Fallback - mostrar libro básico sin archivos ni listings
  return (
    <Card className="h-full flex flex-col bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-all duration-300 border-0 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 text-gray-800">{book.title}</CardTitle>
            <CardDescription className="mt-1 text-gray-600">
              {book.authors.map((a) => a.name).join(", ")}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        {book.category && (
          <Badge
            variant="secondary"
            className="w-fit bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-0"
          >
            {book.category.name}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{book.description}</p>

        <div className="mt-auto space-y-3">
          <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0">
            Próximamente
          </Badge>

          <div className="flex gap-2">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="flex-1 border-gray-300 hover:bg-gray-50 bg-transparent"
            >
              <Link href={`/catalog/${book.id}`}>Ver Detalles</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CatalogHeader() {
  return (
    <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Book className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Catálogo de Libros</h1>
          </div>
          <Button asChild className="bg-white text-cyan-600 hover:bg-gray-100">
            <Link href="/sell">Vender Libro</Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar libros, autores, ISBN..."
              className="pl-10 bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/70"
            />
          </div>
          <Button variant="outline" className="border-white/30 text-white hover:bg-white/20 bg-transparent">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
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
          <Link href="/sell">Vender tu Primer Libro</Link>
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

export default async function CatalogPage() {
  const books = await getBooks()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <CatalogHeader />

      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<div>Cargando libros...</div>}>
          <BookGrid books={books} />
        </Suspense>
      </main>
    </div>
  )
}
