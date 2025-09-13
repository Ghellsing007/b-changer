"use client"

import { useState } from "react"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")
  const [priceRange, setPriceRange] = useState("")
  const [condition, setCondition] = useState("")
  const router = useRouter()

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (category) params.set("category", category)
    if (priceRange) params.set("price", priceRange)
    if (condition) params.set("condition", condition)

    router.push(`/catalog?${params.toString()}`)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar libros..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10 pr-4"
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[400px]">
            <SheetHeader>
              <SheetTitle>Filtros de Búsqueda</SheetTitle>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ficcion">Ficción</SelectItem>
                    <SelectItem value="no-ficcion">No Ficción</SelectItem>
                    <SelectItem value="academico">Académico</SelectItem>
                    <SelectItem value="infantil">Infantil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Rango de Precio</Label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cualquier precio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-10">€0 - €10</SelectItem>
                    <SelectItem value="10-25">€10 - €25</SelectItem>
                    <SelectItem value="25-50">€25 - €50</SelectItem>
                    <SelectItem value="50+">€50+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Estado</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cualquier estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nuevo">Nuevo</SelectItem>
                    <SelectItem value="como-nuevo">Como Nuevo</SelectItem>
                    <SelectItem value="bueno">Bueno</SelectItem>
                    <SelectItem value="aceptable">Aceptable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSearch} className="w-full">
                Aplicar Filtros
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
