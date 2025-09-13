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
  category: { name: string } | null
  authors: { name: string }[]
  editions: {
    id: string
    format: string
    isbn: string
    publication_date: string
    publisher: { name: string } | null
    listings: {
      id: string
      type: "sale" | "loan"
      price: number
      daily_fee: number
      quantity: number
      seller: { display_name: string }
    }[]
  }[]
}

async function getBooks(): Promise<BookWithDetails[]> {
  const supabase = await createClient()

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
          seller:profiles!seller_id(display_name)
        )
      )
    `)
    .eq("editions.listings.is_active", true)
    .limit(20)

  if (error) {
    console.error("Error fetching books:", error)
    return []
  }

  return (books || [])
    .map((book) => ({
      ...book,
      authors: book.book_authors?.map((ba) => ba.author).filter(Boolean) || [],
      editions: book.editions?.filter((edition) => edition.listings && edition.listings.length > 0) || [],
    }))
    .filter((book) => book.editions.length > 0)
}

function BookCard({ book }: { book: BookWithDetails }) {
  const firstEdition = book.editions[0]
  const hasForSale = firstEdition.listings.some((l) => l.type === "sale")
  const hasForLoan = firstEdition.listings.some((l) => l.type === "loan")
  const minPrice = Math.min(...firstEdition.listings.filter((l) => l.type === "sale").map((l) => l.price))
  const minDailyFee = Math.min(...firstEdition.listings.filter((l) => l.type === "loan").map((l) => l.daily_fee))
  const saleListingId = firstEdition.listings.find((l) => l.type === "sale")?.id

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
