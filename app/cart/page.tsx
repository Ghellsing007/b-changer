import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart } from "lucide-react"
import Link from "next/link"
import { CartItemCard } from "@/components/cart-item-card"
import { CheckoutButton } from "@/components/checkout-button"

interface CartItemWithDetails {
  id: string
  quantity: number
  listing: {
    id: string
    type: "sale" | "loan"
    price: number
    daily_fee: number
    seller: { display_name: string; user_id: string }
    edition: {
      id: string
      format: string
      isbn: string
      book: {
        id: string
        title: string
        authors: { name: string }[]
      }
    }
  }
}

async function getCartItems(): Promise<{ items: CartItemWithDetails[]; total: number }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { items: [], total: 0 }

  // Get active cart
  const { data: cart } = await supabase.from("carts").select("id").eq("user_id", user.id).eq("is_active", true).single()

  if (!cart) return { items: [], total: 0 }

  // Get cart items with full details
  const { data: cartItems, error } = await supabase
    .from("cart_items")
    .select(`
      id,
      quantity,
      listing:listings(
        id,
        type,
        price,
        daily_fee,
        seller:profiles!seller_id(display_name, user_id),
        edition:editions(
          id,
          format,
          isbn,
          book:books(
            id,
            title,
            book_authors(
              author:authors(name)
            )
          )
        )
      )
    `)
    .eq("cart_id", cart.id)

  if (error) {
    console.error("Error fetching cart items:", error)
    return { items: [], total: 0 }
  }

  const items = (cartItems || [])
    .filter((item) => item.listing)
    .map((item) => ({
      ...item,
      listing: {
        ...item.listing,
        edition: {
          ...item.listing.edition,
          book: {
            ...item.listing.edition.book,
            authors: item.listing.edition.book.book_authors?.map((ba: any) => ba.author).filter(Boolean) || [],
          },
        },
      },
    }))

  const total = items.reduce((sum, item) => {
    return sum + item.listing.price * item.quantity
  }, 0)

  return { items, total }
}

export default async function CartPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { items, total } = await getCartItems()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Carrito de Compras</h1>
            <span className="text-muted-foreground">({items.length} artículos)</span>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Tu carrito está vacío</h2>
            <p className="text-muted-foreground mb-6">Explora nuestro catálogo y agrega algunos libros a tu carrito</p>
            <Button asChild>
              <Link href="/catalog">Explorar Catálogo</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <CartItemCard key={item.id} item={item} />
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Resumen del Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal ({items.length} artículos)</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Envío</span>
                      <span>Gratis</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <CheckoutButton items={items} total={total} />

                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href="/catalog">Continuar Comprando</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
