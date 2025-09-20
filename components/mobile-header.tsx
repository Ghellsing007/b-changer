"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Book, Menu, Search, User, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navigation = [
    { name: "Inicio", href: "/", icon: Book },
    { name: "Catálogo", href: "/catalog", icon: Search },
    { name: "Mis Préstamos", href: "/loans", icon: Book },
    { name: "Pedidos", href: "/orders", icon: ShoppingCart },
    { name: "Dashboard", href: "/dashboard", icon: User },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-cyan-600 to-blue-600 text-white backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/20">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-gradient-to-br from-cyan-50 to-blue-50">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-lg font-semibold text-gray-800">Menú</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4">
              <div className="flex items-center gap-2 px-2 py-4">
                <Book className="h-6 w-6 text-blue-600" />
                <span className="text-lg font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  B-Changer
                </span>
              </div>
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gradient-to-r hover:from-cyan-100 hover:to-blue-100 ${
                      pathname === item.href ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white" : "text-gray-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link href="/" className="flex items-center gap-2">
              <Book className="h-6 w-6 text-white" />
              <span className="font-semibold text-white">B-Changer</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {navigation.slice(0, 4).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-white/80 ${
                  pathname === item.href ? "text-white" : "text-white/70"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
