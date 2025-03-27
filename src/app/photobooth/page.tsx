import React from 'react'
import PhotoboothComponent from '@/components/photobooth/PhotoboothComponent'

export default function PhotoboothPage() {
  return (
    <main className="min-h-screen bg-vintage-background text-vintage-text p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Take Your Photos</h1>
        <PhotoboothComponent />
      </div>
    </main>
  )
} 