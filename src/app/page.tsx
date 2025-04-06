import Link from 'next/link'
import { Camera, Upload, Book } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center py-12 px-4 film-grain">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-vintage text-vintage-sepia mb-4">
          Retrivia
        </h1>
        <p className="text-lg text-vintage-text max-w-2xl mx-auto">
          Transform fleeting moments into timeless treasures
          <br />
          Retrivia crafts your memories into photostrips that tell your unique story
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        <Link href="/photobooth" className="block">
          <div className="border-4 border-vintage-sepia p-6 rounded-lg bg-vintage-paper hover:shadow-lg transition-all duration-300 h-full flex flex-col items-center text-center">
            <Camera className="w-16 h-16 text-vintage-sepia mb-4" />
            <h2 className="text-2xl font-vintage text-vintage-sepia mb-2">
              Capture Moments
            </h2>
            <p className="text-vintage-text">
              Use your camera to take a series of photos
            </p>
          </div>
        </Link>

        <Link href="/upload" className="block">
          <div className="border-4 border-vintage-sepia p-6 rounded-lg bg-vintage-paper hover:shadow-lg transition-all duration-300 h-full flex flex-col items-center text-center">
            <Upload className="w-16 h-16 text-vintage-sepia mb-4" />
            <h2 className="text-2xl font-vintage text-vintage-sepia mb-2">
              Upload Memories
            </h2>
            <p className="text-vintage-text">
              Upload existing photos from your device
            </p>
          </div>
        </Link>

        <Link href="/photobook" className="block">
          <div className="border-4 border-vintage-sepia p-6 rounded-lg bg-vintage-paper hover:shadow-lg transition-all duration-300 h-full flex flex-col items-center text-center">
            <Book className="w-16 h-16 text-vintage-sepia mb-4" />
            <h2 className="text-2xl font-vintage text-vintage-sepia mb-2">
              Memory Album
            </h2>
            <p className="text-vintage-text">
              Browse and manage your saved photostrips
            </p>
          </div>
        </Link>
      </div>
    </main>
  )
} 