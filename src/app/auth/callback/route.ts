import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic' // Required because we're using dynamic data

export async function GET(request: NextRequest) {
  try {
    // Get the URL from the request
    const requestUrl = new URL(request.url)
    console.log('Auth callback URL:', requestUrl.toString())
    
    // Extract any error params
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')
    
    if (error) {
      console.error('OAuth error:', error, error_description)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
      )
    }

    // The supabase client will automatically handle the code exchange now
    // that detectSessionInUrl is set to true
    
    // Create a response that redirects to the photobook
    const response = NextResponse.redirect(new URL('/photobook', requestUrl.origin))
    
    return response
  } catch (error) {
    console.error('Error in auth callback:', error)
    const errorObj = error as Error
    const requestUrl = new URL(request.url)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(`Authentication failed: ${errorObj.message || 'Unknown error'}`)}`, requestUrl.origin)
    )
  }
} 