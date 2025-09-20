import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"
import { Table } from "@tanstack/react-table"

interface BookFiltersProps {
  table: Table<any>
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
}

/**
 * Componente de filtros para la tabla de libros
 */
export function BookFilters({ table, globalFilter, onGlobalFilterChange }: BookFiltersProps) {
  return (
    <div className="space-y-4 py-4">
      {/* Búsqueda global */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, autor o ISBN..."
            value={globalFilter ?? ""}
            onChange={(event) => onGlobalFilterChange(String(event.target.value))}
            className="pl-8"
          />
        </div>
      </div>

      {/* Filtros específicos */}
      <div className="flex items-center space-x-2 flex-wrap gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select
          value={(table.getColumn("category.name")?.getFilterValue() as string) ?? ""}
          onValueChange={(value) =>
            table.getColumn("category.name")?.setFilterValue(value)
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las categorías</SelectItem>
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

        <Select
          value={(table.getColumn("files")?.getFilterValue() as string) ?? ""}
          onValueChange={(value) =>
            table.getColumn("files")?.setFilterValue(value)
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Archivos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="with-files">Con archivos</SelectItem>
            <SelectItem value="without-files">Sin archivos</SelectItem>
            <SelectItem value="with-pdf">Con PDF</SelectItem>
            <SelectItem value="with-cover">Con portada</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={(table.getColumn("listings")?.getFilterValue() as string) ?? ""}
          onValueChange={(value) =>
            table.getColumn("listings")?.setFilterValue(value)
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Listings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="active">Con listings activos</SelectItem>
            <SelectItem value="inactive">Sin listings activos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Estadísticas */}
      <div className="text-sm text-muted-foreground">
        {table.getFilteredRowModel().rows.length} de {table.getFilteredRowModel().rows.length} libros
      </div>
    </div>
  )
}