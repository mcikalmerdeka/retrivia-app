'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const { signInWithGoogle, isAuthenticated, isLoading } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')

  // Check for error in URL parameters (from redirect)
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  // If already authenticated, redirect to photobook
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/photobook')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    // Handle code exchange if it exists
    const handleCode = async () => {
      if (code) {
        try {
          // Exchange code for session
          await supabase.auth.exchangeCodeForSession(code)
          // Check if session exists
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            router.push('/photobook')
          }
        } catch (err) {
          console.error('Error exchanging code for session:', err)
        }
      }
    }
    
    handleCode()
  }, [code, router])

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true)
      setError(null)
      
      // Call signInWithGoogle without trying to destructure a return value
      await signInWithGoogle()
      // The redirect will happen automatically
    } catch (err: any) {
      console.error('Unexpected error during sign in:', err)
      setError(`An unexpected error occurred: ${err?.message || 'Please try again'}`)
      setIsSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-vintage-paper p-4 film-grain">
      <div className="bg-white border-4 border-vintage-sepia rounded-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-vintage text-vintage-sepia mb-4">
            Sign In to Retrivia
          </h1>
          <p className="text-vintage-text">
            Log in to access your personal photobook and memories
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn || isLoading}
            className={`w-full py-3 px-4 flex items-center justify-center gap-3 border-2 border-vintage-sepia rounded-lg 
              text-vintage-sepia font-medium hover:bg-vintage-paper transition-colors
              ${(isSigningIn || isLoading) ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.6 10.2273C19.6 9.51819 19.5364 8.83637 19.4182 8.18182H10V12.0455H15.3818C15.15 13.3 14.4455 14.3591 13.3864 15.0682V17.5773H16.6182C18.5 15.8364 19.6 13.2727 19.6 10.2273Z" fill="#4285F4"/>
              <path d="M10 20C12.7 20 14.9636 19.1045 16.6182 17.5773L13.3864 15.0682C12.4909 15.6682 11.3455 16.0227 10 16.0227C7.39545 16.0227 5.19091 14.2636 4.40455 11.9H1.06364V14.4909C2.70909 17.7591 6.09091 20 10 20Z" fill="#34A853"/>
              <path d="M4.40455 11.9C4.20455 11.3 4.09091 10.6591 4.09091 10C4.09091 9.34091 4.20455 8.7 4.40455 8.1V5.50909H1.06364C0.386364 6.85909 0 8.38636 0 10C0 11.6136 0.386364 13.1409 1.06364 14.4909L4.40455 11.9Z" fill="#FBBC05"/>
              <path d="M10 3.97727C11.4682 3.97727 12.7864 4.48182 13.8227 5.47273L16.6909 2.60455C14.9591 0.990909 12.7 0 10 0C6.09091 0 2.70909 2.24091 1.06364 5.50909L4.40455 8.1C5.19091 5.73636 7.39545 3.97727 10 3.97727Z" fill="#EA4335"/>
            </svg>
            {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-vintage-text">
          <p>
            By signing in, you agree to our
            <a href="#" className="text-vintage-sepia hover:underline ml-1">Terms of Service</a>
            <span className="mx-1">and</span>
            <a href="#" className="text-vintage-sepia hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>

      <div className="mt-8">
        <Link 
          href="/"
          className="text-vintage-sepia hover:underline"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
} 