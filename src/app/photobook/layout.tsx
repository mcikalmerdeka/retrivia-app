'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function PhotobookLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-vintage-paper flex items-center justify-center">
        <div className="w-16 h-16 border-t-4 border-vintage-sepia border-solid rounded-full animate-spin"></div>
      </div>
    )
  }

  // Once loaded, if authenticated, show the actual content
  return isAuthenticated ? (
    <div className="min-h-screen bg-vintage-paper">
      <header className="border-b border-vintage-sepia">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-vintage text-center text-vintage-sepia tracking-wide">
            Memories Album
          </h1>
        </div>
      </header>
      <main>
        {children}
      </main>
    </div>
  ) : null // Return null while redirecting
} 