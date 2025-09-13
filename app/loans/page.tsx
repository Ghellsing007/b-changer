import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Calendar, User, Clock } from "lucide-react"
import Link from "next/link"

interface LoanWithDetails {
  id: string
  status: string
  start_date: string | null
  due_date: string | null
  returned_at: string | null
  days: number | null
  daily_fee: number
  fine_amount: number
  created_at: string
  lender: { display_name: string; user_id: string }
  borrower: { display_name: string; user_id: string }
  listing: {
    edition: {
      format: string
      book: {
        id: string
        title: string
        authors: { name: string }[]
      }
    }
  }
}

async function getUserLoans(): Promise<{ borrowed: LoanWithDetails[]; lent: LoanWithDetails[] }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { borrowed: [], lent: [] }

  // Get loans where user is borrower
  const { data: borrowedLoans, error: borrowedError } = await supabase
    .from("loans")
    .select(`
      id,
      status,
      start_date,
      due_date,
      returned_at,
      days,
      daily_fee,
      fine_amount,
      created_at,
      lender:profiles!lender_id(display_name, user_id),
      borrower:profiles!borrower_id(display_name, user_id),
      listing:listings(
        edition:editions(
          format,
          book:books(
            id,
            title,
            book_authors(
              author:authors(name)
            )
          )
        )
      )
    `)
    .eq("borrower_id", user.id)
    .order("created_at", { ascending: false })

  // Get loans where user is lender
  const { data: lentLoans, error: lentError } = await supabase
    .from("loans")
    .select(`
      id,
      status,
      start_date,
      due_date,
      returned_at,
      days,
      daily_fee,
      fine_amount,
      created_at,
      lender:profiles!lender_id(display_name, user_id),
      borrower:profiles!borrower_id(display_name, user_id),
      listing:listings(
        edition:editions(
          format,
          book:books(
            id,
            title,
            book_authors(
              author:authors(name)
            )
          )
        )
      )
    `)
    .eq("lender_id", user.id)
    .order("created_at", { ascending: false })

  if (borrowedError || lentError) {
    console.error("Error fetching loans:", borrowedError || lentError)
    return { borrowed: [], lent: [] }
  }

  const processLoans = (loans: any[]) =>
    (loans || []).map((loan) => ({
      ...loan,
      listing: {
        edition: {
          ...loan.listing.edition,
          book: {
            ...loan.listing.edition.book,
            authors: loan.listing.edition.book.book_authors?.map((ba: any) => ba.author).filter(Boolean) || [],
          },
        },
      },
    }))

  return {
    borrowed: processLoans(borrowedLoans),
    lent: processLoans(lentLoans),
  }
}

function getStatusBadge(status: string) {
  const variants = {
    reserved: "secondary",
    checked_out: "default",
    returned: "default",
    overdue: "destructive",
    lost: "destructive",
    cancelled: "outline",
  } as const

  const labels = {
    reserved: "Reservado",
    checked_out: "Prestado",
    returned: "Devuelto",
    overdue: "Vencido",
    lost: "Perdido",
    cancelled: "Cancelado",
  }

  return (
    <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
      {labels[status as keyof typeof labels] || status}
    </Badge>
  )
}

function LoanCard({ loan, userRole }: { loan: LoanWithDetails; userRole: "borrower" | "lender" }) {
  const otherUser = userRole === "borrower" ? loan.lender : loan.borrower
  const isOverdue = loan.status === "overdue"
  const hasFine = loan.fine_amount > 0

  const formatType = (format: string) => {
    const formats = {
      paperback: "Tapa Blanda",
      hardcover: "Tapa Dura",
      ebook: "Libro Electrónico",
      audiobook: "Audiolibro",
    }
    return formats[format as keyof typeof formats] || format
  }

  return (
    <Card className={isOverdue ? "border-destructive" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              <Link href={`/catalog/${loan.listing.edition.book.id}`} className="hover:underline">
                {loan.listing.edition.book.title}
              </Link>
            </CardTitle>
            <CardDescription>
              {loan.listing.edition.book.authors.map((a) => a.name).join(", ")} •{" "}
              {formatType(loan.listing.edition.format)}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(loan.status)}
            {hasFine && (
              <Badge variant="destructive" className="text-xs">
                Multa: ${loan.fine_amount}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>
              {userRole === "borrower" ? "Prestado por" : "Prestado a"} {otherUser.display_name}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Solicitado el {new Date(loan.created_at).toLocaleDateString()}</span>
          </div>

          {loan.start_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>Inicio: {new Date(loan.start_date).toLocaleDateString()}</span>
            </div>
          )}

          {loan.due_date && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span className={isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}>
                Vence: {new Date(loan.due_date).toLocaleDateString()}
              </span>
            </div>
          )}

          {loan.returned_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>Devuelto: {new Date(loan.returned_at).toLocaleDateString()}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm">
              <span className="font-medium">${loan.daily_fee}/día</span>
              {loan.days && <span className="text-muted-foreground"> • {loan.days} días</span>}
            </div>

            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/loans/${loan.id}`}>Ver Detalles</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function LoansPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { borrowed, lent } = await getUserLoans()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Mis Préstamos</h1>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="borrowed" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="borrowed">Libros Prestados ({borrowed.length})</TabsTrigger>
            <TabsTrigger value="lent">Libros que Presté ({lent.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="borrowed" className="space-y-6">
            {borrowed.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No tienes préstamos activos</h2>
                <p className="text-muted-foreground mb-6">Explora el catálogo y solicita libros en préstamo</p>
                <Button asChild>
                  <Link href="/catalog">Explorar Catálogo</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {borrowed.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} userRole="borrower" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="lent" className="space-y-6">
            {lent.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No has prestado libros aún</h2>
                <p className="text-muted-foreground mb-6">Ofrece tus libros en préstamo a otros lectores</p>
                <Button asChild>
                  <Link href="/lend">Prestar un Libro</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {lent.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} userRole="lender" />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
