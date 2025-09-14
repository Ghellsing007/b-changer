"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Book,
  FileText,
  ShoppingCart,
  Users,
  TrendingUp,
  Plus,
  Settings,
  BarChart3,
  Shield
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface DashboardStats {
  totalBooks: number
  booksWithFiles: number
  activeListings: number
  totalUsers: number
}

export default function AdminBooksPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    booksWithFiles: 0,
    activeListings: 0,
    totalUsers: 0
  })
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    checkPermissionsAndLoadStats()
  }, [])

  const checkPermissionsAndLoadStats = async () => {
    try {
      const supabase = createClient()

      // Verificar permisos del usuario
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/auth/login')
        return
      }

      // Obtener perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para acceder al panel de administración.",
          variant: "destructive"
        })
        router.push('/')
        return
      }

      // Verificar rol
      if (!['admin', 'staff'].includes(profile.role)) {
        toast({
          title: "Acceso denegado",
          description: "Solo administradores y staff pueden acceder a esta sección.",
          variant: "destructive"
        })
        router.push('/')
        return
      }

      setUserRole(profile.role)

      // Cargar estadísticas
      await loadStats()

    } catch (error) {
      console.error('Error checking permissions:', error)
      toast({
        title: "Error",
        description: "Error al verificar permisos.",
        variant: "destructive"
      })
      router.push('/')
    }
  }

  const loadStats = async () => {
    try {
      const supabase = createClient()

      // Estadísticas en paralelo
      const [
        { count: totalBooks },
        { count: booksWithFiles },
        { count: activeListings },
        { count: totalUsers }
      ] = await Promise.all([
        // Total de libros
        supabase.from('books').select('*', { count: 'exact', head: true }),
        // Libros con archivos
        supabase.from('book_files').select('edition_id', { count: 'exact', head: true }),
        // Listings activos
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('is_active', true),
        // Total de usuarios
        supabase.from('profiles').select('*', { count: 'exact', head: true })
      ])

      setStats({
        totalBooks: totalBooks || 0,
        booksWithFiles: booksWithFiles || 0,
        activeListings: activeListings || 0,
        totalUsers: totalUsers || 0
      })

    } catch (error) {
      console.error('Error loading stats:', error)
      toast({
        title: "Error",
        description: "Error al cargar estadísticas.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-cyan-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Panel de Administración</h1>
                <p className="text-sm text-gray-500">Gestión de libros y contenido</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-cyan-700 border-cyan-300">
                {userRole === 'admin' ? 'Administrador' : 'Staff'}
              </Badge>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                size="sm"
              >
                Volver al catálogo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Libros</CardTitle>
              <Book className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBooks}</div>
              <p className="text-xs text-muted-foreground">
                Libros registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con Archivos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.booksWithFiles}</div>
              <p className="text-xs text-muted-foreground">
                Libros descargables
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Listings Activos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeListings}</div>
              <p className="text-xs text-muted-foreground">
                Para venta/préstamo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Usuarios registrados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="books" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="books">📚 Libros</TabsTrigger>
            <TabsTrigger value="files">📁 Archivos</TabsTrigger>
            <TabsTrigger value="listings">💰 Listings</TabsTrigger>
            <TabsTrigger value="stats">📊 Estadísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="books" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gestión de Libros</CardTitle>
                    <CardDescription>
                      Administra todos los libros de la plataforma
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Libro
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Book className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Tabla de libros próximamente</p>
                  <p className="text-sm">Aquí podrás ver, editar y gestionar todos los libros.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Archivos</CardTitle>
                <CardDescription>
                  Administra PDFs y portadas de libros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Gestor de archivos próximamente</p>
                  <p className="text-sm">Aquí podrás subir, cambiar y eliminar archivos de libros.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Listings</CardTitle>
                <CardDescription>
                  Administra precios y disponibilidad de venta/préstamo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Gestor de listings próximamente</p>
                  <p className="text-sm">Aquí podrás configurar precios y condiciones de venta.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas y Reportes</CardTitle>
                <CardDescription>
                  Métricas y análisis del rendimiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Estadísticas próximamente</p>
                  <p className="text-sm">Aquí podrás ver reportes y análisis detallados.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}