"use client"

import { Book, Search, ShoppingCart, User, Heart } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function BottomNavigation() {
  const pathname = usePathname()

  const navigation = [
    { name: "Inicio", href: "/", icon: Book },
    { name: "Buscar", href: "/catalog", icon: Search },
    { name: "Carrito", href: "/cart", icon: ShoppingCart },
    { name: "Favoritos", href: "/wishlist", icon: Heart },
    { name: "Perfil", href: "/dashboard", icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t shadow-lg md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-all duration-200 ${
                isActive
                  ? "text-white bg-gradient-to-t from-cyan-500 to-blue-600 rounded-t-lg"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
