import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookSuggestionForm } from "@/components/book-suggestion-form"
import { ThumbsUp, ThumbsDown, Lightbulb, TrendingUp } from "lucide-react"
import { Suspense } from "react"

interface BookSuggestion {
  id: string
  title: string
  author: string
  description?: string
  category: string
  language: string
  votes: number
  status: string
  created_at: string
  suggested_by: string
}

async function getSuggestions(): Promise<BookSuggestion[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('book_suggestions')
    .select('*')
    .eq('status', 'pending')
    .order('votes', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching suggestions:', error)
    return []
  }

  return data || []
}

function SuggestionCard({ suggestion }: { suggestion: BookSuggestion }) {
  return (
    <Card className="h-full flex flex-col bg-gradient-to-br from-white to-amber-50 hover:shadow-xl transition-all duration-300 border-amber-100">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 text-gray-800">{suggestion.title}</CardTitle>
            <CardDescription className="mt-1 text-gray-600">
              por {suggestion.author}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-100 text-amber-800 border-amber-300">
              <TrendingUp className="h-3 w-3 mr-1" />
              {suggestion.votes}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            {suggestion.category}
          </Badge>
          <Badge variant="outline" className="border-amber-300 text-amber-700">
            {suggestion.language}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0">
        {suggestion.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{suggestion.description}</p>
        )}

        <div className="mt-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-amber-300 hover:bg-amber-50"
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            Votar (+)
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-amber-300 hover:bg-amber-50"
          >
            <ThumbsDown className="h-4 w-4 mr-1" />
            Votar (-)
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SuggestionsGrid({ suggestions }: { suggestions: BookSuggestion[] }) {
  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12">
        <Lightbulb className="h-12 w-12 text-amber-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay sugerencias aún</h3>
        <p className="text-muted-foreground mb-4">¡Sé el primero en sugerir un libro!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {suggestions.map((suggestion) => (
        <SuggestionCard key={suggestion.id} suggestion={suggestion} />
      ))}
    </div>
  )
}

function SuggestionsHeader() {
  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Sugerencias de Libros</h1>
          </div>
        </div>

        <p className="text-amber-100 mb-4">
          Libros que la comunidad quiere ver en la plataforma. ¡Vota por los que más te interesen!
        </p>
      </div>
    </div>
  )
}

export default async function SuggestionsPage() {
  const suggestions = await getSuggestions()

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <SuggestionsHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Formulario para nuevas sugerencias */}
        <div className="mb-12">
          <BookSuggestionForm />
        </div>

        {/* Lista de sugerencias */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Libros Sugeridos</h2>
          <p className="text-gray-600 mb-6">
            Ordenados por popularidad. Los libros con más votos tienen más chances de ser subidos.
          </p>
        </div>

        <Suspense fallback={<div>Cargando sugerencias...</div>}>
          <SuggestionsGrid suggestions={suggestions} />
        </Suspense>
      </main>
    </div>
  )
}