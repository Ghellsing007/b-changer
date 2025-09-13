"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Minus } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface CartItemWithDetails {
  id: string
  quantity: number
  listing: {
    id: string
    type: "sale" | "loan"
    price: number
    daily_fee: number
    seller: { display_name: string; user_id: string }
    edition: {
      id: string
      format: string
      isbn: string
      book: {
        id: string
        title: string
        authors: { name: string }[]
      }
    }
  }
}

interface CartItemCardProps {
  item: CartItemWithDetails
}

export function CartItemCard({ item }: CartItemCardProps) {
  const [quantity, setQuantity] = useState(item.quantity)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const updateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1) return

    setIsUpdating(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("cart_items").update({ quantity: newQuantity }).eq("id", item.id)

      if (error) throw error

      setQuantity(newQuantity)
      router.refresh()
    } catch (error) {
      console.error("Error updating quantity:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la cantidad",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const removeItem = async () => {
    setIsUpdating(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("cart_items").delete().eq("id", item.id)

      if (error) throw error

      toast({
        title: "Artículo eliminado",
        description: "El libro ha sido eliminado de tu carrito",
      })
      router.refresh()
    } catch (error) {
      console.error("Error removing item:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el artículo",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const formatType =
    item.listing.format === "paperback"
      ? "Tapa Blanda"
      : item.listing.format === "hardcover"
        ? "Tapa Dura"
        : item.listing.format === "ebook"
          ? "Libro Electrónico"
          : "Audiolibro"

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-4">
          <div className="w-16 h-20 bg-muted rounded flex items-center justify-center">
            <span className="text-xs text-muted-foreground">📚</span>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <Link href={`/catalog/${item.listing.edition.book.id}`} className="font-semibold hover:underline">
                  {item.listing.edition.book.title}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {item.listing.edition.book.authors.map((a) => a.name).join(", ")}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{formatType}</Badge>
                  <span className="text-xs text-muted-foreground">Vendido por {item.listing.seller.display_name}</span>
                </div>
              </div>

              <Button variant="ghost" size="sm" onClick={removeItem} disabled={isUpdating}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuantity(quantity - 1)}
                  disabled={quantity <= 1 || isUpdating}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center">{quantity}</span>
                <Button variant="outline" size="sm" onClick={() => updateQuantity(quantity + 1)} disabled={isUpdating}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="text-right">
                <div className="font-semibold">${(item.listing.price * quantity).toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">${item.listing.price.toFixed(2)} cada uno</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
