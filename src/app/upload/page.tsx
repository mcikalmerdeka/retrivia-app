import React from 'react'
import UploadComponent from '@/components/upload/UploadComponent'

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-vintage-background text-vintage-text p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Upload Your Photos</h1>
        <UploadComponent />
      </div>
    </main>
  )
} 