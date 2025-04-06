import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic' // Required because we're using dynamic data

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')
    
    console.log('Auth callback received:', { 
      hasCode: !!code, 
      hasError: !!error,
      url: requestUrl.toString().split('?')[0] // Log the URL without query params
    })

    if (error) {
      console.error('Error in auth callback:', error, error_description)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
      )
    }

    if (code) {
      try {
        console.log('Auth code received, exchanging for session')
        
        // Add a small delay to ensure any previous auth operations are complete
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Exchange the auth code for a session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (exchangeError) {
          console.error('Error exchanging code for session:', exchangeError)
          
          // Return a more detailed error message to help debug
          const errorMessage = `Auth error: ${exchangeError.message || 'Unknown error'}`
          return NextResponse.redirect(
            new URL(`/login?error=${encodeURIComponent(errorMessage)}`, requestUrl.origin)
          )
        }
        
        console.log('Successfully exchanged code for session, user:', data?.session?.user?.id ? 
          `${data.session.user.id.substring(0, 8)}...` : 'No user in session')
        
        // Set a cookie to help debug issues
        const redirectResponse = NextResponse.redirect(new URL('/photobook', requestUrl.origin))
        redirectResponse.cookies.set('auth_success', 'true', { 
          maxAge: 60 * 5, // 5 minutes
          path: '/',
          httpOnly: true,
          sameSite: 'lax'
        })
        
        return redirectResponse
      } catch (exchangeError) {
        console.error('Exception in code exchange:', exchangeError)
        const errorObj = exchangeError as Error
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(`Authentication error: ${errorObj.message || 'Unknown error'}`)}`, requestUrl.origin)
        )
      }
    } else {
      console.warn('No code found in callback URL')
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Missing authentication code')}`, requestUrl.origin)
      )
    }
  } catch (error) {
    console.error('Error in auth callback:', error)
    const errorObj = error as Error
    const requestUrl = new URL(request.url)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(`Authentication failed: ${errorObj.message || 'Unknown error'}`)}`, requestUrl.origin)
    )
  }
} 