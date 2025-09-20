"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table"
import { BookEditModal } from "./BookEditModal"
import { BookFilters } from "./filters"
import { BookPagination } from "./pagination"
import { getBookColumns } from "./columns"
import { loadBooks } from "./data"
import { Book, BookTableProps } from "./types"

export function BookTable({ onEditBook, onViewBook }: BookTableProps) {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const { toast } = useToast()

  // Cargar libros
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true)
        const data = await loadBooks()
        setBooks(data)
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

    fetchBooks()
  }, [toast])

  // Funciones para manejar edición
  const handleEditBook = (book: Book) => {
    setEditingBook(book)
    setEditModalOpen(true)
  }

  const handleBookUpdated = (updatedBook: Book) => {
    setBooks(prev => prev.map(book =>
      book.id === updatedBook.id ? updatedBook : book
    ))
    setEditingBook(null)
    setEditModalOpen(false)
  }

  // Definir columnas
  const columns = useMemo(() =>
    getBookColumns(onEditBook, onViewBook),
    [onEditBook, onViewBook]
  )

  // Configurar tabla
  const table = useReactTable({
    data: books,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
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
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Libros</CardTitle>
          <CardDescription>
            Administra todos los libros de la plataforma con filtros avanzados y paginación
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <BookFilters
            table={table}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
          />

          {/* Tabla */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
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
          <BookPagination table={table} />
        </CardContent>
      </Card>

      {/* Modal de edición */}
      <BookEditModal
        book={editingBook}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onBookUpdated={handleBookUpdated}
      />
    </>
  )
}