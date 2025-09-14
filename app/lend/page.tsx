export default function LendPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Prestar Libro</h1>
      <p className="text-gray-600 mb-4">
        Presta tus libros - Autenticación desactivada para desarrollo
      </p>
      <div className="text-center py-12">
        <p className="text-gray-500">Funcionalidad de préstamo próximamente...</p>
        <a href="/upload" className="text-blue-600 hover:underline mt-4 inline-block">
          📤 Ir a subir libro
        </a>
      </div>
    </div>
  )
}
