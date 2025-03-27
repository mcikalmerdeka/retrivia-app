import Link from 'next/link'
import { Camera, Upload } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center py-12 px-4 film-grain">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-vintage text-vintage-sepia mb-4">
          Vintage Photobooth
        </h1>
        <p className="text-lg text-vintage-text max-w-2xl mx-auto">
          Create beautiful vintage-style photo strips to capture your memories.
          Choose from two different modes to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <Link href="/photobooth" className="block">
          <div className="border-4 border-vintage-sepia p-6 rounded-lg bg-vintage-paper hover:shadow-lg transition-all duration-300 h-full flex flex-col items-center text-center">
            <Camera className="w-16 h-16 text-vintage-sepia mb-4" />
            <h2 className="text-2xl font-vintage text-vintage-sepia mb-2">
              Take Photos
            </h2>
            <p className="text-vintage-text">
              Use your camera to take a series of photos and create a vintage-style photo strip.
            </p>
          </div>
        </Link>

        <Link href="/upload" className="block">
          <div className="border-4 border-vintage-sepia p-6 rounded-lg bg-vintage-paper hover:shadow-lg transition-all duration-300 h-full flex flex-col items-center text-center">
            <Upload className="w-16 h-16 text-vintage-sepia mb-4" />
            <h2 className="text-2xl font-vintage text-vintage-sepia mb-2">
              Upload Photos
            </h2>
            <p className="text-vintage-text">
              Upload your existing photos to create a personalized vintage photo strip.
            </p>
          </div>
        </Link>
      </div>
    </main>
  )
} 