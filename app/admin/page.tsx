import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Book, ShoppingCart, User, AlertTriangle, DollarSign, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminDashboard() {
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

  // Get admin statistics
  const [
    { count: totalUsers },
    { count: totalBooks },
    { count: totalListings },
    { count: totalOrders },
    { count: activeLoans },
    { count: overdueLoans },
    { data: recentOrders },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("books").select("*", { count: "exact", head: true }),
    supabase.from("listings").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("loans").select("*", { count: "exact", head: true }).in("status", ["reserved", "checked_out"]),
    supabase
      .from("loans")
      .select("*", { count: "exact", head: true })
      .eq("status", "checked_out")
      .lt("due_date", new Date().toISOString()),
    supabase
      .from("orders")
      .select(`
        id, status, total_amount, created_at,
        profiles(display_name),
        order_items(
          quantity,
          listings(
            books(title)
          )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("id, display_name, email, created_at, role")
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold">
              B-Changer
            </Link>
            <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Panel Usuario</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Panel de Administración</h2>
          <p className="text-muted-foreground">Gestiona tu plataforma B-Changer</p>
        </div>

        {/* Main Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">Usuarios registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Libros</CardTitle>
              <Book className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBooks || 0}</div>
              <p className="text-xs text-muted-foreground">Libros en catálogo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Anuncios Activos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalListings || 0}</div>
              <p className="text-xs text-muted-foreground">Libros en venta/préstamo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground">Compras realizadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Préstamos Activos</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeLoans || 0}</div>
              <p className="text-xs text-muted-foreground">Libros prestados actualmente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Préstamos Vencidos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueLoans || 0}</div>
              <p className="text-xs text-muted-foreground">Requieren atención</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground">Comisiones generadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full bg-transparent" size="sm">
                <Link href="/admin/users">Ver Todos los Usuarios</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent" size="sm">
                <Link href="/admin/users?filter=new">Usuarios Nuevos</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gestión de Contenido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full bg-transparent" size="sm">
                <Link href="/admin/books">Gestionar Libros</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent" size="sm">
                <Link href="/admin/listings">Gestionar Anuncios</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gestión de Pedidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full bg-transparent" size="sm">
                <Link href="/admin/orders">Ver Todos los Pedidos</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent" size="sm">
                <Link href="/admin/orders?status=pending">Pedidos Pendientes</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gestión de Préstamos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full bg-transparent" size="sm">
                <Link href="/admin/loans">Ver Todos los Préstamos</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent" size="sm">
                <Link href="/admin/loans?status=overdue">Préstamos Vencidos</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders && recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between text-sm border-b pb-2">
                      <div>
                        <p className="font-medium">
                          {order.order_items?.[0]?.listings?.books?.title || "Pedido"}
                          {order.order_items?.length > 1 && ` +${order.order_items.length - 1} más`}
                        </p>
                        <p className="text-muted-foreground">
                          {order.profiles?.display_name || "Usuario"} -{" "}
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${order.total_amount}</p>
                        <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay pedidos recientes</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usuarios Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentUsers && recentUsers.length > 0 ? (
                <div className="space-y-3">
                  {recentUsers.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between text-sm border-b pb-2">
                      <div>
                        <p className="font-medium">{user.display_name || "Usuario"}</p>
                        <p className="text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs capitalize">{user.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay usuarios recientes</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
