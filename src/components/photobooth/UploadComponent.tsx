import React, { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'

interface Photo {
  id: number
  dataUrl: string
}

export default function UploadComponent() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target || !e.target.files || e.target.files.length === 0) return
    
    const file = e.target.files[0]
    const reader = new FileReader()
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const target = e.target as FileReader;
      if (target && target.result) {
        setPhotos(prev => [...prev, {
          id: Date.now(),
          dataUrl: target.result as string
        }])
      }
    }
    
    reader.readAsDataURL(file)
  }

  const removePhoto = (id: number) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id))
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        {photos.map(photo => (
          <div key={photo.id} className="relative aspect-[9/16]">
            <img
              src={photo.dataUrl}
              alt={`Uploaded photo ${photos.findIndex(p => p.id === photo.id) + 1}`}
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              onClick={() => removePhoto(photo.id)}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        {photos.length < 3 && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="aspect-[9/16] border-2 border-dashed border-vintage-primary rounded-lg flex items-center justify-center cursor-pointer hover:bg-vintage-accent/20 transition-colors"
          >
            <div className="text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-vintage-primary" />
              <p className="text-sm text-vintage-primary">Upload Photo</p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {photos.length === 3 && (
        <div className="flex justify-center">
          <button
            onClick={() => setPhotos([])}
            className="bg-vintage-primary text-white px-6 py-3 rounded-lg"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  )
} 