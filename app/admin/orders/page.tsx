import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Package, Clock, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

export default async function AdminOrdersPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", data.user.id).single()
  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  // Get all orders with related data
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      profiles(display_name, email),
      order_items(
        quantity,
        price,
        listings(
          books(title, isbn)
        )
      )
    `)
    .order("created_at", { ascending: false })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "processing":
        return <Package className="h-4 w-4" />
      case "shipped":
        return <Package className="h-4 w-4" />
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "processing":
        return "default"
      case "shipped":
        return "default"
      case "delivered":
        return "default"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-2xl font-bold">
              B-Changer Admin
            </Link>
            <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">Pedidos</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Gestión de Pedidos</h2>
          <p className="text-muted-foreground">Administra todos los pedidos de la plataforma</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Todos los Pedidos ({orders?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders && orders.length > 0 ? (
                orders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">Pedido #{order.id.slice(0, 8)}</h3>
                        <Badge variant={getStatusColor(order.status) as any} className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Cliente: {order.profiles?.display_name || order.profiles?.email || "Usuario"}
                      </p>
                      <p className="text-sm text-muted-foreground mb-1">
                        Total: ${order.total_amount} | Artículos: {order.order_items?.length || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Fecha: {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      {order.order_items && order.order_items.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">
                            Libros: {order.order_items.map((item: any) => item.listings?.books?.title).join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Ver Detalles
                      </Button>
                      <Button variant="outline" size="sm">
                        Actualizar Estado
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No hay pedidos registrados</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
