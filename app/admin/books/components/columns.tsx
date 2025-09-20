import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  Edit,
  Eye,
  FileText,
  ShoppingCart,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { Book } from "./types"

/**
 * Definición de columnas para la tabla de libros
 */
export function getBookColumns(
  onEditBook?: (book: Book) => void,
  onViewBook?: (book: Book) => void
): ColumnDef<Book>[] {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Título
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="max-w-xs truncate font-medium">
          {row.getValue("title")}
        </div>
      ),
    },
    {
      accessorKey: "authors",
      header: "Autor",
      cell: ({ row }) => {
        const authors = row.getValue("authors") as Book["authors"]
        return (
          <div className="max-w-xs truncate">
            {authors.map(a => a.name).join(", ")}
          </div>
        )
      },
      filterFn: (row, id, value) => {
        const authors = row.getValue(id) as Book["authors"]
        return authors.some(author =>
          author.name.toLowerCase().includes(value.toLowerCase())
        )
      },
    },
    {
      accessorKey: "category.name",
      header: "Categoría",
      cell: ({ row }) => {
        const category = row.original.category
        return category ? (
          <Badge variant="secondary">{category.name}</Badge>
        ) : (
          <span className="text-gray-400">Sin categoría</span>
        )
      },
      filterFn: (row, id, value) => {
        const category = row.original.category
        return !value || category?.name === value
      },
    },
    {
      id: "files",
      header: "Archivos",
      cell: ({ row }) => {
        const editions = row.original.editions
        const totalFiles = editions.reduce((acc, edition) =>
          acc + (edition.book_files?.length || 0), 0
        )
        const hasPdf = editions.some(edition =>
          edition.book_files?.some(file => file.file_type === 'pdf')
        )
        const hasCover = editions.some(edition =>
          edition.book_files?.some(file => file.file_type === 'cover')
        )

        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <FileText className={`h-4 w-4 ${hasPdf ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="text-sm">{totalFiles}</span>
            </div>
            <div className="flex gap-1">
              {hasPdf && <Badge variant="outline" className="text-xs">PDF</Badge>}
              {hasCover && <Badge variant="outline" className="text-xs">Portada</Badge>}
            </div>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        const editions = row.original.editions
        const totalFiles = editions.reduce((acc, edition) =>
          acc + (edition.book_files?.length || 0), 0
        )

        if (value === "with-files") return totalFiles > 0
        if (value === "without-files") return totalFiles === 0
        if (value === "with-pdf") return editions.some(edition =>
          edition.book_files?.some(file => file.file_type === 'pdf')
        )
        if (value === "with-cover") return editions.some(edition =>
          edition.book_files?.some(file => file.file_type === 'cover')
        )
        return true
      },
    },
    {
      id: "listings",
      header: "Listings",
      cell: ({ row }) => {
        const editions = row.original.editions
        const activeListings = editions.reduce((acc, edition) =>
          acc + (edition.listings?.filter(l => l.is_active).length || 0), 0
        )
        const totalListings = editions.reduce((acc, edition) =>
          acc + (edition.listings?.length || 0), 0
        )

        return (
          <div className="flex items-center gap-1">
            <ShoppingCart className="h-4 w-4 text-gray-400" />
            <span className="text-sm">
              {activeListings}/{totalListings}
            </span>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        const editions = row.original.editions
        const activeListings = editions.reduce((acc, edition) =>
          acc + (edition.listings?.filter(l => l.is_active).length || 0), 0
        )

        if (value === "active") return activeListings > 0
        if (value === "inactive") return activeListings === 0
        return true
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Creado
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">
          {new Date(row.getValue("created_at")).toLocaleDateString('es-ES')}
        </div>
      ),
      sortingFn: "datetime",
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const book = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onViewBook?.(book)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditBook?.(book)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar libro
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Gestionar archivos
              </DropdownMenuItem>
              <DropdownMenuItem>
                Gestionar listings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}