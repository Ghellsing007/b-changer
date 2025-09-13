"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AddToCartButtonProps {
  listingId: string
  quantity?: number
  className?: string
  children?: React.ReactNode
}

export function AddToCartButton({ listingId, quantity = 1, className, children }: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const addToCart = async () => {
    setIsAdding(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      // Get or create active cart
      let { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()

      if (!cart) {
        const { data: newCart, error: cartError } = await supabase
          .from("carts")
          .insert({ user_id: user.id })
          .select("id")
          .single()

        if (cartError) throw cartError
        cart = newCart
      }

      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cart.id)
        .eq("listing_id", listingId)
        .single()

      if (existingItem) {
        // Update quantity
        const { error: updateError } = await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + quantity })
          .eq("id", existingItem.id)

        if (updateError) throw updateError
      } else {
        // Add new item
        const { error: insertError } = await supabase.from("cart_items").insert({
          cart_id: cart.id,
          listing_id: listingId,
          quantity: quantity,
        })

        if (insertError) throw insertError
      }

      toast({
        title: "¡Agregado al carrito!",
        description: "El libro ha sido agregado a tu carrito de compras",
      })

      router.refresh()
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar el libro al carrito",
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Button onClick={addToCart} disabled={isAdding} className={className}>
      {isAdding ? (
        "Agregando..."
      ) : children ? (
        children
      ) : (
        <>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Agregar al Carrito
        </>
      )}
    </Button>
  )
}

export default AddToCartButton
