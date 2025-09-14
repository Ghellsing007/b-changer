import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Book, Users, Upload, FileText, Search, Heart } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* Background image overlay */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-10 z-0"
        style={{
          backgroundImage: "url('/images/library-bg.png')",
        }}
      />

      <div className="relative z-10">
        <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Book className="h-8 w-8 text-cyan-600" />
              <h1 className="text-xl font-bold text-slate-800">B-Changer</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-orange-600 font-medium">
                🔓 Autenticación desactivada para desarrollo
              </span>
              <Button asChild variant="ghost" className="text-slate-600 hover:text-cyan-600">
                <Link href="/auth/login">Iniciar Sesión</Link>
              </Button>
              <Button asChild className="bg-cyan-600 hover:bg-cyan-700 text-white">
                <Link href="/auth/sign-up">Registrarse</Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="relative py-24 px-4 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/images/library-bg.png')",
            }}
          />
          <div className="absolute inset-0 bg-cyan-50/30 backdrop-blur-sm" />

          <div className="container mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-slate-800 text-balance">
              Tu biblioteca digital personal
            </h2>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto text-pretty">
              Descubre, comparte y lee libros. Sube tus PDFs, intercambia con otros lectores y construye tu biblioteca
              ideal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg">
                <Link href="/catalog">📚 Explorar Biblioteca</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-cyan-200 text-cyan-700 hover:bg-cyan-50 bg-transparent"
              >
                <Link href="/upload">📤 Subir Libro</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mt-6">
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/orders">Pedidos</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/loans">Préstamos</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/sell">Vender</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/lend">Prestar</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-white/90 backdrop-blur-sm">
          <div className="container mx-auto">
            <h3 className="text-3xl font-bold text-center mb-12 text-slate-800">Todo lo que necesitas para leer</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="border-cyan-100 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-cyan-50 to-white">
                <CardHeader className="text-center pb-4">
                  <div className="h-16 w-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-cyan-600" />
                  </div>
                  <CardTitle className="text-slate-800">Descubre Libros</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-slate-600">
                    Explora miles de libros organizados por categorías y encuentra tu próxima lectura favorita
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-cyan-100 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-cyan-50 to-white">
                <CardHeader className="text-center pb-4">
                  <div className="h-16 w-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-cyan-600" />
                  </div>
                  <CardTitle className="text-slate-800">Sube tus PDFs</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-slate-600">
                    Carga tus libros digitales y portadas personalizadas para crear tu biblioteca personal
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-cyan-100 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-cyan-50 to-white">
                <CardHeader className="text-center pb-4">
                  <div className="h-16 w-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-cyan-600" />
                  </div>
                  <CardTitle className="text-slate-800">Lee en la App</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-slate-600">
                    Lector integrado con marcadores, notas y sincronización entre dispositivos
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-cyan-100 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-cyan-50 to-white">
                <CardHeader className="text-center pb-4">
                  <div className="h-16 w-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-cyan-600" />
                  </div>
                  <CardTitle className="text-slate-800">Intercambia</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-slate-600">
                    Presta y toma prestados libros con otros miembros de la comunidad
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-cyan-100 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-cyan-50 to-white">
                <CardHeader className="text-center pb-4">
                  <div className="h-16 w-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-8 w-8 text-cyan-600" />
                  </div>
                  <CardTitle className="text-slate-800">Favoritos</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-slate-600">
                    Guarda tus libros favoritos y crea listas personalizadas de lectura
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-cyan-100 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-cyan-50 to-white">
                <CardHeader className="text-center pb-4">
                  <div className="h-16 w-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Book className="h-8 w-8 text-cyan-600" />
                  </div>
                  <CardTitle className="text-slate-800">Compra y Vende</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-slate-600">
                    Marketplace seguro para comprar y vender libros físicos y digitales
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-gradient-to-r from-cyan-600 to-blue-600">
          <div className="container mx-auto text-center">
            <h3 className="text-3xl font-bold mb-6 text-white">Comienza tu aventura literaria</h3>
            <p className="text-xl text-cyan-100 mb-8 max-w-2xl mx-auto">
              Únete a miles de lectores que ya disfrutan de la mejor experiencia de lectura digital
            </p>
            <Button asChild size="lg" className="bg-white text-cyan-600 hover:bg-cyan-50 shadow-lg">
              <Link href="/auth/sign-up">Crear Cuenta Gratis</Link>
            </Button>
          </div>
        </section>

        <footer className="border-t py-8 px-4 bg-white">
          <div className="container mx-auto text-center text-slate-500">
            <p>&copy; 2024 B-Changer. Hecho con ❤️ para los amantes de los libros.</p>
            <p className="text-sm text-orange-600 mt-2">
              🔓 Modo desarrollo: Autenticación desactivada para facilitar las pruebas
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
