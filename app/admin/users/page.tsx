import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import Link from "next/link"

export default async function AdminUsersPage() {
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

  // Get all users
  const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-2xl font-bold">
              B-Changer Admin
            </Link>
            <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">Usuarios</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">Administra todos los usuarios de la plataforma</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Todos los Usuarios ({users?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users && users.length > 0 ? (
                users.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{user.display_name || "Sin nombre"}</h3>
                        <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
                          {user.role === "admin" ? "Admin" : "Usuario"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Registrado: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                      {user.phone && <p className="text-xs text-muted-foreground">Teléfono: {user.phone}</p>}
                      {user.address && <p className="text-xs text-muted-foreground">Dirección: {user.address}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Ver Detalles
                      </Button>
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No hay usuarios registrados</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
