import { Photo } from '@/types/photobooth'

export const createPhotoFromFile = (file: File): Promise<Photo> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target && e.target.result) {
        resolve({
          id: Date.now(),
          dataUrl: e.target.result as string
        })
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export const createPhotoFromVideo = (video: HTMLVideoElement): Photo => {
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d')?.drawImage(video, 0, 0)
  
  return {
    id: Date.now(),
    dataUrl: canvas.toDataURL('image/jpeg')
  }
}

export const downloadPhoto = (photo: Photo, filename: string) => {
  const link = document.createElement('a')
  link.href = photo.dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
} 