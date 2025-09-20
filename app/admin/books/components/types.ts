export interface Book {
  id: string
  title: string
  description: string
  created_at: string
  updated_at: string
  category?: {
    id: string
    name: string
  }
  authors: Array<{
    id: string
    name: string
  }>
  editions: Array<{
    id: string
    format: string
    isbn?: string
    publication_date?: string
    book_files: Array<{
      id: string
      file_type: 'pdf' | 'cover'
    }>
    listings: Array<{
      id: string
      is_active: boolean
      type: 'sale' | 'loan'
    }>
  }>
}

export interface BookTableProps {
  onEditBook?: (book: Book) => void
  onViewBook?: (book: Book) => void
}