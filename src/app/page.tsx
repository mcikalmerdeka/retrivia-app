import Link from 'next/link'
import { Camera, Upload } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center py-12 px-4 film-grain">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-vintage text-vintage-sepia mb-4">
          Retrivia
        </h1>
        <p className="text-lg text-vintage-text max-w-2xl mx-auto">
          Capture and relive your special moments. Create beautiful photostrips with captions and 
          preserve the emotion of each memory with personal notes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <Link href="/photobooth" className="block">
          <div className="border-4 border-vintage-sepia p-6 rounded-lg bg-vintage-paper hover:shadow-lg transition-all duration-300 h-full flex flex-col items-center text-center">
            <Camera className="w-16 h-16 text-vintage-sepia mb-4" />
            <h2 className="text-2xl font-vintage text-vintage-sepia mb-2">
              Capture Moments
            </h2>
            <p className="text-vintage-text">
              Use your camera to take a series of photos and create a nostalgic photostrip with your own memory notes.
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
              Upload existing photos to create a personalized photostrip and add memorial notes to preserve your feelings.
            </p>
          </div>
        </Link>
      </div>
    </main>
  )
} 