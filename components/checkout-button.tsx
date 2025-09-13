"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface CheckoutButtonProps {
  items: any[]
  total: number
}

export function CheckoutButton({ items, total }: CheckoutButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleCheckout = async () => {
    setIsProcessing(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuario no autenticado")

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          buyer_id: user.id,
          subtotal: total,
          total: total,
          status: "pending",
          payment_status: "pending",
        })
        .select("id")
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        listing_id: item.listing.id,
        seller_id: item.listing.seller.user_id,
        edition_id: item.listing.edition.id,
        quantity: item.quantity,
        unit_price: item.listing.price,
        subtotal: item.listing.price * item.quantity,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      // Clear cart
      const { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()

      if (cart) {
        await supabase.from("cart_items").delete().eq("cart_id", cart.id)
      }

      toast({
        title: "¡Pedido creado!",
        description: "Tu pedido ha sido procesado exitosamente",
      })

      router.push(`/orders/${order.id}`)
    } catch (error) {
      console.error("Error during checkout:", error)
      toast({
        title: "Error",
        description: "No se pudo procesar el pedido. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Button onClick={handleCheckout} disabled={isProcessing || items.length === 0} className="w-full">
      {isProcessing ? "Procesando..." : "Proceder al Pago"}
    </Button>
  )
}
