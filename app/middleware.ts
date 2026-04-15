import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  // Get user role from database
  let userRole = null
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_admin')
      .eq('id', user.id)
      .single()
    userRole = profile?.role
    isAdmin = profile?.is_admin || false
  }

  const path = request.nextUrl.pathname

  // Public routes
  const publicRoutes = ['/', '/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/callback']
  if (publicRoutes.includes(path)) {
    return supabaseResponse
  }

  // If not logged in, redirect to login
  if (!user) {
    const redirectUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Admin routes
  const adminRoutes = ['/admin']
  // Business routes
  const businessRoutes = ['/business']
  // Seeker routes
  const seekerRoutes = ['/jobs', '/jobs/apply', '/jobs/active', '/profile']

  // Admin can access everything
  if (isAdmin) {
    return supabaseResponse
  }

  // Check business routes
  if (userRole === 'business' && seekerRoutes.some(route => path.startsWith(route))) {
    const redirectUrl = new URL('/business/dashboard', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Check seeker routes
  if (userRole === 'seeker' && businessRoutes.some(route => path.startsWith(route))) {
    const redirectUrl = new URL('/jobs', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}