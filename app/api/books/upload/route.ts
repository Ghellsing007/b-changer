import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

interface BookPayload {
  title: string
  author: string
  description: string
  category: string
  language?: string
}

function validatePayload(payload: Partial<BookPayload>): asserts payload is BookPayload {
  const requiredFields: Array<keyof BookPayload> = ["title", "author", "description", "category"]

  for (const field of requiredFields) {
    const value = payload[field]
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`El campo ${field} es obligatorio`)
    }
  }
}

export async function POST(request: Request) {
  try {
    const serverClient = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await serverClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const payload = (await request.json()) as Partial<BookPayload>
    validatePayload(payload)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase service configuration missing")
      return NextResponse.json({ error: "Configuración del servidor incompleta" }, { status: 500 })
    }

    const adminClient = createServiceClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const authorResult = await adminClient
      .from("authors")
      .upsert({ name: payload.author.trim() }, { onConflict: "name" })
      .select("id")
      .single()

    if (authorResult.error || !authorResult.data) {
      console.error("Error creating author", authorResult.error)
      return NextResponse.json({ error: "No se pudo crear el autor" }, { status: 500 })
    }

    const categoryResult = await adminClient
      .from("categories")
      .upsert({ name: payload.category.trim() }, { onConflict: "name" })
      .select("id")
      .single()

    if (categoryResult.error || !categoryResult.data) {
      console.error("Error creating category", categoryResult.error)
      return NextResponse.json({ error: "No se pudo crear la categoría" }, { status: 500 })
    }

    const bookResult = await adminClient
      .from("books")
      .insert({
        title: payload.title.trim(),
        description: payload.description.trim(),
        category_id: categoryResult.data.id,
      })
      .select("id")
      .single()

    if (bookResult.error || !bookResult.data) {
      console.error("Error creating book", bookResult.error)
      return NextResponse.json({ error: "No se pudo crear el libro" }, { status: 500 })
    }

    const bookAuthorResult = await adminClient
      .from("book_authors")
      .insert({
        book_id: bookResult.data.id,
        author_id: authorResult.data.id,
      })

    if (bookAuthorResult.error) {
      console.error("Error linking book author", bookAuthorResult.error)
      return NextResponse.json({ error: "No se pudo asociar el autor" }, { status: 500 })
    }

    const editionResult = await adminClient
      .from("editions")
      .insert({
        book_id: bookResult.data.id,
        format: "ebook",
        isbn: `PDF-${Date.now()}`,
        publication_date: new Date().toISOString().split("T")[0],
      })
      .select("id")
      .single()

    if (editionResult.error || !editionResult.data) {
      console.error("Error creating edition", editionResult.error)
      return NextResponse.json({ error: "No se pudo crear la edición" }, { status: 500 })
    }

    return NextResponse.json({
      bookId: bookResult.data.id,
      editionId: editionResult.data.id,
    })
  } catch (error) {
    console.error("Unexpected error creating book", error)
    const message = error instanceof Error ? error.message : "Error inesperado"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
