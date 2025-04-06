'use client'

import React, { useRef, useEffect, useState, forwardRef } from 'react'
import { Download, Share2, MessageSquare, Album, Book, Save } from 'lucide-react'
import { FilterType } from './FilterComponent'
import { FrameType } from './FrameComponent'
import { FontStyle } from './CaptionComponent'
import Link from 'next/link'
import { updateSessionMemoryNotes, savePhotoStripSession } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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
  canvasRef?: React.RefObject<HTMLCanvasElement | null>
  sessionId?: string
  onSaveComplete?: () => void
}

const PhotoStripComponent = forwardRef<HTMLCanvasElement, PhotoStripComponentProps>(({
  photos,
  filter,
  frame,
  caption,
  fontStyle,
  textColor,
  canvasRef: externalCanvasRef,
  sessionId,
  onSaveComplete
}: PhotoStripComponentProps, ref) => {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null)
  const [memorialMessage, setMemorialMessage] = useState<string>('')
  const [showMessageModal, setShowMessageModal] = useState<boolean>(false)
  const [savedMessages, setSavedMessages] = useState<{message: string, date: string}[]>([])
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [savedUrl, setSavedUrl] = useState<string | null>(null)

  // Use the external ref if provided, otherwise use the internal ref
  const canvasRef = externalCanvasRef || internalCanvasRef
  
  // Forward the internal ref if no external ref was provided but a ref was passed
  React.useImperativeHandle(ref, () => {
    // Return the canvas element with added methods
    const canvas = internalCanvasRef.current!;
    // Add the renderPhotoStrip method to the canvas
    (canvas as any).renderPhotoStrip = () => renderPhotoStrip();
    // Return the enhanced canvas
    return canvas;
  }, []);

  // Fetch the stored photostrip URL when sessionId is provided
  useEffect(() => {
    if (sessionId && sessionId !== 'unknown') {
      const fetchSessionData = async () => {
        const { supabase } = await import('@/lib/supabase');
        const { data, error } = await supabase
          .from('sessions')
          .select('photostrip_url')
          .eq('id', sessionId)
          .single();
          
        if (error) {
          console.error('Error fetching session data:', error);
        } else if (data?.photostrip_url) {
          console.log('Retrieved existing photostrip URL:', data.photostrip_url);
          setSavedUrl(data.photostrip_url);
        }
      };
      
      fetchSessionData();
    }
  }, [sessionId]);

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

  const renderPhotoStrip = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!canvasRef.current || photos.length === 0) {
        reject(new Error('Canvas or photos not available'));
        return;
      }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Cannot get canvas context'));
        return;
      }

    // Use 9:16 aspect ratio (smartphone aspect ratio)
    canvas.width = 450  // Reverted to original dimension
    canvas.height = 800  // Reverted to original dimension

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
        });

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
          });
        
        // Reset filter for text
        ctx.filter = 'none'
        
        // Add a bit of extra spacing between last photo and caption area
        const lastPhotoBottom = topMargin + spaceBetween + 3 * (photoHeight + spaceBetween) - spaceBetween;
        const extraSpaceNeeded = Math.max(0, lastPhotoBottom + 25 - (canvas.height - captionDateAreaHeight));
        
        // Skip the divider line for a cleaner look like the example

        // Add the date at the bottom to match example
        const today = new Date()
        const formattedDate = today.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
        
        // Position for date and caption - moved lower
        const dateY = canvas.height - 20;
        const captionY = canvas.height - 55; // Raised higher from date for better spacing
        
        // Add caption if present (positioned below photos and above date)
        if (caption) {
            // Add background for better visibility of caption text
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillRect(0, captionY - 30, canvas.width, 45);
            
          // Add subtle text shadow for better visibility
          ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 2;
            ctx.shadowOffsetY = 1;
          
          // Draw caption text
          ctx.font = getFontStyle(fontStyle)
          ctx.textAlign = 'center'
          ctx.fillStyle = textColor
          
          // Handle text wrapping with slightly smaller line height
          const maxWidth = photoWidth * 0.9
          wrapText(ctx, caption, canvas.width / 2, captionY, maxWidth, 26)
          
          ctx.restore();
        }
          
          // Background for date
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fillRect(0, dateY - 15, canvas.width, 25);
        
        // Use a smaller handwritten cursive style font for the date
        ctx.font = 'italic 20px "Brush Script MT", cursive';
        ctx.fillStyle = '#8b4513' // Brown color for date
        ctx.textAlign = 'center'
        ctx.fillText(formattedDate, canvas.width / 2, dateY)
          
          resolve();
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
          
          reject(error);
        });
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
    link.href = canvasRef.current.toDataURL('image/jpeg', 1.0) // Use maximum quality
    link.click()
  }

  const saveMemorialMessage = async () => {
    if (!memorialMessage.trim()) return
    
    const newMessage = {
      message: memorialMessage,
      date: new Date().toISOString()
    }
    
    // Add to local state first for immediate UI update
    setSavedMessages([...savedMessages, newMessage])
    
    // Save to Supabase if we have a sessionId
    if (sessionId) {
      try {
        // Format all saved messages plus the new one as a single string
        const allMessages = [...savedMessages, newMessage]
          .map(msg => `${msg.message}\n[${new Date(msg.date).toLocaleString()}]`)
          .join('\n\n');
        
        console.log(`Attempting to save memory note for session: ${sessionId}`);
        const success = await updateSessionMemoryNotes(sessionId, allMessages);
        
        if (!success) {
          console.error('Failed to save memory note to cloud - will keep local copy only');
          // Still allow the user to continue with the local copy
        } else {
          console.log('Memory note saved successfully to cloud');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error saving memory note:', errorMessage);
        // Continue with the local copy even if cloud save fails
      }
    } else {
      console.log('No sessionId available, memory note saved only locally');
    }
    
    setMemorialMessage('');
    setShowMessageModal(false);
  }

  // Add a function to save before viewing album
  const saveAndViewAlbum = async () => {
    if (!canvasRef.current) return

    setIsSaving(true)
    
    try {
      // Make sure the canvas is fully rendered with all customizations
      await renderPhotoStrip();
      
      // Wait a moment to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Force a redraw to ensure caption is rendered
      if (caption) {
        console.log("Ensuring caption is rendered on photostrip:", caption);
        await renderPhotoStrip();
        // Double-check with extra wait time
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Get the photostrip canvas data URL with caption rendered
      const photoStripDataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
      
      let result = null;
      
      if (sessionId && sessionId !== 'unknown') {
        // Update existing session data in database but reuse same storage location
        console.log('Updating existing session with rendered caption for sessionId:', sessionId);
        
        // Fetch the existing session data to get the storage path
        const { supabase } = await import('@/lib/supabase');
        const { data: sessionData, error: fetchError } = await supabase
          .from('sessions')
          .select('photostrip_url')
          .eq('id', sessionId)
          .single();
          
        if (fetchError || !sessionData?.photostrip_url) {
          console.error('Error fetching existing session data:', fetchError);
          throw new Error('Could not fetch session data');
        }
        
        // Extract the storage path from the URL
        const storageUrl = sessionData.photostrip_url;
        const pathMatch = storageUrl.match(/\/storage\/v1\/object\/public\/photostrips\/(.*)/);
        
        if (!pathMatch || !pathMatch[1]) {
          console.error('Could not parse storage path from URL:', storageUrl);
          throw new Error('Invalid storage URL format');
        }
        
        // Reuse the same path to update the file
        const { uploadBase64Image } = await import('@/lib/supabase');
        const storagePath = decodeURIComponent(pathMatch[1]);
        
        console.log('Uploading updated photostrip to existing path:', storagePath);
        const updatedUrl = await uploadBase64Image('photostrips', storagePath, photoStripDataUrl);
        
        if (!updatedUrl) {
          console.error('Failed to upload updated photostrip');
          throw new Error('Upload failed');
        }
        
        // Update the database record with caption
        const { error } = await supabase
          .from('sessions')
          .update({ 
            captions: caption,
            memory_notes: savedMessages.map(msg => `${msg.message}\n[${new Date(msg.date).toLocaleString()}]`).join('\n\n')
          })
          .eq('id', sessionId);
          
        if (error) {
          console.error('Error updating photostrip caption:', error);
        } else {
          console.log('Successfully updated photostrip with caption');
          result = { url: updatedUrl, sessionId };
          setSavedUrl(updatedUrl);
        }
      } else {
        // No existing session, create a new one
        console.log('Creating new session with caption:', caption);
        
        result = await savePhotoStripSession(
          photos,
          photoStripDataUrl,
          caption,
          savedMessages.map(msg => `${msg.message}\n[${new Date(msg.date).toLocaleString()}]`).join('\n\n')
        );
        
        console.log('Save result:', result);
        if (result?.url) {
          setSavedUrl(result.url);
        }
      }
      
      // Notify parent component of save completion if needed
      if (onSaveComplete && result) {
        onSaveComplete();
      }
      
      // Navigate to photobook
      router.push('/photobook');
    } catch (error) {
      console.error('Error saving photostrip:', error);
      alert('Error saving your photostrip. Proceeding to album view anyway.');
      router.push('/photobook');
    } finally {
      setIsSaving(false);
    }
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
          onClick={saveAndViewAlbum}
          disabled={isSaving}
          className="px-6 py-3 border border-vintage-primary text-vintage-primary rounded-lg flex items-center gap-2 hover:bg-vintage-primary hover:text-white transition-colors"
        >
          <Save className="w-4 h-4 mr-1" />
          {isSaving ? 'Saving...' : 'Save & View Album'}
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
})

// Set display name for the component to fix the ESLint error
PhotoStripComponent.displayName = 'PhotoStripComponent'

export default PhotoStripComponent 