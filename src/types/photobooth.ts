export interface Photo {
  id: number
  dataUrl: string
}

export interface PhotoGridProps {
  photos: Photo[]
  onRemovePhoto: (id: number) => void
  showUploadButton?: boolean
  onUploadClick?: () => void
}

export interface PhotoboothProps {
  onComplete?: (photos: Photo[]) => void
}

export interface UploadProps {
  onComplete?: (photos: Photo[]) => void
} 