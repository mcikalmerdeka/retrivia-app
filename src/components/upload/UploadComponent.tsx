'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Upload, X, ImagePlus, Save } from 'lucide-react'
import FilterComponent, { FilterType } from '../photobooth/FilterComponent'
import FrameComponent, { FrameType } from '../photobooth/FrameComponent'
import CaptionComponent, { FontStyle } from '../photobooth/CaptionComponent'
import PhotoStripComponent from '../photobooth/PhotoStripComponent'
import { savePhotoStripSession, uploadBase64Image } from '@/lib/supabase'

// Extend HTMLCanvasElement to include finalizeCrop method
declare global {
  interface HTMLCanvasElement {
    finalizeCrop?: () => void;
  }
}

interface Photo {
  id: string
  dataUrl: string
}

export default function UploadComponent() {
  // Photo state
  const [photos, setPhotos] = useState<Photo[]>([])
  const [processingPhotos, setProcessingPhotos] = useState(false)
  const [captureMessage, setCaptureMessage] = useState<string | null>(null)
  
  // Customization state
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('raw')
  const [selectedFrame, setSelectedFrame] = useState<FrameType>('filmstrip')
  const [caption, setCaption] = useState('')
  const [fontStyle, setFontStyle] = useState<FontStyle>('vintage')
  const [textColor, setTextColor] = useState<string>('#5e503f') // Default brown color
  
  // UI state
  const [showCustomization, setShowCustomization] = useState(false)
  const [currentCropImage, setCurrentCropImage] = useState<string | null>(null)
  const [croppedImages, setCroppedImages] = useState<{[key: string]: string}>({})
  const [tempPhotoId, setTempPhotoId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null)
  const [savedUrl, setSavedUrl] = useState<string | null>(null)
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cropCanvasRef = useRef<HTMLCanvasElement>(null)
  const photoIdCounter = useRef(0)
  const photoStripRef = useRef<HTMLCanvasElement>(null)

  // Set up an effect to auto-save when entering customization mode
  useEffect(() => {
    // Only attempt to auto-save if we have 3 photos and are in the customization view
    if (showCustomization && photos.length === 3) {
      // Wait for the PhotoStripComponent to fully render
      const timer = setTimeout(() => {
        autoSaveToCloud();
      }, 1000); // Longer delay to ensure canvas is fully rendered
      
      return () => clearTimeout(timer);
    }
  }, [showCustomization, photos]);

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setProcessingPhotos(true)
    setCaptureMessage("Processing your photos...")

    // Only process up to 3 files
    const filesToProcess = Array.from(files).slice(0, 3 - photos.length)
    
    try {
      // Process one file at a time to allow for cropping
      const file = filesToProcess[0]
      const dataUrl = await readFileAsDataURL(file)
      
      // Create a temporary ID for this photo
      const tempId = `photo-${photoIdCounter.current++}`
      setTempPhotoId(tempId)
      
      // Set current image for cropping
      setCurrentCropImage(dataUrl)
      
    } catch (error) {
      console.error('Error processing photos:', error)
      alert('Error processing the uploaded photos. Please try again.')
      setProcessingPhotos(false)
      setCaptureMessage(null)
    } finally {
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Function to handle crop completion
  const handleCropComplete = async () => {
    if (!cropCanvasRef.current || !currentCropImage || !tempPhotoId) return
    
    const canvas = cropCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Get the cropped image data
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 1.0) // Use maximum quality
    
    // Process the cropped image
    try {
      const processedDataUrl = await applyVintageEffects(croppedDataUrl)
      
      // Add to photos
      const newPhoto = {
        id: tempPhotoId,
        dataUrl: processedDataUrl
      }
      
      setPhotos(prev => [...prev, newPhoto])
      
      // Clear cropping state
      setCurrentCropImage(null)
      setTempPhotoId(null)
      
      // Automatically switch to customization if we have 3 photos
      if (photos.length + 1 >= 3) {
        setShowCustomization(true)
        // We'll let the useEffect handle the auto-save now
      }
    } catch (error) {
      console.error('Error processing cropped photo:', error)
      alert('Error processing the cropped photo. Please try again.')
    } finally {
      setProcessingPhotos(false)
      setCaptureMessage(null)
    }
  }
  
  // Function to apply vintage effects to an image
  const applyVintageEffects = async (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          resolve(dataUrl) // Return original if cannot process
          return
        }
        
        // Set canvas size to match individual photo dimensions in PhotoStripComponent
        const canvasWidth = 450 * 0.85 // photoWidth from PhotoStripComponent (original dimension)
        const canvasHeight = canvasWidth * 0.6 // photoHeight from PhotoStripComponent
        
        canvas.width = canvasWidth
        canvas.height = canvasHeight
        
        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // Only apply effects if not using 'raw' filter
        if (selectedFilter !== 'raw') {
          // Apply sepia filter directly on the canvas
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            
            // Sepia formula
            data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189))
            data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168))
            data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131))
          }
          
          ctx.putImageData(imageData, 0, 0)
          
          // Add a subtle vignette effect matching PhotoStripComponent
          const centerX = canvas.width / 2
          const centerY = canvas.height / 2
          const radius = Math.max(canvas.width, canvas.height) / 1.8
          const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius)
          gradient.addColorStop(0, 'rgba(0,0,0,0)')
          gradient.addColorStop(1, 'rgba(0,0,0,0.6)')
          ctx.fillStyle = gradient
          ctx.rect(0, 0, canvas.width, canvas.height)
          ctx.fill()
        }
        
        resolve(canvas.toDataURL('image/jpeg', 1.0)) // Use maximum quality
      }
      
      img.src = dataUrl
    })
  }

  // Function to handle crop canvas interactions
  useEffect(() => {
    if (!currentCropImage || !cropCanvasRef.current) return
    
    const canvas = cropCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    let isDragging = false
    let startX = 0
    let startY = 0
    let cropX = 0
    let cropY = 0
    let cropWidth = 0
    let cropHeight = 0
    
    // Load the image
    const img = new Image()
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width
      canvas.height = img.height
      
      // Calculate initial crop area with PhotoStripComponent aspect ratio
      // In PhotoStripComponent: photoWidth = canvas.width * 0.85, photoHeight = photoWidth * 0.6
      const targetAspect = 1 / 0.6 // Width to height ratio (matches PhotoStripComponent)
      
      if (img.width / img.height > targetAspect) {
        // Image is wider than target aspect ratio
        cropHeight = img.height * 0.9
        cropWidth = cropHeight * targetAspect
      } else {
        // Image is taller than target aspect ratio
        cropWidth = img.width * 0.9
        cropHeight = cropWidth / targetAspect
      }
      
      // Center the crop area
      cropX = (img.width - cropWidth) / 2
      cropY = (img.height - cropHeight) / 2
      
      // Draw the image and crop overlay
      drawImageAndOverlay()
    }
    
    img.src = currentCropImage
    
    // Function to draw the image and crop overlay
    function drawImageAndOverlay() {
      if (!ctx) return
      
      // Draw the image
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      
      // Create a path for the entire canvas excluding the crop area
      ctx.beginPath()
      // Outer rectangle (full canvas)
      ctx.rect(0, 0, canvas.width, canvas.height)
      // Inner rectangle (crop area) - drawn counterclockwise to create a hole
      ctx.rect(cropX + cropWidth, cropY, -cropWidth, cropHeight)
      ctx.closePath()
      
      // Fill the area outside the crop rectangle with semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
      ctx.fill('evenodd')
      
      // Draw crop border
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.strokeRect(cropX, cropY, cropWidth, cropHeight)
      
      // Draw 3:2 label
      ctx.fillStyle = '#fff'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Drag to position, click Confirm when ready', canvas.width / 2, 30)
    }
    
    // Mouse/touch event handlers
    function handleMouseDown(e: MouseEvent | TouchEvent) {
      e.preventDefault()
      
      const { x, y } = getEventCoordinates(e)
      
      if (
        x >= cropX && x <= cropX + cropWidth &&
        y >= cropY && y <= cropY + cropHeight
      ) {
        isDragging = true
        startX = x
        startY = y
      }
    }
    
    function handleMouseMove(e: MouseEvent | TouchEvent) {
      if (!isDragging) return
      e.preventDefault()
      
      const { x, y } = getEventCoordinates(e)
      
      const deltaX = x - startX
      const deltaY = y - startY
      
      cropX += deltaX
      cropY += deltaY
      
      // Keep crop area within image bounds
      cropX = Math.max(0, Math.min(canvas.width - cropWidth, cropX))
      cropY = Math.max(0, Math.min(canvas.height - cropHeight, cropY))
      
      startX = x
      startY = y
      
      drawImageAndOverlay()
    }
    
    function handleMouseUp(e: MouseEvent | TouchEvent) {
      isDragging = false
    }
    
    function getEventCoordinates(e: MouseEvent | TouchEvent) {
      const rect = canvas.getBoundingClientRect()
      let x, y
      
      if ('touches' in e) {
        x = e.touches[0].clientX - rect.left
        y = e.touches[0].clientY - rect.top
      } else {
        x = e.clientX - rect.left
        y = e.clientY - rect.top
      }
      
      // Scale coordinates if canvas is displayed at a different size
      x = (x / rect.width) * canvas.width
      y = (y / rect.height) * canvas.height
      
      return { x, y }
    }
    
    // Add event listeners
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('touchstart', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchend', handleMouseUp)
    
    // Crop finalization function
    const finalizeCrop = () => {
      if (!ctx) return
      
      // Create a new canvas for the cropped area
      const cropCanvas = document.createElement('canvas')
      
      // Match dimensions to what PhotoStripComponent expects, but at original resolution
      const canvasWidth = 450 * 0.85 // photoWidth from PhotoStripComponent (original dimension)
      const canvasHeight = canvasWidth * 0.6 // photoHeight from PhotoStripComponent
      
      cropCanvas.width = canvasWidth
      cropCanvas.height = canvasHeight
      
      const cropCtx = cropCanvas.getContext('2d')
      if (!cropCtx) return
      
      // Draw the cropped portion
      cropCtx.drawImage(
        img, 
        cropX, cropY, cropWidth, cropHeight, // Source coordinates
        0, 0, cropCanvas.width, cropCanvas.height // Destination coordinates
      )
      
      // Replace the canvas content with the cropped image
      canvas.width = cropCanvas.width
      canvas.height = cropCanvas.height
      ctx.drawImage(cropCanvas, 0, 0)
    }
    
    // Attach finalize method to canvas
    canvas.finalizeCrop = finalizeCrop
    
    return () => {
      // Remove event listeners on cleanup
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('touchstart', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [currentCropImage])

  // Handle crop confirmation
  const confirmCrop = () => {
    if (!cropCanvasRef.current) return
    
    // Call the finalizeCrop function attached to the canvas
    if (typeof cropCanvasRef.current.finalizeCrop === 'function') {
      cropCanvasRef.current.finalizeCrop()
    }
    
    // Process the cropped image
    handleCropComplete()
  }

  // Old resize function - no longer used with new crop approach
  const resizeImageToMatchAspectRatio = async (dataUrl: string): Promise<string> => {
    // This function is kept for reference but no longer used
    return dataUrl
  }

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id))
    // Go back to upload mode if we have less than 3 photos after removal
    setShowCustomization(photos.length <= 3)
  }

  const resetPhotostrip = () => {
    setPhotos([])
    setShowCustomization(false)
    setSelectedFilter('raw')
    setSelectedFrame('filmstrip')
    setCaption('')
    setFontStyle('vintage')
    setTextColor('#5e503f')
  }

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (reader.result) {
          resolve(reader.result as string)
        } else {
          reject(new Error('Failed to read file'))
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Function handlers for customization options
  const handleFilterChange = (filter: FilterType) => {
    setSelectedFilter(filter)
  }

  const handleFrameChange = (frame: FrameType) => {
    setSelectedFrame(frame)
  }

  const handleCaptionChange = (text: string) => {
    setCaption(text)
  }

  const handleFontStyleChange = (style: FontStyle) => {
    setFontStyle(style)
  }

  const handleTextColorChange = (color: string) => {
    setTextColor(color)
  }

  // Modify the autoSaveToCloud function to be more robust
  const autoSaveToCloud = async (photosToSave = photos) => {
    try {
      // Make sure we have the canvas and photos
      if (!photoStripRef.current) {
        console.error('Cannot auto-save photostrip: Canvas not ready')
        return
      }
      
      if (photosToSave.length < 3) {
        console.error('Cannot auto-save photostrip: Not enough photos')
        return
      }
      
      // Check if already saving or saved
      if (saving || saveSuccess === true) {
        return
      }

      setSaving(true)
      setSaveSuccess(null)
      setCaptureMessage('Automatically saving your photos to the cloud...')
      
      // Get the photostrip canvas data URL
      const photoStripDataUrl = photoStripRef.current.toDataURL('image/jpeg', 0.95)
      
      console.log('Auto-saving photos to Supabase from UploadComponent...')
      
      // Save the session to Supabase
      const savedUrl = await savePhotoStripSession(
        photosToSave,
        photoStripDataUrl,
        caption
      )
      
      console.log('Auto-save operation completed, returned URL:', savedUrl)
      
      if (savedUrl) {
        setSaveSuccess(true)
        setSavedUrl(savedUrl)
        setCaptureMessage('Your photos have been automatically saved to the cloud!')
        
        // Show a temporary notification
        const notification = document.createElement('div')
        notification.className = 'fixed bottom-4 right-4 bg-green-600 text-white py-2 px-4 rounded-lg shadow-lg z-50 animate-fadeIn'
        notification.innerHTML = 'Photos automatically saved to cloud!'
        document.body.appendChild(notification)
        
        // Remove notification after 3 seconds
        setTimeout(() => {
          notification.classList.replace('animate-fadeIn', 'animate-fadeOut')
          setTimeout(() => {
            document.body.removeChild(notification)
          }, 500)
        }, 3000)
      } else {
        setSaveSuccess(false)
        setCaptureMessage('Automatic cloud save failed, but you can still customize your photostrip.')
      }
    } catch (error) {
      console.error('Error in auto-save:', error)
      setSaveSuccess(false)
      setCaptureMessage('Error during auto-save, but you can still customize your photostrip.')
    } finally {
      setSaving(false)
    }
  }

  // Add function to save the photostrip to Supabase
  const savePhotoStrip = async () => {
    try {
      if (!photoStripRef.current || photos.length < 3) {
        console.error('Cannot save photostrip: Canvas or photos not ready')
        return
      }

      setSaving(true)
      setSaveSuccess(null)
      setCaptureMessage('Saving your photostrip...')
      
      // Get the photostrip canvas data URL
      const photoStripDataUrl = photoStripRef.current.toDataURL('image/jpeg', 0.95)
      
      console.log('Starting save operation with Supabase from UploadComponent...')
      
      // Save the session to Supabase
      const savedUrl = await savePhotoStripSession(
        photos,
        photoStripDataUrl,
        caption
      )
      
      console.log('Supabase operation completed, returned URL:', savedUrl)
      
      if (savedUrl) {
        setSaveSuccess(true)
        setSavedUrl(savedUrl)
        setCaptureMessage('Your photostrip has been saved!')
      } else {
        setSaveSuccess(false)
        setCaptureMessage('Failed to save your photostrip, please try again.')
      }
    } catch (error) {
      console.error('Error saving photostrip:', error)
      setSaveSuccess(false)
      setCaptureMessage('Error saving your photostrip, please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto film-grain">
      {currentCropImage ? (
        // Crop UI
        <div className="flex flex-col items-center space-y-6">
          <h2 className="text-2xl font-vintage text-vintage-sepia">
            Crop Your Photo
          </h2>
          <p className="text-center text-gray-700">
            Drag to position your photo. The aspect ratio matches the photostrip frames exactly.
          </p>
          <div className="relative max-w-full overflow-hidden border-[15px] border-[#222222]">
            <canvas 
              ref={cropCanvasRef}
              className="max-w-full h-auto"
              style={{ maxHeight: '60vh' }}
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setCurrentCropImage(null)
                setTempPhotoId(null)
                setProcessingPhotos(false)
              }}
              className="px-6 py-3 border border-red-500 text-red-500 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={confirmCrop}
              className="vintage-button"
            >
              Confirm Crop
            </button>
          </div>
        </div>
      ) : !showCustomization ? (
        <>
          {/* Photo Grid */}
          <div className="grid grid-cols-3 gap-8">
            {photos.map((photo, index) => (
              <div key={photo.id} className="relative aspect-[3/2] border-[15px] border-[#222222]">
                <img
                  src={photo.dataUrl}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 3 - photos.length) }).map((_, index) => (
              <div 
                key={`empty-${index}`} 
                className="relative aspect-[3/2] border-[15px] border-dashed border-[#222222] bg-gray-100 flex items-center justify-center"
                onClick={handleUploadClick}
              >
                <div className="flex flex-col items-center text-vintage-sepia cursor-pointer">
                  <ImagePlus size={24} />
                  <span className="mt-2 text-sm">Upload</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Processing message */}
          {processingPhotos && (
            <div className="text-center py-4">
              <div className="text-xl font-vintage text-vintage-sepia">
                {captureMessage || "Processing..."}
              </div>
              <div className="mt-2 animate-pulse">Please wait...</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            {photos.length < 3 ? (
              <button
                onClick={handleUploadClick}
                disabled={processingPhotos}
                className="vintage-button flex items-center gap-2 disabled:opacity-50"
              >
                <Upload className="w-5 h-5" />
                Upload Photos
              </button>
            ) : (
              <button 
                onClick={() => setShowCustomization(true)}
                className="vintage-button"
              >
                Customize Photostrip
              </button>
            )}
            
            {photos.length > 0 && (
              <button 
                onClick={resetPhotostrip}
                className="px-6 py-3 border border-vintage-primary text-vintage-primary rounded-lg"
              >
                Start Over
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
              disabled={photos.length >= 3 || processingPhotos}
            />
          </div>
        </>
      ) : (
        /* Customization UI */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-vintage text-vintage-sepia mb-4">
              Customize Your Photostrip
            </h2>
            
            {/* Filter selection */}
            <FilterComponent 
              selectedFilter={selectedFilter} 
              onSelectFilter={handleFilterChange} 
            />
            
            {/* Frame selection */}
            <FrameComponent 
              selectedFrame={selectedFrame} 
              onSelectFrame={handleFrameChange} 
            />
            
            {/* Caption input */}
            <CaptionComponent 
              caption={caption} 
              onCaptionChange={handleCaptionChange}
              fontStyle={fontStyle}
              onFontStyleChange={handleFontStyleChange}
              textColor={textColor}
              onTextColorChange={handleTextColorChange}
            />
            
            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setShowCustomization(false)}
                className="px-6 py-3 border border-vintage-primary text-vintage-primary rounded-lg"
              >
                Back to Photos
              </button>
              
              <button 
                onClick={resetPhotostrip}
                className="px-6 py-3 border border-red-500 text-red-500 rounded-lg"
              >
                Start Over
              </button>
            </div>
          </div>
          
          {/* Photostrip preview and download */}
          <div>
            <PhotoStripComponent 
              photos={photos.filter(photo => photo !== null)}
              filter={selectedFilter}
              frame={selectedFrame}
              caption={caption}
              fontStyle={fontStyle}
              textColor={textColor}
              canvasRef={photoStripRef}
            />
          </div>
        </div>
      )}
    </div>
  )
} 