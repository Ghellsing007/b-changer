"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AlertCircle, CheckCircle, Mail, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const validateEmail = (email: string): string | null => {
    if (!email) return "Ingresa tu email"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return "Ingresa un email válido"
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        switch (error.message) {
          case 'User not found':
            setError("No encontramos una cuenta con ese email")
            break
          default:
            setError(`Error al enviar email: ${error.message}`)
        }
        return
      }

      setSuccess("¡Email enviado! Revisa tu bandeja de entrada para restablecer tu contraseña.")
    } catch (error: unknown) {
      setError("Error de conexión. Verifica tu conexión a internet.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Recuperar Contraseña</CardTitle>
              <CardDescription>
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Mensajes de éxito/error */}
                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Campo Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {/* Botón de envío */}
                <Button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-700 h-12 text-lg font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Enviar Email de Recuperación"}
                </Button>

                {/* Enlaces */}
                <div className="space-y-2 text-center text-sm">
                  <div>
                    <Button
                      variant="ghost"
                      onClick={() => router.back()}
                      className="text-cyan-600 hover:text-cyan-700"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Volver
                    </Button>
                  </div>
                  <div>
                    ¿Recuerdas tu contraseña?{" "}
                    <Link
                      href="/auth/login"
                      className="text-cyan-600 hover:text-cyan-700 underline underline-offset-4"
                    >
                      Iniciar Sesión
                    </Link>
                  </div>
                  <div>
                    ¿No tienes cuenta?{" "}
                    <Link
                      href="/auth/sign-up"
                      className="text-cyan-600 hover:text-cyan-700 underline underline-offset-4"
                    >
                      Regístrate
                    </Link>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}