"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookSuggestionForm } from "@/components/book-suggestion-form"
import { ThumbsUp, ThumbsDown, Lightbulb, TrendingUp, Book } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Suspense } from "react"
import Link from "next/link"

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

function SuggestionCard({ suggestion, onVote }: { suggestion: BookSuggestion; onVote: (suggestionId: string, voteType: 'up' | 'down') => void }) {
  const [isVoting, setIsVoting] = useState(false)
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null)
  const { toast } = useToast()

  const handleVote = async (voteType: 'up' | 'down') => {
    if (isVoting) return

    setIsVoting(true)
    try {
      await onVote(suggestion.id, voteType)
      setUserVote(voteType)
      toast({
        title: "¡Voto registrado!",
        description: `Has votado ${voteType === 'up' ? 'positivamente' : 'negativamente'} por "${suggestion.title}".`,
      })
    } catch (error) {
      toast({
        title: "Error al votar",
        description: error instanceof Error ? error.message : "No se pudo registrar el voto",
        variant: "destructive"
      })
    } finally {
      setIsVoting(false)
    }
  }

  const uploadUrl = `/upload?title=${encodeURIComponent(suggestion.title)}&author=${encodeURIComponent(suggestion.author)}&category=${encodeURIComponent(suggestion.category)}`

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

        <div className="mt-auto space-y-2">
          {/* Botón para subir el libro */}
          <Button
            asChild
            size="sm"
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0"
          >
            <Link href={uploadUrl}>
              <Book className="h-4 w-4 mr-2" />
              Subir este Libro
            </Link>
          </Button>

          {/* Botones de votación */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className={`flex-1 border-amber-300 hover:bg-amber-50 ${userVote === 'up' ? 'bg-green-50 border-green-300' : ''}`}
              onClick={() => handleVote('up')}
              disabled={isVoting}
            >
              <ThumbsUp className={`h-4 w-4 mr-1 ${userVote === 'up' ? 'text-green-600' : ''}`} />
              {userVote === 'up' ? 'Votado (+)' : 'Votar (+)'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`flex-1 border-amber-300 hover:bg-amber-50 ${userVote === 'down' ? 'bg-red-50 border-red-300' : ''}`}
              onClick={() => handleVote('down')}
              disabled={isVoting}
            >
              <ThumbsDown className={`h-4 w-4 mr-1 ${userVote === 'down' ? 'text-red-600' : ''}`} />
              {userVote === 'down' ? 'Votado (-)' : 'Votar (-)'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SuggestionsGrid({ suggestions, onVote }: { suggestions: BookSuggestion[]; onVote: (suggestionId: string, voteType: 'up' | 'down') => void }) {
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
        <SuggestionCard key={suggestion.id} suggestion={suggestion} onVote={onVote} />
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

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<BookSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()

  // Cargar sugerencias
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        setLoading(true)
        const data = await getSuggestions()
        setSuggestions(data)
      } catch (error) {
        console.error("Error loading suggestions:", error)
        toast({
          title: "Error",
          description: "Error al cargar las sugerencias",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    loadSuggestions()
  }, [toast])

  // Función para votar
  const handleVote = async (suggestionId: string, voteType: 'up' | 'down') => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Error de autenticación",
          description: "Debes iniciar sesión para votar",
          variant: "destructive"
        })
        throw new Error("Usuario no autenticado")
      }

      // Verificar si ya votó
      const { data: existingVote } = await supabase
        .from('suggestion_votes')
        .select('id, vote_type')
        .eq('suggestion_id', suggestionId)
        .eq('user_id', user.id)
        .single()

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Si ya votó igual, quitar el voto
          await supabase
            .from('suggestion_votes')
            .delete()
            .eq('id', existingVote.id)
        } else {
          // Si votó diferente, cambiar el voto
          await supabase
            .from('suggestion_votes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id)
        }
      } else {
        // Nuevo voto
        await supabase
          .from('suggestion_votes')
          .insert({
            suggestion_id: suggestionId,
            user_id: user.id,
            vote_type: voteType
          })
      }

      // Recargar sugerencias para actualizar votos
      const updatedSuggestions = await getSuggestions()
      setSuggestions(updatedSuggestions)

    } catch (error) {
      console.error("Error voting:", error)
      throw error
    }
  }

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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Libros Pedidos por la Comunidad</h2>
              <p className="text-gray-600 mt-1">
                {suggestions.length} libros solicitados • Ordenados por popularidad
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">¿Quieres ayudar?</p>
              <p className="text-xs text-amber-600 font-medium">¡Sube los libros más votados!</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-1">¿Cómo funciona?</h3>
                <p className="text-sm text-amber-700">
                  Los libros con más votos tienen mayor prioridad. Si tienes alguno de estos libros,
                  ¡subelo para ayudar a la comunidad! Los libros subidos aparecerán automáticamente en el catálogo.
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando sugerencias...</p>
          </div>
        ) : (
          <SuggestionsGrid suggestions={suggestions} onVote={handleVote} />
        )}
      </main>
    </div>
  )
}