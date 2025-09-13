import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100">
                <CheckCircle className="h-6 w-6 text-cyan-600" />
              </div>
              <CardTitle className="text-2xl">¡Cuenta Creada!</CardTitle>
              <CardDescription>Revisa tu email para confirmar tu cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Te hemos enviado un email de confirmación. Por favor, revisa tu bandeja de entrada y haz clic en el
                enlace para activar tu cuenta antes de iniciar sesión.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
