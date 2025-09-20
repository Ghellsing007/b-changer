import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Book, Calendar, User, Package, Heart, Clock, ShoppingCart, BookOpen } from "lucide-react"
import { AddToCartButton } from "@/components/add-to-cart-button"
import { RequestLoanButton } from "@/components/request-loan-button"
import Link from "next/link"
import { notFound } from "next/navigation"

interface BookDetails {
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
      max_days: number
      seller: { display_name: string; user_id: string }
      created_at: string
    }[]
  }[]
}

async function getBookDetails(id: string): Promise<BookDetails | null> {
  const supabase = await createClient()

  const { data: book, error } = await supabase
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
          max_days,
          created_at,
          seller:profiles!seller_id(display_name, user_id)
        )
      )
    `)
    .eq("id", id)
    .eq("editions.listings.is_active", true)
    .single()

  if (error) {
    console.error("Error fetching book details:", error)
    return null
  }

  return {
    ...book,
    authors: book.book_authors?.map((ba) => ba.author).filter(Boolean) || [],
    editions: book.editions || [],
  }
}

function ListingCard({ listing, bookTitle }: { listing: any; bookTitle: string }) {
  const isSale = listing.type === "sale"

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300 border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge
            variant={isSale ? "default" : "secondary"}
            className={
              isSale
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0"
                : "bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 border-0"
            }
          >
            {isSale ? "En Venta" : "En Préstamo"}
          </Badge>
          <div className="text-right">
            {isSale ? (
              <div className="text-2xl font-bold text-cyan-600">${listing.price}</div>
            ) : (
              <div>
                <div className="text-2xl font-bold text-cyan-600">${listing.daily_fee}/día</div>
                {listing.max_days && (
                  <div className="text-sm text-muted-foreground">Máximo {listing.max_days} días</div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Vendido por {listing.seller.display_name}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>
              {listing.quantity} disponible{listing.quantity > 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Publicado {new Date(listing.created_at).toLocaleDateString()}</span>
          </div>

          <Separator />

          <div className="flex gap-2">
            {isSale ? (
              <AddToCartButton
                listingId={listing.id}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Comprar Ahora
              </AddToCartButton>
            ) : (
              <RequestLoanButton
                listingId={listing.id}
                maxDays={listing.max_days}
                dailyFee={listing.daily_fee}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Pedir Prestado
              </RequestLoanButton>
            )}
            <Button
              variant="outline"
              size="icon"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 bg-transparent"
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const book = await getBookDetails(id)

  if (!book) {
    notFound()
  }

  const allListings = book.editions.flatMap((edition) => edition.listings.map((listing) => ({ ...listing, edition })))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-white/80 mb-2">
            <Link href="/catalog" className="hover:text-white transition-colors">
              Catálogo
            </Link>
            <span>/</span>
            <span className="text-white">{book.title}</span>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg">
              <CardContent className="p-6">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  {book.title}
                </h1>
                <p className="text-xl text-gray-600 mb-4">{book.authors.map((a) => a.name).join(", ")}</p>
                {book.category && (
                  <Badge
                    variant="secondary"
                    className="mb-4 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 border-0"
                  >
                    {book.category.name}
                  </Badge>
                )}
                <p className="text-gray-700 leading-relaxed">{book.description}</p>
              </CardContent>
            </Card>

            {/* Editions */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Ediciones Disponibles</h2>
              <div className="space-y-4">
                {book.editions.map((edition) => (
                  <Card
                    key={edition.id}
                    className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-800">
                        {edition.format === "paperback" && "Tapa Blanda"}
                        {edition.format === "hardcover" && "Tapa Dura"}
                        {edition.format === "ebook" && "Libro Electrónico"}
                        {edition.format === "audiobook" && "Audiolibro"}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {edition.publisher?.name} • {edition.isbn}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(edition.publication_date).getFullYear()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Book className="h-4 w-4" />
                          <span>ISBN: {edition.isbn}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Listings Sidebar */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Ofertas Disponibles</h2>
              {allListings.length === 0 ? (
                <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-md">
                  <CardContent className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay ofertas disponibles para este libro</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {allListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} bookTitle={book.title} />
                  ))}
                </div>
              )}
            </div>

            {/* ¿Tienes este libro? */}
            <Card className="bg-gradient-to-br from-cyan-50 to-blue-100 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-cyan-800">¿Tienes este libro?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0"
                >
                  <Link href={`/upload?book=${book.id}&title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.authors.map(a => a.name).join(', '))}&category=${encodeURIComponent(book.category?.name || '')}`}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Vender tu Copia
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0"
                >
                  <Link href={`/upload?book=${book.id}&title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.authors.map(a => a.name).join(', '))}&category=${encodeURIComponent(book.category?.name || '')}`}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Prestarlo
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Subir este libro - Solo si no hay ofertas disponibles */}
            {allListings.length === 0 && (
              <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-amber-800 flex items-center gap-2">
                    <Book className="h-5 w-5" />
                    ¿Quieres subir este libro?
                  </CardTitle>
                  <CardDescription className="text-amber-700">
                    Si tienes el PDF o una versión digital, puedes compartirla con la comunidad.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0"
                  >
                    <Link href={`/upload?book=${book.id}&title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.authors.map(a => a.name).join(', '))}&category=${encodeURIComponent(book.category?.name || '')}`}>
                      <Book className="h-4 w-4 mr-2" />
                      Subir este Libro
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    <Link href="/suggestions">
                      <Package className="h-4 w-4 mr-2" />
                      Ver Sugerencias
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
