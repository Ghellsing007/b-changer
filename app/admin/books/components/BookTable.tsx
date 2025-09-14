"use client"

import { useState, useEffect, useMemo } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Eye,
  FileText,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Book {
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
      file_name: string
      file_path: string
      file_size: number
    }>
    listings: Array<{
      id: string
      type: 'sale' | 'loan'
      price?: number
      daily_fee?: number
      is_active: boolean
    }>
  }>
}

interface BookTableProps {
  onEditBook?: (book: Book) => void
  onViewBook?: (book: Book) => void
}

export function BookTable({ onEditBook, onViewBook }: BookTableProps) {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const { toast } = useToast()

  // Cargar libros con todas las relaciones
  const loadBooks = async () => {
    try {
      setLoading(true)
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
            book_files(id, file_type, file_name, file_path, file_size),
            listings(id, type, price, daily_fee, is_active)
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

      setBooks(transformedBooks)
    } catch (error) {
      console.error('Error loading books:', error)
      toast({
        title: "Error",
        description: "Error al cargar los libros.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBooks()
  }, [])

  // Definir columnas
  const columns = useMemo<ColumnDef<Book>[]>(() => [
    {
      accessorKey: "title",
      header: "Título",
      cell: ({ row }) => (
        <div className="font-medium max-w-xs truncate">
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
    },
    {
      accessorKey: "category",
      header: "Categoría",
      cell: ({ row }) => {
        const category = row.getValue("category") as Book["category"]
        return category ? (
          <Badge variant="secondary">{category.name}</Badge>
        ) : (
          <span className="text-gray-400">Sin categoría</span>
        )
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

        return (
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{totalFiles}</span>
          </div>
        )
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

        return (
          <div className="flex items-center gap-1">
            <ShoppingCart className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{activeListings}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Creado",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"))
        return (
          <div className="text-sm text-gray-500">
            {date.toLocaleDateString('es-ES')}
          </div>
        )
      },
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
  ], [onEditBook, onViewBook])

  const table = useReactTable({
    data: books,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando libros...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Libros</CardTitle>
        <CardDescription>
          Administra todos los libros de la plataforma
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filtros y búsqueda */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar libros..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(String(event.target.value))}
                className="pl-8 w-64"
              />
            </div>
            <Select
              value={(table.getColumn("category")?.getFilterValue() as string) ?? ""}
              onValueChange={(value) => {
                table.getColumn("category")?.setFilterValue(value === "all" ? "" : value)
              }}
            >
              <SelectTrigger className="w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Ficción">Ficción</SelectItem>
                <SelectItem value="No Ficción">No Ficción</SelectItem>
                <SelectItem value="Ciencia">Ciencia</SelectItem>
                <SelectItem value="Tecnología">Tecnología</SelectItem>
                <SelectItem value="Historia">Historia</SelectItem>
                <SelectItem value="Biografías">Biografías</SelectItem>
                <SelectItem value="Romance">Romance</SelectItem>
                <SelectItem value="Misterio">Misterio</SelectItem>
                <SelectItem value="Fantasía">Fantasía</SelectItem>
                <SelectItem value="Ciencia Ficción">Ciencia Ficción</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} de{" "}
            {table.getFilteredRowModel().rows.length} libros
          </div>
        </div>

        {/* Tabla */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No se encontraron libros.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between px-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Filas por página</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Página {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Ir a primera página</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Ir a página anterior</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Ir a página siguiente</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Ir a última página</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}