"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  // Obtener la URL de redirección
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  // Debug solo en cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🔥 LOGIN PAGE LOADED - redirect param:', window.location.search)
      console.log('🎯 REDIRECT TO:', redirectTo)
    }
  }, [redirectTo])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    console.log('🚀 LOGIN ATTEMPT:', { email: email.trim(), redirectTo })

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      console.log('📡 SUPABASE RESPONSE:', { hasData: !!data, hasError: !!error, error: error?.message })

      if (error) {
        console.log('❌ LOGIN FAILED:', error.message)
        setError("Email o contraseña incorrectos")
        setIsLoading(false)
        return
      }

      if (data.user) {
        console.log('✅ LOGIN SUCCESS! User:', data.user.id)
        console.log('🎯 REDIRECTING TO:', redirectTo)

        // Redirección inmediata y agresiva
        window.location.replace(redirectTo)
        return // No ejecutar código después de la redirección
      }

      console.log('⚠️ NO USER IN RESPONSE')
      setError("Login completado pero sin usuario")

    } catch (err) {
      console.log('💥 UNEXPECTED ERROR:', err)
      setError("Error de conexión")
    }

    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa a tu cuenta de B-Changer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Iniciando..." : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            ¿No tienes cuenta?{" "}
            <Link href="/auth/sign-up" className="text-blue-600 hover:underline">
              Regístrate
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
