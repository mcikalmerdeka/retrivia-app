'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // The hash fragment contains the token
    // Supabase client handles the token automatically
    // Just redirect to the main app after a short delay
    const timer = setTimeout(() => {
      router.push('/photobook')
    }, 1000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-vintage-paper p-4">
      <div className="text-center">
        <h1 className="text-3xl font-vintage text-vintage-sepia mb-4">
          Welcome Back!
        </h1>
        <p className="text-vintage-text mb-8">
          Signing you in and redirecting to your photobook...
        </p>
        <div className="w-16 h-16 border-t-4 border-vintage-sepia border-solid rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  )
} 