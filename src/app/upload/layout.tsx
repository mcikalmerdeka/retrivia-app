'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function UploadLayout({
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
    <div className="min-h-screen bg-vintage-background text-vintage-text">
      <div className="max-w-4xl mx-auto">
        <header className="py-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Upload Your Photos</h1>
          <p className="text-sm text-vintage-text opacity-80">
            Create a photostrip from existing photos
          </p>
        </header>
        <main>
          {children}
        </main>
      </div>
    </div>
  ) : null // Return null while redirecting
} 