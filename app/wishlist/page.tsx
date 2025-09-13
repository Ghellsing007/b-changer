import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import Link from "next/link"
import { AddToCartButton } from "@/components/add-to-cart-button"

export default async function WishlistPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get wishlist items
  const { data: wishlistItems } = await supabase
    .from("wishlists")
    .select(`
      id,
      books (
        id,
        title,
        isbn,
        cover_image_url,
        authors (name),
        categories (name),
        editions (
          id,
          price,
          condition,
          listings (
            id,
            type,
            price,
            loan_duration_days,
            profiles (
              id,
              full_name,
              location
            )
          )
        )
      )
    `)
    .eq("user_id", user.id)

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Mis Favoritos</h1>
      </div>

      {!wishlistItems || wishlistItems.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No tienes favoritos aún</h2>
          <p className="text-muted-foreground mb-4">Explora nuestro catálogo y guarda los libros que te interesen</p>
          <Button asChild>
            <Link href="/catalog">Explorar Catálogo</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item: any) => {
            const book = item.books
            const saleListings =
              book.editions?.flatMap((e: any) => e.listings?.filter((l: any) => l.type === "sale") || []) || []
            const loanListings =
              book.editions?.flatMap((e: any) => e.listings?.filter((l: any) => l.type === "loan") || []) || []

            const minSalePrice = saleListings.length > 0 ? Math.min(...saleListings.map((l: any) => l.price)) : null
            const minLoanPrice = loanListings.length > 0 ? Math.min(...loanListings.map((l: any) => l.price)) : null

            return (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="p-0">
                  <div className="aspect-[3/4] relative">
                    <img
                      src={
                        book.cover_image_url ||
                        `/placeholder.svg?height=300&width=225&query=${encodeURIComponent(book.title) || "/placeholder.svg"}`
                      }
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-lg mb-2 line-clamp-2">{book.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mb-2">
                    {book.authors?.map((a: any) => a.name).join(", ")}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {book.categories?.map((cat: any) => (
                      <Badge key={cat.name} variant="secondary" className="text-xs">
                        {cat.name}
                      </Badge>
                    ))}
                  </div>

                  <div className="space-y-2 mb-4">
                    {minSalePrice && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Comprar desde:</span>
                        <span className="font-semibold text-cyan-600">€{minSalePrice}</span>
                      </div>
                    )}
                    {minLoanPrice && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Prestar desde:</span>
                        <span className="font-semibold text-blue-600">€{minLoanPrice}/día</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button asChild variant="outline" className="flex-1 bg-transparent">
                      <Link href={`/catalog/${book.id}`}>Ver Detalles</Link>
                    </Button>
                    {saleListings.length > 0 && (
                      <AddToCartButton listingId={saleListings[0].id} size="sm" className="flex-1" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
