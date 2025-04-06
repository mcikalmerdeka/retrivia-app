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

    if (error) {
      console.error('Error in auth callback:', error, error_description)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
      )
    }

    if (code) {
      try {
        console.log('Auth code received, exchanging for session')
        
        // Exchange the auth code for a session
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (exchangeError) {
          console.error('Error exchanging code for session:', exchangeError)
          return NextResponse.redirect(
            new URL(`/login?error=${encodeURIComponent('Failed to complete authentication')}`, requestUrl.origin)
          )
        }
        
        console.log('Successfully exchanged code for session')
        
        // URL to redirect to after sign in process completes
        return NextResponse.redirect(new URL('/photobook', requestUrl.origin))
      } catch (exchangeError) {
        console.error('Exception in code exchange:', exchangeError)
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent('Authentication error during code exchange')}`, requestUrl.origin)
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
    const requestUrl = new URL(request.url)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Authentication failed')}`, requestUrl.origin)
    )
  }
} 