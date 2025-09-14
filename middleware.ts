import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log('Middleware: Processing request for', request.nextUrl.pathname)

  // Crear respuesta base
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Crear cliente de Supabase para el middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Actualizar la cookie en la request
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Actualizar la cookie en la response
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          // Actualizar la cookie en la request
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          // Actualizar la cookie en la response
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Obtener sesión
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Middleware: Error getting session:', error)
  }

  // Rutas públicas (no requieren autenticación)
  const publicRoutes = ['/', '/catalog', '/auth/login', '/auth/sign-up', '/auth/forgot-password']
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // Rutas de API públicas
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
  const publicApiRoutes = ['/api/webhooks']
  const isPublicApiRoute = publicApiRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // Archivos estáticos
  const isStaticFile = /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/.test(request.nextUrl.pathname)

  // Rutas de administración (requieren rol admin/staff)
  const adminRoutes = ['/admin']
  const isAdminRoute = adminRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // Si es ruta pública, API pública o archivo estático, permitir acceso
  if (isPublicRoute || (isApiRoute && isPublicApiRoute) || isStaticFile) {
    console.log('Middleware: Allowing access to public route')
    return response
  }

  // Para rutas protegidas, verificar sesión
  if (!session) {
    console.log('Middleware: No session found, redirecting to login')
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Para rutas de admin, verificar rol del usuario
  if (isAdminRoute) {
    console.log('Middleware: Checking admin permissions for', request.nextUrl.pathname)

    try {
      // Obtener perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single()

      if (profileError || !profile) {
        console.log('Middleware: Profile not found or error, redirecting to catalog')
        return NextResponse.redirect(new URL('/catalog', request.url))
      }

      // Verificar rol
      if (!['admin', 'staff'].includes(profile.role)) {
        console.log('Middleware: Insufficient permissions, redirecting to catalog')
        return NextResponse.redirect(new URL('/catalog', request.url))
      }

      console.log('Middleware: Admin access granted for role:', profile.role)
    } catch (error) {
      console.error('Middleware: Error checking admin permissions:', error)
      return NextResponse.redirect(new URL('/catalog', request.url))
    }
  }

  console.log('Middleware: Session found, allowing access to protected route')
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
