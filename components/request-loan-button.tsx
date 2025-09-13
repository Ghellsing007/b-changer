"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RequestLoanButtonProps {
  listingId: string
  maxDays?: number
  dailyFee: number
  className?: string
  children?: React.ReactNode
}

export function RequestLoanButton({ listingId, maxDays, dailyFee, className, children }: RequestLoanButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [days, setDays] = useState(maxDays ? Math.min(7, maxDays) : 7)
  const [isRequesting, setIsRequesting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const requestLoan = async () => {
    setIsRequesting(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      // Get listing details to find lender
      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .select("seller_id")
        .eq("id", listingId)
        .single()

      if (listingError) throw listingError

      // Create loan request
      const { error: loanError } = await supabase.from("loans").insert({
        listing_id: listingId,
        lender_id: listing.seller_id,
        borrower_id: user.id,
        status: "reserved",
        days: days,
        daily_fee: dailyFee,
        fine_amount: 0,
      })

      if (loanError) throw loanError

      toast({
        title: "¡Solicitud enviada!",
        description: "Tu solicitud de préstamo ha sido enviada al propietario del libro.",
      })

      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error requesting loan:", error)
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud de préstamo",
        variant: "destructive",
      })
    } finally {
      setIsRequesting(false)
    }
  }

  const totalCost = days * dailyFee

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={className}>
          {children || (
            <>
              <BookOpen className="h-4 w-4 mr-2" />
              Solicitar Préstamo
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar Préstamo</DialogTitle>
          <DialogDescription>Especifica por cuántos días quieres tomar prestado este libro</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="days">Días de préstamo</Label>
            <Input
              id="days"
              type="number"
              min="1"
              max={maxDays || 365}
              value={days}
              onChange={(e) => setDays(Number.parseInt(e.target.value) || 1)}
            />
            {maxDays && <p className="text-sm text-muted-foreground">Máximo permitido: {maxDays} días</p>}
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span>Costo total:</span>
              <span className="font-semibold text-lg">${totalCost.toFixed(2)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              ${dailyFee.toFixed(2)} × {days} día{days > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={requestLoan} disabled={isRequesting}>
            {isRequesting ? "Enviando..." : "Enviar Solicitud"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
