'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Upload, X, ImagePlus, Download } from 'lucide-react'
import FilterComponent, { FilterType } from '../photobooth/FilterComponent'
import FrameComponent, { FrameType } from '../photobooth/FrameComponent'
import CaptionComponent, { FontStyle } from '../photobooth/CaptionComponent'
import PhotoStripComponent from '../photobooth/PhotoStripComponent'

interface Photo {
  id: string
  dataUrl: string
}

export default function UploadComponent() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [processingPhotos, setProcessingPhotos] = useState(false)
  
  // Customization state
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('raw')
  const [selectedFrame, setSelectedFrame] = useState<FrameType>('filmstrip')
  const [caption, setCaption] = useState('')
  const [fontStyle, setFontStyle] = useState<FontStyle>('vintage')
  const [textColor, setTextColor] = useState<string>('#5e503f')
  
  // UI state
  const [showCustomization, setShowCustomization] = useState(false)
  const [currentCropImage, setCurrentCropImage] = useState<string | null>(null)
  const [tempPhotoId, setTempPhotoId] = useState<string | null>(null)
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cropCanvasRef = useRef<HTMLCanvasElement>(null)
  const photoIdCounter = useRef(0)
  const photoStripRef = useRef<HTMLCanvasElement>(null)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setProcessingPhotos(true)
    
    const file = files[0]
    const dataUrl = await readFileAsDataURL(file)
    
    const tempId = `photo-${photoIdCounter.current++}`
    setTempPhotoId(tempId)
    setCurrentCropImage(dataUrl)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCropComplete = async () => {
    if (!cropCanvasRef.current || !currentCropImage || !tempPhotoId) return
    
    const canvas = cropCanvasRef.current
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 1.0)
    
    try {
      const processedDataUrl = await applyVintageEffects(croppedDataUrl)
      
      const newPhoto = { id: tempPhotoId, dataUrl: processedDataUrl }
      setPhotos(prev => [...prev, newPhoto])
      
      setCurrentCropImage(null)
      setTempPhotoId(null)
      
      if (photos.length + 1 >= 3) {
        setShowCustomization(true)
      }
    } catch (error) {
      console.error('Error processing photo:', error)
      alert('Error processing photo. Please try again.')
    } finally {
      setProcessingPhotos(false)
    }
  }
  
  const applyVintageEffects = async (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          resolve(dataUrl)
          return
        }
        
        const canvasWidth = 450 * 0.85
        const canvasHeight = canvasWidth * 0.6
        
        canvas.width = canvasWidth
        canvas.height = canvasHeight
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        if (selectedFilter !== 'raw') {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2]
            data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189))
            data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168))
            data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131))
          }
          
          ctx.putImageData(imageData, 0, 0)
        }
        
        resolve(canvas.toDataURL('image/jpeg', 1.0))
      }
      
      img.src = dataUrl
    })
  }

  useEffect(() => {
    if (!currentCropImage || !cropCanvasRef.current) return
    
    const canvas = cropCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    let isDragging = false
    let startX = 0, startY = 0
    let cropX = 0, cropY = 0, cropWidth = 0, cropHeight = 0
    
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      const targetAspect = 1 / 0.6
      
      if (img.width / img.height > targetAspect) {
        cropHeight = img.height * 0.9
        cropWidth = cropHeight * targetAspect
      } else {
        cropWidth = img.width * 0.9
        cropHeight = cropWidth / targetAspect
      }
      
      cropX = (img.width - cropWidth) / 2
      cropY = (img.height - cropHeight) / 2
      
      drawImageAndOverlay()
    }
    
    img.src = currentCropImage
    
    function drawImageAndOverlay() {
      if (!ctx) return
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      
      ctx.beginPath()
      ctx.rect(0, 0, canvas.width, canvas.height)
      ctx.rect(cropX + cropWidth, cropY, -cropWidth, cropHeight)
      ctx.closePath()
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
      ctx.fill('evenodd')
      
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.strokeRect(cropX, cropY, cropWidth, cropHeight)
      
      ctx.fillStyle = '#fff'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Drag to position, click Confirm when ready', canvas.width / 2, 30)
    }
    
    function handleMouseDown(e: MouseEvent | TouchEvent) {
      e.preventDefault()
      const { x, y } = getEventCoordinates(e)
      
      if (x >= cropX && x <= cropX + cropWidth && y >= cropY && y <= cropY + cropHeight) {
        isDragging = true
        startX = x
        startY = y
      }
    }
    
    function handleMouseMove(e: MouseEvent | TouchEvent) {
      if (!isDragging) return
      e.preventDefault()
      
      const { x, y } = getEventCoordinates(e)
      
      cropX += x - startX
      cropY += y - startY
      
      cropX = Math.max(0, Math.min(canvas.width - cropWidth, cropX))
      cropY = Math.max(0, Math.min(canvas.height - cropHeight, cropY))
      
      startX = x
      startY = y
      
      drawImageAndOverlay()
    }
    
    function handleMouseUp() {
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
      
      x = (x / rect.width) * canvas.width
      y = (y / rect.height) * canvas.height
      
      return { x, y }
    }
    
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('touchstart', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchend', handleMouseUp)
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('touchstart', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [currentCropImage])

  const confirmCrop = () => {
    handleCropComplete()
  }

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id))
    if (photos.length <= 3) {
      setShowCustomization(false)
    }
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
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const downloadPhotoStrip = () => {
    if (!photoStripRef.current) return

    const link = document.createElement('a')
    link.download = `retrivia-photostrip-${Date.now()}.jpg`
    link.href = photoStripRef.current.toDataURL('image/jpeg', 0.95)
    link.click()
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto film-grain">
      {currentCropImage ? (
        // Crop UI
        <div className="flex flex-col items-center space-y-6">
          <h2 className="text-2xl font-vintage text-vintage-sepia">Crop Your Photo</h2>
          <p className="text-center text-gray-700">
            Drag to position your photo. The aspect ratio matches the photostrip frames.
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
            <button onClick={confirmCrop} className="vintage-button">
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
                <img src={photo.dataUrl} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            
            {Array.from({ length: Math.max(0, 3 - photos.length) }).map((_, index) => (
              <div 
                key={`empty-${index}`} 
                className="relative aspect-[3/2] border-[15px] border-dashed border-[#222222] bg-gray-100 flex items-center justify-center cursor-pointer"
                onClick={handleUploadClick}
              >
                <div className="flex flex-col items-center text-vintage-sepia">
                  <ImagePlus size={24} />
                  <span className="mt-2 text-sm">Upload</span>
                </div>
              </div>
            ))}
          </div>
          
          {processingPhotos && (
            <div className="text-center py-4">
              <div className="text-xl font-vintage text-vintage-sepia">Processing...</div>
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
                Edit & Download
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
        /* Edit & Download UI */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-vintage text-vintage-sepia mb-4">
              Customize Your Photostrip
            </h2>
            
            <FilterComponent 
              selectedFilter={selectedFilter} 
              onSelectFilter={setSelectedFilter} 
            />
            
            <FrameComponent 
              selectedFrame={selectedFrame} 
              onSelectFrame={setSelectedFrame} 
            />
            
            <CaptionComponent 
              caption={caption} 
              onCaptionChange={setCaption}
              fontStyle={fontStyle}
              onFontStyleChange={setFontStyle}
              textColor={textColor}
              onTextColorChange={setTextColor}
            />
            
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
          
          {/* Preview and Download */}
          <div className="space-y-4">
            <PhotoStripComponent 
              photos={photos}
              filter={selectedFilter}
              frame={selectedFrame}
              caption={caption}
              fontStyle={fontStyle}
              textColor={textColor}
              canvasRef={photoStripRef}
            />
            
            <button
              onClick={downloadPhotoStrip}
              className="w-full vintage-button flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Photostrip
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
