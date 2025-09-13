import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SellBookForm } from "@/components/sell-book-form"

export default async function SellPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Vender un Libro</h1>
          <p className="text-muted-foreground">Agrega tu libro al marketplace y comienza a vender</p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <SellBookForm />
        </div>
      </main>
    </div>
  )
}
