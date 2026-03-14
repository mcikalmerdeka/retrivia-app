'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Camera, Timer, ImagePlus, Trash2, Download } from 'lucide-react'
import FilterComponent, { FilterType } from './FilterComponent'
import FrameComponent, { FrameType } from './FrameComponent'
import CaptionComponent, { FontStyle } from './CaptionComponent'
import PhotoStripComponent from './PhotoStripComponent'

interface Photo {
  id: string
  dataUrl: string
}

export default function PhotoboothComponent() {
  // Photo capturing state
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [captureMessage, setCaptureMessage] = useState<string | null>(null)
  
  // Camera facing mode
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  
  // Customization state
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('raw')
  const [selectedFrame, setSelectedFrame] = useState<FrameType>('classic')
  const [caption, setCaption] = useState('')
  const [fontStyle, setFontStyle] = useState<FontStyle>('vintage')
  const [textColor, setTextColor] = useState<string>('#5e503f')
  
  // UI state
  const [showCustomization, setShowCustomization] = useState(false)
  const [isPortrait, setIsPortrait] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  
  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const photoIdCounter = useRef(0)
  const photoStripRef = useRef<HTMLCanvasElement>(null)

  // Check device type
  useEffect(() => {
    const checkDeviceType = () => {
      setIsPortrait(window.innerWidth <= 768)
    }
    checkDeviceType()
    window.addEventListener('resize', checkDeviceType)
    return () => window.removeEventListener('resize', checkDeviceType)
  }, [])

  // Initialize camera
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [isPortrait, facingMode])

  const startCamera = async () => {
    try {
      setCaptureMessage("Accessing camera...")
      const constraints = {
        video: {
          width: { ideal: isPortrait ? 720 : 1280 },
          height: { ideal: isPortrait ? 1280 : 720 },
          facingMode: facingMode
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
            .then(() => setCaptureMessage("Ready to capture!"))
            .catch(() => {
              alert('Error starting camera. Please try again.')
              stopCamera()
            })
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const startPhotoSequence = () => {
    setPhotos(Array(3).fill(null))
    setIsCapturing(true)
    startCountdownForPhoto(0)
  }

  const startCountdownForPhoto = (photoIndex: number) => {
    setCaptureMessage(`Photo ${photoIndex + 1} of 3`)
    setCountdown(3)
    
    const countdownStep = (remaining: number) => {
      if (remaining <= 0) {
        capturePhoto(photoIndex)
        return
      }
      setCountdown(remaining)
      setTimeout(() => countdownStep(remaining - 1), 1000)
    }
    countdownStep(3)
  }

  const capturePhoto = (photoIndex: number) => {
    if (!videoRef.current) return

    setShowFlash(true)
    setTimeout(() => setShowFlash(false), 300)

    const canvas = document.createElement('canvas')
    const video = videoRef.current
    const canvasWidth = 450 * 0.85
    const canvasHeight = canvasWidth * 0.6

    canvas.width = canvasWidth
    canvas.height = canvasHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const videoAspect = video.videoWidth / video.videoHeight
    const targetAspect = canvasWidth / canvasHeight

    let srcX = 0, srcY = 0, srcWidth = video.videoWidth, srcHeight = video.videoHeight

    if (videoAspect > targetAspect) {
      srcWidth = video.videoHeight * targetAspect
      srcX = (video.videoWidth - srcWidth) / 2
    } else {
      srcHeight = video.videoWidth / targetAspect
      srcY = (video.videoHeight - srcHeight) / 2
    }

    ctx.save()
    if (facingMode === 'user') {
      ctx.scale(-1, 1)
      ctx.drawImage(video, srcX, srcY, srcWidth, srcHeight, -canvasWidth, 0, canvasWidth, canvasHeight)
    } else {
      ctx.drawImage(video, srcX, srcY, srcWidth, srcHeight, 0, 0, canvasWidth, canvasHeight)
    }
    ctx.restore()

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

    const dataUrl = canvas.toDataURL('image/jpeg', 1.0)
    const newPhoto: Photo = { id: `photo-${photoIdCounter.current++}`, dataUrl }

    setPhotos(prev => {
      const newPhotos = [...prev]
      newPhotos[photoIndex] = newPhoto
      return newPhotos
    })

    if (photoIndex < 2) {
      setTimeout(() => startCountdownForPhoto(photoIndex + 1), 1500)
    } else {
      setIsCapturing(false)
      setCountdown(0)
      setShowCustomization(true)
    }
  }

  const retakePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id))
    if (photos.filter(p => p !== null).length <= 1) {
      setShowCustomization(false)
    }
  }

  const resetPhotobooth = () => {
    setPhotos([])
    setShowCustomization(false)
    setSelectedFilter('raw')
    setSelectedFrame('classic')
    setCaption('')
    setFontStyle('vintage')
    setTextColor('#5e503f')
    startCamera()
  }

  const downloadPhotoStrip = () => {
    if (!photoStripRef.current) return

    const link = document.createElement('a')
    link.download = `retrivia-photostrip-${Date.now()}.jpg`
    link.href = photoStripRef.current.toDataURL('image/jpeg', 0.95)
    link.click()
  }

  const toggleCamera = () => {
    stopCamera()
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto film-grain">
      {!showCustomization ? (
        <>
          {/* Camera View */}
          <div className={`camera-container ${isPortrait ? 'aspect-[9/16]' : 'aspect-[16/9]'} min-h-[400px] relative`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />
            
            <button 
              onClick={toggleCamera}
              className="absolute top-4 right-4 z-10 bg-vintage-paper bg-opacity-70 p-2 rounded-full border border-vintage-sepia"
              aria-label="Switch Camera"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 16v4a2 2 0 0 1-2 2h-4" />
                <path d="M14 14V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
                <path d="m18 8 4 4-4 4" />
                <path d="m6 16-4-4 4-4" />
              </svg>
            </button>
            
            {showFlash && (
              <div className="absolute inset-0 bg-white bg-opacity-70 animate-flash z-10"></div>
            )}
            
            {(countdown > 0 || captureMessage) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white">
                {captureMessage && (
                  <div className="mb-4 text-xl font-vintage text-center px-4">{captureMessage}</div>
                )}
                {countdown > 0 && (
                  <div className="text-6xl font-bold">{countdown}</div>
                )}
              </div>
            )}
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-3 gap-4">
            {photos.filter(photo => photo !== null).map((photo, index) => (
              <div key={photo.id} className={`relative ${isPortrait ? 'aspect-[9/16]' : 'aspect-[16/9]'} border-4 border-vintage-sepia`}>
                <img src={photo.dataUrl} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                {!isCapturing && (
                  <button
                    onClick={() => retakePhoto(photo.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            
            {Array.from({ length: Math.max(0, 3 - photos.filter(photo => photo !== null).length) }).map((_, index) => (
              <div 
                key={`empty-${index}`} 
                className={`${isPortrait ? 'aspect-[9/16]' : 'aspect-[16/9]'} border-4 border-dashed border-vintage-sepia flex items-center justify-center text-vintage-sepia`}
              >
                <ImagePlus className="w-8 h-8" />
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            {photos.filter(photo => photo !== null).length < 3 && !isCapturing ? (
              <button
                onClick={startPhotoSequence}
                disabled={isCapturing}
                className="vintage-button flex items-center gap-2 disabled:opacity-50"
              >
                <Camera className="w-5 h-5" />
                Capture 3 Photos
              </button>
            ) : photos.filter(photo => photo !== null).length === 3 && !isCapturing ? (
              <button 
                onClick={() => setShowCustomization(true)}
                className="vintage-button"
              >
                Edit & Download
              </button>
            ) : (
              <button disabled className="vintage-button opacity-50 flex items-center gap-2">
                <Timer className="w-5 h-5 animate-spin" />
                Capturing...
              </button>
            )}
            
            {photos.filter(photo => photo !== null).length > 0 && !isCapturing && (
              <button 
                onClick={resetPhotobooth}
                className="px-6 py-3 border border-vintage-primary text-vintage-primary rounded-lg"
              >
                Start Over
              </button>
            )}
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
                onClick={resetPhotobooth}
                className="px-6 py-3 border border-red-500 text-red-500 rounded-lg"
              >
                Start Over
              </button>
            </div>
          </div>
          
          {/* Preview and Download */}
          <div>
            {photos.length > 0 && (
              <div className="mt-6 space-y-4">
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
            )}
          </div>
        </div>
      )}
    </div>
  )
}
