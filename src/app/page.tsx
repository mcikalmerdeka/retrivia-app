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
          Transform fleeting moments into timeless treasures
          <br />
          Create beautiful photostrips from your favorite moments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <Link href="/photobooth" className="block">
          <div className="border-4 border-vintage-sepia p-8 rounded-lg bg-vintage-paper hover:shadow-lg transition-all duration-300 h-full flex flex-col items-center text-center">
            <Camera className="w-20 h-20 text-vintage-sepia mb-6" />
            <h2 className="text-3xl font-vintage text-vintage-sepia mb-3">
              Capture Moments
            </h2>
            <p className="text-vintage-text text-lg">
              Use your camera to take photos and create a photostrip
            </p>
          </div>
        </Link>

        <Link href="/upload" className="block">
          <div className="border-4 border-vintage-sepia p-8 rounded-lg bg-vintage-paper hover:shadow-lg transition-all duration-300 h-full flex flex-col items-center text-center">
            <Upload className="w-20 h-20 text-vintage-sepia mb-6" />
            <h2 className="text-3xl font-vintage text-vintage-sepia mb-3">
              Upload Memories
            </h2>
            <p className="text-vintage-text text-lg">
              Upload existing photos from your device
            </p>
          </div>
        </Link>
      </div>
    </main>
  )
}
