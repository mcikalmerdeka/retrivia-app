'use client'

import React, { useRef, useEffect, forwardRef } from 'react'
import { FilterType } from './FilterComponent'
import { FrameType } from './FrameComponent'
import { FontStyle } from './CaptionComponent'

interface Photo {
  id: string
  dataUrl: string
}

interface PhotoStripComponentProps {
  photos: Photo[]
  filter: FilterType
  frame: FrameType
  caption: string
  fontStyle: FontStyle
  textColor: string
  canvasRef?: React.RefObject<HTMLCanvasElement>
}

const PhotoStripComponent = forwardRef<HTMLCanvasElement, PhotoStripComponentProps>(({
  photos,
  filter,
  frame,
  caption,
  fontStyle,
  textColor,
  canvasRef: externalCanvasRef
}: PhotoStripComponentProps, ref) => {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = externalCanvasRef || internalCanvasRef

  React.useImperativeHandle(ref, () => {
    return canvasRef.current || document.createElement('canvas')
  }, [canvasRef])

  useEffect(() => {
    if (photos.length === 0) return
    renderPhotoStrip()
  }, [photos, filter, frame, caption, fontStyle, textColor])

  const getFilterStyle = (ctx: CanvasRenderingContext2D, filter: FilterType) => {
    switch (filter) {
      case 'raw':
        return 'none'
      case 'sepia':
        return 'sepia(0.8)'
      case 'blackAndWhite':
        return 'grayscale(1)'
      case 'vintage1':
        return 'sepia(0.5) contrast(1.1) brightness(0.9) saturate(0.8)'
      case 'vintage2':
        return 'sepia(0.2) hue-rotate(340deg) saturate(1.3)'
      default:
        return 'none'
    }
  }

  const getFrameStyle = (frame: FrameType) => {
    switch (frame) {
      case 'classic':
        return {
          borderWidth: 15,
          borderColor: '#d2bd9e',
          borderRadius: 0,
          shadow: false,
          holes: false,
          bottomBorder: 0
        }
      case 'polaroid':
        return {
          borderWidth: 15,
          borderColor: '#f5f5f0',
          borderRadius: 0,
          shadow: false,
          holes: false,
          bottomBorder: 0
        }
      case 'filmstrip':
        return {
          borderWidth: 15,
          borderColor: '#222222',
          borderRadius: 0,
          holes: true,
          shadow: false,
          bottomBorder: 0
        }
      case 'scalloped':
        return {
          borderWidth: 15,
          borderColor: '#e8d8c3',
          borderRadius: 0,
          shadow: false,
          holes: false,
          bottomBorder: 0
        }
      default:
        return {
          borderWidth: 15,
          borderColor: '#d2bd9e',
          borderRadius: 0,
          shadow: false,
          holes: false,
          bottomBorder: 0
        }
    }
  }

  const getFontConfig = (fontStyle: FontStyle) => {
    switch (fontStyle) {
      case 'vintage':
        return { family: 'serif', weight: 'bold' as const }
      case 'modern':
        return { family: 'sans-serif', weight: 'normal' as const }
      case 'handwritten':
        return { family: 'cursive', weight: 'normal' as const }
      case 'fancy':
        return { family: 'serif', weight: 'normal' as const }
      default:
        return { family: 'serif', weight: 'bold' as const }
    }
  }

  const renderPhotoStrip = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const frameStyle = getFrameStyle(frame)
    const filteredPhotos = photos.filter(photo => photo !== null)

    // Use fixed dimensions instead of depending on canvas.width
    const baseWidth = 450
    const photoWidth = baseWidth * 0.85
    const photoHeight = photoWidth * 0.6
    const gap = 10
    const bottomSpace = caption ? 60 : 20

    canvas.width = photoWidth + frameStyle.borderWidth * 2
    canvas.height = (photoHeight + gap) * filteredPhotos.length + frameStyle.borderWidth * 2 + bottomSpace - gap

    ctx.fillStyle = frameStyle.borderColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (frameStyle.holes) {
      const holeRadius = 4
      const holeSpacing = 20
      const sideMargin = 6

      for (let y = frameStyle.borderWidth + holeSpacing; y < canvas.height - frameStyle.borderWidth; y += holeSpacing) {
        ctx.beginPath()
        ctx.arc(sideMargin, y, holeRadius, 0, Math.PI * 2)
        ctx.arc(canvas.width - sideMargin, y, holeRadius, 0, Math.PI * 2)
        ctx.fillStyle = '#f5f5dc'
        ctx.fill()
      }
    }

    for (let i = 0; i < filteredPhotos.length; i++) {
      const photo = filteredPhotos[i]
      const img = new Image()
      
      await new Promise<void>((resolve) => {
        img.onload = () => {
          const y = frameStyle.borderWidth + i * (photoHeight + gap)
          
          ctx.save()
          ctx.beginPath()
          ctx.rect(frameStyle.borderWidth, y, photoWidth, photoHeight)
          ctx.clip()
          
          ctx.filter = getFilterStyle(ctx, filter)
          ctx.drawImage(img, frameStyle.borderWidth, y, photoWidth, photoHeight)
          ctx.filter = 'none'
          
          ctx.restore()
          resolve()
        }
        img.src = photo.dataUrl
      })
    }

    if (caption) {
      const fontConfig = getFontConfig(fontStyle)
      ctx.font = `${fontConfig.weight} 24px ${fontConfig.family}`
      ctx.fillStyle = textColor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      const captionY = canvas.height - bottomSpace / 2 - frameStyle.bottomBorder / 2
      ctx.fillText(caption, canvas.width / 2, captionY)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <canvas 
        ref={canvasRef} 
        className="max-w-full h-auto border-4 border-[#222222] drop-shadow-lg" 
        style={{ maxHeight: '80vh' }}
      />
    </div>
  )
})

PhotoStripComponent.displayName = 'PhotoStripComponent'

export default PhotoStripComponent
