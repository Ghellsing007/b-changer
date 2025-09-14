export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="text-gray-600 mb-4">
        Panel principal - Autenticación desactivada para desarrollo
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <a href="/catalog" className="p-4 border rounded-lg hover:bg-gray-50">
          📚 Ir al Catálogo
        </a>
        <a href="/upload" className="p-4 border rounded-lg hover:bg-gray-50">
          📤 Subir Libro
        </a>
        <a href="/sell" className="p-4 border rounded-lg hover:bg-gray-50">
          💰 Vender Libro
        </a>
      </div>
    </div>
  )
}
