import { BookUploadForm } from "@/components/book-upload-form"

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Comparte tu Libro</h1>
          <p className="text-slate-600">Sube tu PDF y compártelo con la comunidad</p>
        </div>
        <BookUploadForm />
      </div>
    </div>
  )
}
