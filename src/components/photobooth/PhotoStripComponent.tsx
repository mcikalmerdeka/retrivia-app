'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Download, Share2, MessageSquare } from 'lucide-react'
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
}

export default function PhotoStripComponent({
  photos,
  filter,
  frame,
  caption,
  fontStyle,
  textColor
}: PhotoStripComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [memorialMessage, setMemorialMessage] = useState<string>('')
  const [showMessageModal, setShowMessageModal] = useState<boolean>(false)
  const [savedMessages, setSavedMessages] = useState<{message: string, date: string}[]>([])

  // Re-render the photostrip when props change
  useEffect(() => {
    if (photos.length === 0) return
    
    // Validate that we have enough photos
    console.log('PhotoStripComponent received photos:', photos);
    if (photos.length < 3) {
      console.warn('Warning: Photostrip received fewer than 3 photos');
    }
    
    renderPhotoStrip()
  }, [photos, filter, frame, caption, fontStyle, textColor])

  const getFilterStyle = (ctx: CanvasRenderingContext2D, filter: FilterType) => {
    switch (filter) {
      case 'raw':
        return 'none' // No filter applied for raw option
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
          borderColor: '#d2bd9e', // Warmer beige/tan color
          borderRadius: 0,
          shadow: false,
          holes: false,
          bottomBorder: 0
        }
      case 'polaroid':
        return {
          borderWidth: 15,
          borderColor: '#f5f5f0', // Subtle cream color
          borderRadius: 0,
          shadow: false,
          holes: false,
          bottomBorder: 0
        }
      case 'filmstrip':
        return {
          borderWidth: 15,
          borderColor: '#222222', // Keep existing dark color
          borderRadius: 0,
          holes: true, // Add film holes
          shadow: false,
          bottomBorder: 0
        }
      case 'scalloped':
        return {
          borderWidth: 15,
          borderColor: '#e8d8c3', // Light sepia tone
          borderRadius: 0, // No rounded corners
          scalloped: false, // Remove scalloping
          shadow: false,
          holes: false,
          bottomBorder: 0
        }
      default:
        return {
          borderWidth: 0,
          borderColor: 'transparent',
          borderRadius: 0,
          shadow: false,
          holes: false,
          bottomBorder: 0
        }
    }
  }

  const getFontStyle = (fontStyle: FontStyle) => {
    switch (fontStyle) {
      case 'vintage':
        return 'italic 22px "Times New Roman", serif'
      case 'handwritten':
        return '22px "Comic Sans MS", cursive'
      case 'modern':
        return 'bold 22px Arial, sans-serif'
      case 'fancy':
        return '24px "Playfair Display", "Georgia", serif'
      default:
        return '22px serif'
    }
  }

  const renderPhotoStrip = () => {
    if (!canvasRef.current || photos.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Use 9:16 aspect ratio (smartphone aspect ratio)
    canvas.width = 450
    canvas.height = 800

    // Fill background with vintage paper color
    ctx.fillStyle = '#f9f5e7' // Vintage paper background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Calculate photo dimensions and positions
    const photoWidth = canvas.width * 0.85 // Size from example
    const photoHeight = photoWidth * 0.6 // Height that allows 3 photos to fit nicely
    const marginX = (canvas.width - photoWidth) / 2
    
    // Calculate spacing to match example
    const totalVerticalSpace = canvas.height;
    const captionDateAreaHeight = 110; // Increased space for caption and date
    const topMargin = 30; // Reduced top margin to raise photos
    const photoAreaHeight = totalVerticalSpace - captionDateAreaHeight - topMargin;
    
    // Calculate spacing between photos to be even
    const photosTotalHeight = photoHeight * 3;
    const remainingSpace = photoAreaHeight - photosTotalHeight;
    const spaceBetween = remainingSpace / 4; // Top, between photos, and before date
    
    // Apply filter to context (except for "raw" filter)
    if (filter !== 'raw') {
      ctx.filter = getFilterStyle(ctx, filter)
    }

    // Get frame style
    const frameStyle = getFrameStyle(frame)

    // Create promises for loading all images
    const loadImagePromises = photos
      .filter(photo => photo && photo.dataUrl)
      .map(photo => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          if (!photo || !photo.dataUrl) {
            console.error('Invalid photo data', photo);
            reject(new Error('Invalid photo data'));
            return;
          }
          
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => {
            console.error('Failed to load image', photo.id);
            reject(new Error('Failed to load image'));
          };
          img.src = photo.dataUrl;
        });
      })

    // Process images once all are loaded
    Promise.all(loadImagePromises)
      .then(photoImages => {
        // Draw each photo with frame
        photoImages.forEach((img, index) => {
          if (!img || typeof img.width !== 'number' || typeof img.height !== 'number') {
            console.error('Invalid image object', img);
            return; // Skip this image
          }
          
          // Calculate vertical position with offset from top matching example
          // Ensure exact consistent spacing between photos
          const y = topMargin + spaceBetween + index * (photoHeight + spaceBetween)
          
          // Draw frame first (if selected)
          if (frame !== 'none') {
            // Set frame color
            ctx.fillStyle = frameStyle.borderColor
            
            // Draw frame with appropriate border width - always straight edges
            // Ensure the frame is drawn with exact dimensions for consistency
            ctx.fillRect(
              marginX - frameStyle.borderWidth,
              y - frameStyle.borderWidth,
              photoWidth + frameStyle.borderWidth * 2,
              photoHeight + frameStyle.borderWidth * 2 + (frameStyle.bottomBorder || 0)
            )
            
            // Add film holes if using filmstrip frame
            if (frameStyle.holes) {
              const holeRadius = 6 // Smaller holes
              const holeMargin = 8 // More margin for holes
              // Left side holes
              ctx.fillStyle = '#000000'
              ctx.beginPath()
              ctx.arc(marginX - frameStyle.borderWidth + holeMargin + holeRadius, y + photoHeight * 0.25, holeRadius, 0, Math.PI * 2)
              ctx.arc(marginX - frameStyle.borderWidth + holeMargin + holeRadius, y + photoHeight * 0.75, holeRadius, 0, Math.PI * 2)
              ctx.fill()
              // Right side holes
              ctx.beginPath()
              ctx.arc(marginX + photoWidth + frameStyle.borderWidth - holeMargin - holeRadius, y + photoHeight * 0.25, holeRadius, 0, Math.PI * 2)
              ctx.arc(marginX + photoWidth + frameStyle.borderWidth - holeMargin - holeRadius, y + photoHeight * 0.75, holeRadius, 0, Math.PI * 2)
              ctx.fill()
            }
          }
          
          // Draw the image ensuring it fits properly within the frame
          const effectiveWidth = photoWidth - 4; // Slightly smaller to avoid edge cropping
          const effectiveHeight = photoHeight - 4;
          
          // Handle aspect ratio while avoiding cropping
          const imgAspect = img.width / img.height;
          const frameAspect = effectiveWidth / effectiveHeight;
          
          let drawWidth, drawHeight, offsetX, offsetY;
          
          if (imgAspect > frameAspect) {
            // Image is wider - scale to fit height and center horizontally
            drawHeight = effectiveHeight;
            drawWidth = drawHeight * imgAspect;
            offsetX = (effectiveWidth - drawWidth) / 2;
            offsetY = 0;
          } else {
            // Image is taller - scale to fit width and center vertically
            drawWidth = effectiveWidth;
            drawHeight = drawWidth / imgAspect;
            offsetX = 0;
            offsetY = (effectiveHeight - drawHeight) / 2;
          }
          
          // Draw the image centered in its frame
          ctx.drawImage(
            img,
            marginX + 2 + offsetX, // 2px inner margin
            y + 2 + offsetY,      // 2px inner margin 
            drawWidth,
            drawHeight
          );
        })
        
        // Reset filter for text
        ctx.filter = 'none'
        
        // Add a bit of extra spacing between last photo and caption area
        const lastPhotoBottom = topMargin + spaceBetween + 3 * (photoHeight + spaceBetween) - spaceBetween;
        const extraSpaceNeeded = Math.max(0, lastPhotoBottom + 25 - (canvas.height - captionDateAreaHeight));
        
        // Skip the divider line for a cleaner look like the example

        // Add the date at the bottom to match example
        const today = new Date()
        const formattedDate = today.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
        
        // Position for date and caption - moved lower
        const dateY = canvas.height - 20;
        const captionY = canvas.height - 55; // Raised higher from date for better spacing
        
        // Add caption if present (positioned below photos and above date)
        if (caption) {
          // Add subtle text shadow for better visibility
          ctx.save();
          ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
          ctx.shadowBlur = 2;
          
          // Draw caption text
          ctx.font = getFontStyle(fontStyle)
          ctx.textAlign = 'center'
          ctx.fillStyle = textColor
          
          // Handle text wrapping with slightly smaller line height
          const maxWidth = photoWidth * 0.9
          wrapText(ctx, caption, canvas.width / 2, captionY, maxWidth, 26)
          
          ctx.restore();
        }
        
        // Use a smaller handwritten cursive style font for the date
        ctx.font = 'italic 20px "Brush Script MT", cursive';
        ctx.fillStyle = '#8b4513' // Brown color for date
        ctx.textAlign = 'center'
        ctx.fillText(formattedDate, canvas.width / 2, dateY)
      })
      .catch(error => {
        console.error('Error rendering photo strip:', error);
        
        // Clear the canvas and draw an error message
        ctx.filter = 'none';
        ctx.fillStyle = '#f9f5e7';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw error message on canvas
        ctx.fillStyle = '#a52a2a';
        ctx.font = 'bold 24px serif';
        ctx.textAlign = 'center';
        ctx.fillText('Error loading images', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = 'italic 18px serif';
        ctx.fillText('Please try again', canvas.width / 2, canvas.height / 2 + 20);
      });
  }

  // Helper function for text wrapping
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(' ')
    let line = ''
    let testLine = ''
    let lineCount = 0

    for(let n = 0; n < words.length; n++) {
      testLine = line + words[n] + ' '
      const metrics = ctx.measureText(testLine)
      const testWidth = metrics.width
      
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y + (lineCount * lineHeight))
        line = words[n] + ' '
        lineCount++
      }
      else {
        line = testLine
      }
    }
    
    ctx.fillText(line, x, y + (lineCount * lineHeight))
  }

  // Helper function to draw rounded rectangles
  const roundRect = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    radius: number
  ) => {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    ctx.fill()
  }

  const downloadPhotoStrip = () => {
    if (!canvasRef.current) return
    
    // Create a temporary link element
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().replace(/:/g, '-')
    link.download = `retrivia-memory-${timestamp}.jpg`
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.8)
    link.click()
  }

  const saveMemorialMessage = () => {
    if (!memorialMessage.trim()) return
    
    const newMessage = {
      message: memorialMessage,
      date: new Date().toISOString()
    }
    
    setSavedMessages([...savedMessages, newMessage])
    setMemorialMessage('')
    setShowMessageModal(false)
    
    // In a real application, you would save this to a database
    console.log('Memorial message saved:', newMessage)
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <canvas 
        ref={canvasRef} 
        className="max-w-full h-auto border-4 border-[#222222] drop-shadow-lg" 
        style={{ maxHeight: '80vh' }}
      />
      
      <div className="flex gap-4">
        <button 
          onClick={downloadPhotoStrip}
          className="vintage-button flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
        
        <button 
          onClick={() => setShowMessageModal(true)}
          className="vintage-button flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Add Memory Note
        </button>
        
        <button 
          onClick={() => alert('Sharing coming soon!')}
          className="px-6 py-3 border border-vintage-primary text-vintage-primary rounded-lg flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>
      
      {/* Memorial Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-vintage-paper border-4 border-vintage-sepia rounded p-6 max-w-lg w-full">
            <h3 className="text-2xl font-vintage text-vintage-sepia mb-4">Preserve This Memory</h3>
            <p className="text-vintage-text mb-4">
              Write a message about this moment to preserve your feelings and help you remember it later.
            </p>
            
            <textarea
              value={memorialMessage}
              onChange={(e) => setMemorialMessage(e.target.value)}
              className="w-full h-40 p-3 border-2 border-vintage-sepia bg-vintage-paper rounded"
              placeholder="What makes this moment special? How do you feel right now?"
            />
            
            <div className="flex justify-end gap-3 mt-4">
              <button 
                onClick={() => setShowMessageModal(false)}
                className="px-4 py-2 border border-vintage-sepia text-vintage-sepia rounded"
              >
                Cancel
              </button>
              <button 
                onClick={saveMemorialMessage}
                className="px-4 py-2 bg-vintage-sepia text-white rounded"
              >
                Save Memory
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Display saved messages */}
      {savedMessages.length > 0 && (
        <div className="mt-6 w-full max-w-lg">
          <h3 className="text-xl font-vintage text-vintage-sepia mb-2">Your Memory Notes</h3>
          <div className="border-2 border-vintage-sepia rounded p-4 bg-vintage-paper">
            {savedMessages.map((msg, index) => (
              <div key={index} className="mb-4 pb-4 border-b border-vintage-sepia last:border-b-0">
                <p className="italic text-vintage-text">{msg.message}</p>
                <p className="text-xs text-right text-vintage-sepia mt-1">
                  {new Date(msg.date).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 