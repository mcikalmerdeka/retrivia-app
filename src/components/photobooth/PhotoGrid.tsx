import React from 'react'
import { X } from 'lucide-react'

interface Photo {
  id: number
  dataUrl: string
}

interface PhotoGridProps {
  photos: Photo[]
  onRemovePhoto: (id: number) => void
  showUploadButton?: boolean
  onUploadClick?: () => void
}

export default function PhotoGrid({
  photos,
  onRemovePhoto,
  showUploadButton = false,
  onUploadClick,
}: PhotoGridProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {photos.map(photo => (
        <div key={photo.id} className="relative aspect-[9/16]">
          <img
            src={photo.dataUrl}
            alt={`Photo ${photos.findIndex(p => p.id === photo.id) + 1}`}
            className="w-full h-full object-cover rounded-lg"
          />
          <button
            onClick={() => onRemovePhoto(photo.id)}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      
      {showUploadButton && onUploadClick && (
        <div
          onClick={onUploadClick}
          className="aspect-[9/16] border-2 border-dashed border-vintage-primary rounded-lg flex items-center justify-center cursor-pointer hover:bg-vintage-accent/20 transition-colors"
        >
          <div className="text-center">
            <p className="text-sm text-vintage-primary">Upload Photo</p>
          </div>
        </div>
      )}
    </div>
  )
} 