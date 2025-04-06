'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Camera, Timer, ImagePlus, Trash2, Save } from 'lucide-react'
import FilterComponent, { FilterType } from './FilterComponent'
import FrameComponent, { FrameType } from './FrameComponent'
import CaptionComponent, { FontStyle } from './CaptionComponent'
import PhotoStripComponent from './PhotoStripComponent'
import { savePhotoStripSession, uploadBase64Image } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

interface Photo {
  id: string
  dataUrl: string
}

export default function PhotoboothComponent() {
  // Photo capturing state
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [captureMessage, setCaptureMessage] = useState<string | null>(null)
  const [processingPhotos, setProcessingPhotos] = useState(false)
  
  // Add camera facing mode state
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  
  // Photography customization state
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('raw')
  const [selectedFrame, setSelectedFrame] = useState<FrameType>('classic')
  const [caption, setCaption] = useState('')
  const [fontStyle, setFontStyle] = useState<FontStyle>('vintage')
  const [textColor, setTextColor] = useState<string>('#5e503f') // Default brown color
  
  // UI state
  const [showCustomization, setShowCustomization] = useState(false)
  const [isPortrait, setIsPortrait] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null)
  const [savedUrl, setSavedUrl] = useState<string | null>(null)
  
  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const photoIdCounter = useRef(0)
  const photoStripRef = useRef<HTMLCanvasElement>(null)

  // Add a new state variable for the flash effect
  const [showFlash, setShowFlash] = useState(false)

  // Add sessionId state
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Check device type and orientation
  useEffect(() => {
    const checkDeviceType = () => {
      const isMobile = window.innerWidth <= 768
      setIsPortrait(isMobile)
    }

    // Initial check
    checkDeviceType()

    // Listen for resize events
    window.addEventListener('resize', checkDeviceType)

    return () => {
      window.removeEventListener('resize', checkDeviceType)
    }
  }, [])

  // Initialize camera on mount
  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [isPortrait, facingMode]) // Restart camera when orientation changes and facingMode changes

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
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                setCaptureMessage("Capture your moment when you're ready")
              })
              .catch(error => {
                console.error('Error playing video:', error)
                alert('Error starting camera stream. Please try again.')
                stopCamera()
              })
          }
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please check your camera permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
      })
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  // Set up an effect to auto-save when entering customization mode
  useEffect(() => {
    // Only auto-save if we have photos, are in customization mode, and haven't already saved
    if (showCustomization && photos.length === 3 && !sessionId && !saveSuccess) {
      // Wait for the PhotoStripComponent to fully render
      const timer = setTimeout(() => {
        console.log('Auto-saving photos to Supabase...');
        autoSaveToCloud();
      }, 1500); // Longer delay to ensure canvas is fully rendered
      
      return () => clearTimeout(timer);
    }
  }, [showCustomization, photos, sessionId, saveSuccess]);

  // Start the automatic photo capture sequence
  const startPhotoSequence = () => {
    // Initialize an array with three empty slots
    setPhotos(Array(3).fill(null));
    setCurrentPhotoIndex(0);
    setIsCapturing(true);
    
    // Begin the capture sequence for the first photo
    startCountdownForPhoto(0);
  }

  // Start countdown for a specific photo in the sequence
  const startCountdownForPhoto = (photoIndex: number) => {
    setCaptureMessage(`Get ready to capture memory ${photoIndex + 1} of 3`)
    setCountdown(3)
    
    // Use fixed time intervals with clearTimeout for more consistent timing
    const countdownStep = (remaining: number) => {
      if (remaining <= 0) {
        capturePhoto(photoIndex)
        return
      }
      
      setCountdown(remaining)
      
      // Schedule next countdown step with a fixed timeout
      setTimeout(() => countdownStep(remaining - 1), 1000)
    }
    
    // Start the countdown
    countdownStep(3)
  }

  const capturePhoto = (photoIndex: number) => {
    if (videoRef.current) {
      console.log(`Capturing photo at index: ${photoIndex}`);
      
      // Trigger camera flash effect
      setShowFlash(true)
      setTimeout(() => setShowFlash(false), 300) // Flash duration: 300ms
      
      const canvas = document.createElement('canvas')
      const video = videoRef.current
      
      // Match dimensions to what PhotoStripComponent expects
      const canvasWidth = 450 * 0.85 // photoWidth from PhotoStripComponent (original dimension)
      const canvasHeight = canvasWidth * 0.6 // photoHeight from PhotoStripComponent
      
      // Set canvas to the desired aspect ratio
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        // Calculate how to center and crop video to match desired aspect ratio (1:0.6)
        const videoAspect = video.videoWidth / video.videoHeight
        const targetAspect = canvasWidth / canvasHeight // Same as 1 / 0.6
        
        let srcX = 0, srcY = 0, srcWidth = video.videoWidth, srcHeight = video.videoHeight
        
        // Crop video to match target aspect ratio
        if (videoAspect > targetAspect) {
          // Video is wider than target, crop sides
          srcWidth = video.videoHeight * targetAspect
          srcX = (video.videoWidth - srcWidth) / 2
        } else {
          // Video is taller than target, crop top/bottom
          srcHeight = video.videoWidth / targetAspect
          srcY = (video.videoHeight - srcHeight) / 2
        }
        
        // For selfie view, we need to mirror horizontally
        ctx.save()
        if (facingMode === 'user') {
          ctx.scale(-1, 1) // Mirror horizontally for front camera only
          ctx.drawImage(
            video,
            srcX, srcY, srcWidth, srcHeight, // Source coordinates
            -canvasWidth, 0, canvasWidth, canvasHeight // Destination coordinates (negative x for mirroring)
          )
        } else {
          // No mirroring for back camera
          ctx.drawImage(
            video,
            srcX, srcY, srcWidth, srcHeight, // Source coordinates
            0, 0, canvasWidth, canvasHeight // Destination coordinates (no mirroring)
          )
        }
        ctx.restore()
        
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
          
          // Add a subtle vignette effect
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
          ctx.beginPath()
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
        
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0) // Use maximum quality
        const newId = `photo-${photoIdCounter.current++}`
        
        // Update the photos array with the new photo
        const newPhoto: Photo = {
          id: newId,
          dataUrl: dataUrl,
        }
        
        setPhotos(prev => {
          const newPhotos = [...prev]
          newPhotos[photoIndex] = newPhoto
          return newPhotos
        })
        
        // Update UI state
        console.log(`Photo ${photoIndex + 1} captured`)
        
        // Determine what to do next
        if (photoIndex < 2) {
          // Schedule the next photo capture with a delay
          setTimeout(() => {
            startCountdownForPhoto(photoIndex + 1)
          }, 1500) // 1.5 second pause between photos
        } else {
          // All photos captured
          setIsCapturing(false)
          setCurrentPhotoIndex(0)
          setCountdown(0)
          setCaptureMessage('Memories captured! Customize your photostrip.')
          setProcessingPhotos(false)
          
          // Automatically enter customization mode
          setShowCustomization(true)
          
          // No longer call autoSaveToCloud() here - it will be handled by the useEffect
        }
      }
    } else {
      console.error('Video element is not available')
    }
  }

  const retakePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id))
    setShowCustomization(false) // Go back to capture mode if we're removing photos
  }

  const resetPhotobooth = () => {
    setPhotos([])
    setShowCustomization(false)
    setSelectedFilter('raw')
    setSelectedFrame('filmstrip')
    setCaption('')
    setFontStyle('vintage')
    setTextColor('#5e503f')
    startCamera()
  }

  // Function to handle filter change
  const handleFilterChange = (filter: FilterType) => {
    setSelectedFilter(filter)
  }

  // Function to handle frame change
  const handleFrameChange = (frame: FrameType) => {
    setSelectedFrame(frame)
  }

  // Function to handle caption change
  const handleCaptionChange = (text: string) => {
    setCaption(text)
  }

  // Function to handle font style change
  const handleFontStyleChange = (style: FontStyle) => {
    setFontStyle(style)
  }

  // Function to handle text color change
  const handleTextColorChange = (color: string) => {
    setTextColor(color)
  }

  // Function to auto-save the photostrip to Supabase
  const autoSaveToCloud = async () => {
    try {
      // Check if we have a valid canvas and photos
      if (!photoStripRef.current) {
        console.error('Cannot auto-save: Canvas not ready');
        return;
      }
      
      const filteredPhotos = photos.filter(photo => photo !== null);
      if (filteredPhotos.length < 3) {
        console.error('Cannot auto-save: Not enough photos');
        return;
      }
      
      // Check if already saving or saved
      if (saving || saveSuccess === true) {
        return;
      }
      
      setSaving(true);
      setSaveSuccess(null);
      setCaptureMessage('Automatically saving your photostrip...');
      
      // Wait longer to ensure the canvas is fully rendered with the caption
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force a redraw if there's a caption to ensure it's rendered
      if (caption) {
        // Type assertion for the canvas element with renderPhotoStrip method
        const enhancedCanvas = photoStripRef.current as unknown as HTMLCanvasElement & { 
          renderPhotoStrip: () => Promise<void> 
        };
        
        if (typeof enhancedCanvas.renderPhotoStrip === 'function') {
          await enhancedCanvas.renderPhotoStrip();
          // Additional wait after rendering
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Get the photostrip canvas data URL
      const photoStripDataUrl = photoStripRef.current.toDataURL('image/jpeg', 0.95);
      
      console.log('Auto-saving photos to Supabase from PhotoboothComponent...');
      
      // Save the session to Supabase
      const result = await savePhotoStripSession(
        filteredPhotos,
        photoStripDataUrl,
        caption
      );
      
      console.log('Auto-save completed, result:', result);
      
      if (result) {
        setSaveSuccess(true);
        setSavedUrl(result.url);
        setSessionId(result.sessionId);
        setCaptureMessage(null); // Clear the message
      } else {
        setSaveSuccess(false);
        setCaptureMessage('Auto-save failed, but you can still customize your photostrip.');
      }
    } catch (error) {
      console.error('Error in auto-save:', error);
      setSaveSuccess(false);
      setCaptureMessage('Error during auto-save, but you can still customize your photostrip.');
    } finally {
      setSaving(false);
    }
  };

  // Update the savePhotoStrip function to store sessionId
  const savePhotoStrip = async () => {
    try {
      if (!photoStripRef.current || photos.length < 3) {
        console.error('Cannot save photostrip: Canvas or photos not ready')
        return
      }

      setSaving(true)
      setSaveSuccess(null)
      
      // Ensure the photostrip is fully rendered with the caption
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Get the photostrip canvas data URL with caption rendered
      const photoStripDataUrl = photoStripRef.current.toDataURL('image/jpeg', 0.95)
      
      console.log('Starting save operation with Supabase...')
      
      // Check if we already have a sessionId (from auto-save)
      if (sessionId) {
        console.log('Updating existing session with rendered caption:', sessionId)
        
        // Fetch the existing session data to get the storage path
        const { data: sessionData, error: fetchError } = await supabase
          .from('sessions')
          .select('photostrip_url')
          .eq('id', sessionId)
          .single();
          
        if (fetchError || !sessionData?.photostrip_url) {
          console.error('Error fetching existing session data:', fetchError);
          setSaveSuccess(false);
          setCaptureMessage('Error fetching session data.');
          return;
        }
        
        // Extract the storage path from the URL
        const storageUrl = sessionData.photostrip_url;
        const pathMatch = storageUrl.match(/\/storage\/v1\/object\/public\/photostrips\/(.*)/);
        
        if (!pathMatch || !pathMatch[1]) {
          console.error('Could not parse storage path from URL:', storageUrl);
          setSaveSuccess(false);
          setCaptureMessage('Error processing photostrip URL.');
          return;
        }
        
        // Reuse the same path to update the file
        const storagePath = decodeURIComponent(pathMatch[1]);
        
        console.log('Uploading updated photostrip to existing path:', storagePath);
        const updatedUrl = await uploadBase64Image('photostrips', storagePath, photoStripDataUrl);
        
        if (!updatedUrl) {
          console.error('Failed to upload updated photostrip');
          setSaveSuccess(false);
          setCaptureMessage('Failed to upload updated photostrip.');
          return;
        }
        
        // Update the database record with caption
        const { data, error } = await supabase
          .from('sessions')
          .update({
            captions: caption || ''
          })
          .eq('id', sessionId)
          .select()
          .single()
          
        if (error) {
          console.error('Error updating session caption:', error)
          setSaveSuccess(false)
          setCaptureMessage('Error updating your photostrip caption.')
        } else {
          setSaveSuccess(true)
          setSavedUrl(updatedUrl)
          setCaptureMessage('Your photostrip has been updated!')
        }
      } else {
        // Get the photostrip canvas data URL for a new session
        const result = await savePhotoStripSession(
          photos,
          photoStripDataUrl,
          caption
        )
        
        console.log('Supabase operation completed, returned result:', result)
        
        if (result) {
          setSaveSuccess(true)
          setSavedUrl(result.url)
          setSessionId(result.sessionId)
          setCaptureMessage('Your photostrip has been saved!')
        } else {
          setSaveSuccess(false)
          setCaptureMessage('Failed to save your photostrip, please try again.')
        }
      }
    } catch (error) {
      console.error('Error saving photostrip:', error)
      setSaveSuccess(false)
      setCaptureMessage('Error saving your photostrip, please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Add a function to toggle camera
  const toggleCamera = async () => {
    // Stop the current camera stream
    stopCamera()
    
    // Toggle the facing mode
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
    
    // Restart camera with new facing mode (will happen in useEffect)
  }

  // Add a save complete handler
  const handleSaveComplete = () => {
    console.log('Save completed successfully');
    setSaveSuccess(true);
    setCaptureMessage('Your photostrip has been saved!');
  };

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
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} // Mirror only for selfie view
            />
            
            {/* Add camera switch button */}
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
            
            {/* Camera Flash Effect */}
            {showFlash && (
              <div className="absolute inset-0 bg-white bg-opacity-70 animate-flash z-10"></div>
            )}
            
            {/* Overlay for countdown and messaging */}
            {(countdown > 0 || captureMessage || processingPhotos) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white">
                {captureMessage && (
                  <div className="mb-4 text-xl font-vintage text-center px-4">
                    {captureMessage}
                  </div>
                )}

                {countdown > 0 && (
                  <div className="text-6xl font-bold">
                    {countdown}
                  </div>
                )}

                {processingPhotos && (
                  <div className="mt-4 text-xl">
                    <div className="animate-pulse">Please wait...</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-3 gap-4">
            {photos.filter(photo => photo !== null).map((photo, index) => (
              <div key={photo.id} className={`relative ${isPortrait ? 'aspect-[9/16]' : 'aspect-[16/9]'} border-4 border-vintage-sepia`}>
                <img
                  src={photo.dataUrl}
                  alt={`Memory ${index + 1}`}
                  className="w-full h-full object-cover"
                />
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
            
            {/* Empty slots */}
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
                disabled={isCapturing || processingPhotos}
                className="vintage-button flex items-center gap-2 disabled:opacity-50"
              >
                <Camera className="w-5 h-5" />
                Capture Memories
              </button>
            ) : photos.filter(photo => photo !== null).length === 3 && !isCapturing ? (
              <button 
                onClick={() => setShowCustomization(true)}
                className="vintage-button"
              >
                Create Nostalgic Photostrip
              </button>
            ) : (
              <button 
                disabled
                className="vintage-button opacity-50 flex items-center gap-2"
              >
                <Timer className="w-5 h-5 animate-spin" />
                Capturing Memories...
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
                onClick={resetPhotobooth}
                className="px-6 py-3 border border-red-500 text-red-500 rounded-lg"
              >
                Start Over
              </button>
            </div>
          </div>
          
          {/* Photostrip preview and download */}
          <div>
            {photos.length > 0 && showCustomization && (
              <div className="mt-6">
                <PhotoStripComponent
                  photos={photos}
                  filter={selectedFilter}
                  frame={selectedFrame}
                  caption={caption}
                  fontStyle={fontStyle}
                  textColor={textColor}
                  canvasRef={photoStripRef}
                  sessionId={sessionId || undefined}
                  onSaveComplete={handleSaveComplete}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 