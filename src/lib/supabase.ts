import { createClient } from '@supabase/supabase-js'

// Check if we're running on the client side
const isBrowser = typeof window !== 'undefined'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Only log in browser environment to avoid build errors
if (isBrowser) {
  // Log environment variables for debugging (only display part of the key for security)
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Key (first 5 chars):', supabaseAnonKey ? supabaseAnonKey.substring(0, 5) + '...' : 'missing')

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
  }
}

// Create a dummy client for SSR if environment variables are missing
export const supabase = (!supabaseUrl || !supabaseAnonKey) && !isBrowser
  ? {
      // Provide dummy implementations that won't break SSR
      storage: {
        from: () => ({
          upload: async () => ({ data: null, error: new Error('Supabase not initialized') }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
      },
      from: () => ({
        select: () => ({ data: null, error: new Error('Supabase not initialized') }),
        insert: () => ({ data: null, error: new Error('Supabase not initialized') }),
        update: () => ({ data: null, error: new Error('Supabase not initialized') }),
      }),
    } as any
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Don't persist the session in browser storage
        autoRefreshToken: false, // Don't automatically refresh the token
      },
      global: {
        fetch: (...args) => fetch(...args), // Use the browser's fetch
        headers: { 'X-Client-Info': 'photobooth-app' }, // Add custom header for tracking
      },
    })

// Test function to check database connectivity - call this from a component
export const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...')
    
    // Try a simple select query to verify connection
    const { data, error, count } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('Database test failed:', error)
      return { success: false, error }
    } else {
      console.log('Database test successful!')
      return { 
        success: true, 
        message: 'Connection successful',
        count: count || 0
      }
    }
  } catch (error) {
    console.error('Database test threw exception:', error)
    return { success: false, error }
  }
}

// Function to upload an image to Supabase Storage
export const uploadImage = async (
  bucketName: string,
  filePath: string,
  file: File | Blob | string,
  contentType?: string
): Promise<string | null> => {
  try {
    // Convert base64 data URL to Blob if necessary
    let fileBlob: File | Blob = file instanceof Blob ? file : new Blob([])
    if (typeof file === 'string' && file.startsWith('data:')) {
      fileBlob = dataURLtoBlob(file)
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBlob, {
        contentType: contentType || 'image/jpeg',
        upsert: true,
      })

    if (error) {
      console.error('Error uploading image:', error)
      return null
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return publicUrlData.publicUrl
  } catch (error) {
    console.error('Error in uploadImage:', error)
    return null
  }
}

// Function to upload a base64 image to Supabase Storage
export const uploadBase64Image = async (
  bucketName: string,
  filePath: string,
  base64DataUrl: string
): Promise<string | null> => {
  try {
    // Convert base64 data URL to Blob
    const blob = dataURLtoBlob(base64DataUrl)
    
    return await uploadImage(bucketName, filePath, blob)
  } catch (error) {
    console.error('Error in uploadBase64Image:', error)
    return null
  }
}

// Helper function to convert a data URL to a Blob
function dataURLtoBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  
  return new Blob([u8arr], { type: mime })
}

// Function to save a photostrip session in Supabase - simplified version
export const savePhotoStripSession = async (
  photos: { id: string | number, dataUrl: string }[],
  photoStripUrl: string,
  captions?: string
): Promise<string | null> => {
  try {
    // First, upload all individual photos
    const photoUploadPromises = photos.map((photo, index) => 
      uploadBase64Image(
        'photostrips',
        `sessions/${Date.now()}_${index}/photo_${index}.jpg`,
        photo.dataUrl
      )
    )
    
    const uploadedPhotoUrls = await Promise.all(photoUploadPromises)
    console.log('Uploaded photo URLs:', uploadedPhotoUrls)
    
    // Then, upload the photostrip
    const sessionTimestamp = Date.now()
    const photoStripPath = `sessions/${sessionTimestamp}/photostrip.jpg`
    const photoStripStorageUrl = await uploadBase64Image(
      'photostrips', 
      photoStripPath, 
      photoStripUrl
    )
    
    console.log('Photostrip URL:', photoStripStorageUrl)
    
    if (!photoStripStorageUrl) {
      console.error('Failed to upload photostrip')
      return null
    }
    
    // ---- DIRECT APPROACH: Insert all data at once ----
    console.log('Inserting session data directly...')
    
    // Prepare session data
    const sessionData = {
      created_at: new Date().toISOString(),
      photo_urls: JSON.stringify(uploadedPhotoUrls.filter(Boolean)),
      photostrip_url: photoStripStorageUrl,
      captions: captions || ''
    }
    
    try {
      // Single direct insert with all data
      const { error } = await supabase
        .from('sessions')
        .insert(sessionData)
      
      if (error) {
        console.error('Database insert error:', error)
        // Even if DB insert fails, return the photostrip URL since images are saved
        return photoStripStorageUrl
      }
      
      console.log('Successfully saved session data')
      return photoStripStorageUrl
    } catch (dbError) {
      console.error('Exception during database operation:', dbError)
      return photoStripStorageUrl // Return URL even if DB insertion fails
    }
  } catch (error) {
    console.error('Error in savePhotoStripSession:', error)
    return null
  }
}

// Function to retrieve saved photostrip sessions
export const getSavedPhotoStripSessions = async (limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching sessions:', error)
      return null
    }
    
    // Define session interface to avoid 'any' type
    interface SessionRecord {
      id: string;
      created_at: string;
      photo_urls: string | string[];
      photostrip_url: string;
      captions: string;
      [key: string]: any; // Allow other properties
    }
    
    // Parse the photo_urls JSON strings back to arrays
    const sessionsWithParsedUrls = data.map((session: SessionRecord) => ({
      ...session,
      photo_urls: typeof session.photo_urls === 'string' 
        ? JSON.parse(session.photo_urls) 
        : session.photo_urls
    }))
    
    return sessionsWithParsedUrls
  } catch (error) {
    console.error('Error in getSavedPhotoStripSessions:', error)
    return null
  }
} 