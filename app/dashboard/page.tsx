import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Book, ShoppingCart, Heart, User, Package, Clock, Star, Settings } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", data.user.id).single()

  const [
    { count: myListingsCount },
    { count: cartItemsCount },
    { count: wishlistCount },
    { count: activeLoansCount },
    { count: ordersCount },
    { data: recentOrders },
    { data: recentLoans },
  ] = await Promise.all([
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("seller_id", data.user.id),
    supabase.from("cart_items").select("*", { count: "exact", head: true }).eq("user_id", data.user.id),
    supabase.from("wishlists").select("*", { count: "exact", head: true }).eq("user_id", data.user.id),
    supabase
      .from("loans")
      .select("*", { count: "exact", head: true })
      .or(`borrower_id.eq.${data.user.id},lender_id.eq.${data.user.id}`)
      .in("status", ["reserved", "checked_out"]),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("user_id", data.user.id),
    supabase
      .from("orders")
      .select(`
      id, status, total_amount, created_at,
      order_items(
        quantity,
        listings(
          books(title)
        )
      )
    `)
      .eq("user_id", data.user.id)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("loans")
      .select(`
      id, status, created_at, due_date,
      listings(
        books(title)
      )
    `)
      .or(`borrower_id.eq.${data.user.id},lender_id.eq.${data.user.id}`)
      .order("created_at", { ascending: false })
      .limit(3),
  ])

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            B-Changer
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Hola, {profile?.display_name || data.user.email}</span>
            <form action={handleSignOut}>
              <Button variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Panel de Control</h2>
          <p className="text-muted-foreground">Bienvenido a tu marketplace de libros</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mis Libros</CardTitle>
              <Book className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myListingsCount || 0}</div>
              <p className="text-xs text-muted-foreground">Libros en tu inventario</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Carrito</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cartItemsCount || 0}</div>
              <p className="text-xs text-muted-foreground">Artículos en carrito</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favoritos</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wishlistCount || 0}</div>
              <p className="text-xs text-muted-foreground">Libros en tu wishlist</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Préstamos</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeLoansCount || 0}</div>
              <p className="text-xs text-muted-foreground">Préstamos activos</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordersCount || 0}</div>
              <p className="text-xs text-muted-foreground">Compras realizadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.role === "admin" ? "Admin" : "Usuario"}</div>
              <p className="text-xs text-muted-foreground">Nivel de cuenta</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Miembro desde</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profile?.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear()}
              </div>
              <p className="text-xs text-muted-foreground">Año de registro</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/catalog">Explorar Catálogo</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/sell">Vender un Libro</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/lend">Prestar un Libro</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/cart">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Ver Carrito
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/orders">
                  <Package className="h-4 w-4 mr-2" />
                  Mis Pedidos
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/loans">
                  <User className="h-4 w-4 mr-2" />
                  Mis Préstamos
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders && recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">
                          {order.order_items?.[0]?.listings?.books?.title || "Pedido"}
                          {order.order_items?.length > 1 && ` +${order.order_items.length - 1} más`}
                        </p>
                        <p className="text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
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
              <CardTitle>Préstamos Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentLoans && recentLoans.length > 0 ? (
                <div className="space-y-3">
                  {recentLoans.map((loan: any) => (
                    <div key={loan.id} className="text-sm">
                      <p className="font-medium">{loan.listings?.books?.title || "Préstamo"}</p>
                      <p className="text-muted-foreground">{new Date(loan.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground capitalize">{loan.status}</p>
                      {loan.due_date && (
                        <p className="text-xs text-muted-foreground">
                          Vence: {new Date(loan.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay préstamos recientes</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración de Perfil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nombre de Usuario</label>
                  <p className="text-sm text-muted-foreground">{profile?.display_name || "No configurado"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{data.user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Teléfono</label>
                  <p className="text-sm text-muted-foreground">{profile?.phone || "No configurado"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Dirección</label>
                  <p className="text-sm text-muted-foreground">{profile?.address || "No configurada"}</p>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
