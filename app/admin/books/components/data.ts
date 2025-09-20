import { createClient } from "@/lib/supabase/client"
import { Book } from "./types"

/**
 * Carga libros con todas las relaciones desde Supabase
 */
export async function loadBooks(): Promise<Book[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('books')
    .select(`
      *,
      category:categories(id, name),
      book_authors(
        authors(id, name)
      ),
      editions(
        id,
        format,
        isbn,
        publication_date,
        book_files(id, file_type),
        listings(id, is_active, type)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Transformar datos para el formato esperado
  const transformedBooks: Book[] = data.map((book: any) => ({
    ...book,
    authors: book.book_authors?.map((ba: any) => ba.authors) || [],
    editions: book.editions || []
  }))

  return transformedBooks
}