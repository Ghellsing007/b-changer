import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Calendar, User, Book } from "lucide-react"
import Link from "next/link"

interface OrderDetails {
  id: string
  status: string
  payment_status: string
  subtotal: number
  total: number
  created_at: string
  updated_at: string
  order_items: {
    id: string
    quantity: number
    unit_price: number
    subtotal: number
    seller: { display_name: string }
    edition: {
      format: string
      isbn: string
      book: {
        id: string
        title: string
        authors: { name: string }[]
      }
    }
  }[]
}

async function getOrderDetails(orderId: string): Promise<OrderDetails | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      payment_status,
      subtotal,
      total,
      created_at,
      updated_at,
      order_items(
        id,
        quantity,
        unit_price,
        subtotal,
        seller:profiles!seller_id(display_name),
        edition:editions(
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
    .eq("id", orderId)
    .eq("buyer_id", user.id)
    .single()

  if (error) {
    console.error("Error fetching order details:", error)
    return null
  }

  return {
    ...order,
    order_items: order.order_items.map((item) => ({
      ...item,
      edition: {
        ...item.edition,
        book: {
          ...item.edition.book,
          authors: item.edition.book.book_authors?.map((ba: any) => ba.author).filter(Boolean) || [],
        },
      },
    })),
  }
}

function getStatusBadge(status: string) {
  const variants = {
    pending: "secondary",
    paid: "default",
    shipped: "default",
    delivered: "default",
    cancelled: "destructive",
  } as const

  const labels = {
    pending: "Pendiente",
    paid: "Pagado",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
  }

  return (
    <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
      {labels[status as keyof typeof labels] || status}
    </Badge>
  )
}

function getPaymentStatusBadge(status: string) {
  const variants = {
    pending: "secondary",
    paid: "default",
    failed: "destructive",
    refunded: "outline",
  } as const

  const labels = {
    pending: "Pendiente",
    paid: "Pagado",
    failed: "Fallido",
    refunded: "Reembolsado",
  }

  return (
    <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
      {labels[status as keyof typeof labels] || status}
    </Badge>
  )
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const order = await getOrderDetails(id)
  if (!order) {
    notFound()
  }

  const formatType = (format: string) => {
    const formats = {
      paperback: "Tapa Blanda",
      hardcover: "Tapa Dura",
      ebook: "Libro Electrónico",
      audiobook: "Audiolibro",
    }
    return formats[format as keyof typeof formats] || format
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/orders" className="hover:text-foreground">
              Mis Pedidos
            </Link>
            <span>/</span>
            <span>Pedido #{order.id.slice(0, 8)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Realizado el {new Date(order.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {getStatusBadge(order.status)}
              {getPaymentStatusBadge(order.payment_status)}
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Artículos del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.order_items.map((item) => (
                  <div key={item.id}>
                    <div className="flex gap-4">
                      <div className="w-16 h-20 bg-muted rounded flex items-center justify-center">
                        <Book className="h-6 w-6 text-muted-foreground" />
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <Link href={`/catalog/${item.edition.book.id}`} className="font-semibold hover:underline">
                              {item.edition.book.title}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {item.edition.book.authors.map((a) => a.name).join(", ")}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">{formatType(item.edition.format)}</Badge>
                              <span className="text-xs text-muted-foreground">ISBN: {item.edition.isbn}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <User className="h-3 w-3" />
                              <span>Vendido por {item.seller.display_name}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-semibold">${item.subtotal.toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.quantity}x ${item.unit_price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Estado del Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div>
                      <div className="font-medium">Pedido realizado</div>
                      <div className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</div>
                    </div>
                  </div>

                  {order.status !== "pending" && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div>
                        <div className="font-medium">Estado actualizado</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(order.updated_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Envío</span>
                    <span>Gratis</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/orders">Ver Todos los Pedidos</Link>
                </Button>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/catalog">Continuar Comprando</Link>
                </Button>
                {order.status === "pending" && (
                  <Button variant="destructive" className="w-full">
                    Cancelar Pedido
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
