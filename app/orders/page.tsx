import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Calendar, DollarSign } from "lucide-react"
import Link from "next/link"

interface OrderWithDetails {
  id: string
  status: string
  payment_status: string
  total: number
  created_at: string
  order_items: {
    quantity: number
    unit_price: number
    edition: {
      book: {
        title: string
        authors: { name: string }[]
      }
    }
  }[]
}

async function getUserOrders(): Promise<OrderWithDetails[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      payment_status,
      total,
      created_at,
      order_items(
        quantity,
        unit_price,
        edition:editions(
          book:books(
            title,
            book_authors(
              author:authors(name)
            )
          )
        )
      )
    `)
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching orders:", error)
    return []
  }

  return (orders || []).map((order) => ({
    ...order,
    order_items: order.order_items.map((item) => ({
      ...item,
      edition: {
        book: {
          ...item.edition.book,
          authors: item.edition.book.book_authors?.map((ba: any) => ba.author).filter(Boolean) || [],
        },
      },
    })),
  }))
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

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const orders = await getUserOrders()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Mis Pedidos</h1>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No tienes pedidos aún</h2>
            <p className="text-muted-foreground mb-6">Cuando realices tu primera compra, aparecerá aquí</p>
            <Button asChild>
              <Link href="/catalog">Explorar Catálogo</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Pedido #{order.id.slice(0, 8)}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="flex gap-2">
                        {getStatusBadge(order.status)}
                        {getPaymentStatusBadge(order.payment_status)}
                      </div>
                      <div className="flex items-center gap-1 text-lg font-semibold">
                        <DollarSign className="h-4 w-4" />
                        {order.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {order.order_items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <div>
                          <span className="font-medium">{item.edition.book.title}</span>
                          <span className="text-muted-foreground ml-2">
                            por {item.edition.book.authors.map((a) => a.name).join(", ")}
                          </span>
                        </div>
                        <div className="text-right">
                          <span>
                            {item.quantity}x ${item.unit_price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button asChild variant="outline">
                      <Link href={`/orders/${order.id}`}>Ver Detalles</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
