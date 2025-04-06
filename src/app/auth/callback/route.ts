import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic' // Required because we're using dynamic data

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')

    if (error) {
      console.error('Error in auth callback:', error, error_description)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
      )
    }

    if (code) {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      console.log('Exchanging code for session...')
      await supabase.auth.exchangeCodeForSession(code)
      console.log('Session created successfully')
    } else {
      console.warn('No code found in callback URL')
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(new URL('/photobook', requestUrl.origin))
  } catch (error) {
    console.error('Error in auth callback:', error)
    const requestUrl = new URL(request.url)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Authentication failed')}`, requestUrl.origin)
    )
  }
} 