import { Pool } from '@neondatabase/serverless'

// Check if we're running on the server side (Neon only works server-side)
const isServer = typeof window === 'undefined'

// Get environment variables
const databaseUrl = process.env.DATABASE_URL || ''

// Create a single pool for the entire app (server-side only)
let pool: Pool | null = null

const getPool = () => {
  if (!isServer) {
    throw new Error('Database operations can only be performed server-side')
  }
  
  if (!pool && databaseUrl) {
    pool = new Pool({ connectionString: databaseUrl })
  }
  return pool
}

// Create a mock supabase client for client-side compatibility
// All actual database operations will happen through API routes
const createMockSupabaseClient = () => {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithOAuth: async () => ({ data: { url: null }, error: new Error('Auth not configured') }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
        }),
        order: () => ({
          limit: () => ({
            then: async () => ({ data: [], error: null }),
          }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  }
}

// Export the supabase client (mock on client, real pool on server)
export const supabase = isServer ? (getPool() as any) : createMockSupabaseClient()

// Test function to check database connectivity
export const testDatabaseConnection = async () => {
  try {
    if (!isServer) {
      // On client side, make an API call
      const response = await fetch('/api/test-db')
      return await response.json()
    }
    
    console.log('Testing database connection...')
    
    const dbPool = getPool()
    if (!dbPool) {
      throw new Error('Database pool not initialized - check DATABASE_URL')
    }
    
    const client = await dbPool.connect()
    const result = await client.query('SELECT NOW()')
    client.release()
    
    console.log('Database test successful!')
    return { 
      success: true, 
      message: 'Connection successful',
      timestamp: result.rows[0].now
    }
  } catch (error: any) {
    console.error('Database test failed:', error)
    return { success: false, error: error.message }
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

// Helper function to convert Blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Function to upload an image (stores in database as base64 for now)
export const uploadImage = async (
  bucketName: string,
  filePath: string,
  file: File | Blob | string,
  contentType?: string
): Promise<string | null> => {
  try {
    // For now, return the data URL directly
    // In production, you should use Cloudinary, AWS S3, or Vercel Blob
    if (typeof file === 'string') {
      return file
    }
    return await blobToBase64(file)
  } catch (error) {
    console.error('Error uploading image:', error)
    return null
  }
}

// Function to upload a base64 image
export const uploadBase64Image = async (
  bucketName: string,
  filePath: string,
  base64DataUrl: string
): Promise<string | null> => {
  try {
    // Return the base64 data URL directly
    // In production, upload to Cloudinary/S3 and return the URL
    return base64DataUrl
  } catch (error) {
    console.error('Error in uploadBase64Image:', error)
    return null
  }
}

// Function to save a photostrip session
export const savePhotoStripSession = async (
  photos: { id: string | number, dataUrl: string }[],
  photoStripUrl: string,
  captions?: string,
  memoryNotes?: string
): Promise<{ url: string; sessionId: string } | null> => {
  try {
    if (!isServer) {
      // On client side, make an API call
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos,
          photoStripUrl,
          captions,
          memoryNotes
        })
      })
      return await response.json()
    }
    
    const dbPool = getPool()
    if (!dbPool) {
      throw new Error('Database pool not initialized')
    }
    
    const client = await dbPool.connect()
    
    try {
      // Insert the session data
      const result = await client.query(
        `INSERT INTO sessions (created_at, photo_urls, photostrip_url, captions, memory_notes) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id`,
        [
          new Date().toISOString(),
          JSON.stringify(photos.map(p => p.dataUrl)),
          photoStripUrl,
          captions || '',
          memoryNotes || ''
        ]
      )
      
      const sessionId = result.rows[0].id
      console.log('Successfully saved session data with ID:', sessionId)
      
      return { url: photoStripUrl, sessionId }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error in savePhotoStripSession:', error)
    return null
  }
}

// Function to retrieve saved photostrip sessions
export const getSavedPhotoStripSessions = async (
  limit = 20,
  dateFilter?: { year?: number, month?: number, day?: number }
) => {
  try {
    if (!isServer) {
      // On client side, make an API call
      const params = new URLSearchParams()
      params.append('limit', limit.toString())
      if (dateFilter?.year) params.append('year', dateFilter.year.toString())
      if (dateFilter?.month) params.append('month', dateFilter.month.toString())
      if (dateFilter?.day) params.append('day', dateFilter.day.toString())
      
      const response = await fetch(`/api/sessions?${params}`)
      return await response.json()
    }
    
    const dbPool = getPool()
    if (!dbPool) {
      throw new Error('Database pool not initialized')
    }
    
    const client = await dbPool.connect()
    
    try {
      let query = 'SELECT * FROM sessions ORDER BY created_at DESC LIMIT $1'
      const params: any[] = [limit]
      
      // Apply date filtering if provided
      if (dateFilter) {
        const { year, month, day } = dateFilter
        
        if (year && month && day) {
          // Filter by specific date
          const startDate = new Date(year, month - 1, day).toISOString()
          const endDate = new Date(year, month - 1, day + 1).toISOString()
          query = 'SELECT * FROM sessions WHERE created_at >= $2 AND created_at < $3 ORDER BY created_at DESC LIMIT $1'
          params.push(startDate, endDate)
        } else if (year && month) {
          // Filter by month
          const startDate = new Date(year, month - 1, 1).toISOString()
          const endDate = new Date(year, month, 1).toISOString()
          query = 'SELECT * FROM sessions WHERE created_at >= $2 AND created_at < $3 ORDER BY created_at DESC LIMIT $1'
          params.push(startDate, endDate)
        } else if (year) {
          // Filter by year
          const startDate = new Date(year, 0, 1).toISOString()
          const endDate = new Date(year + 1, 0, 1).toISOString()
          query = 'SELECT * FROM sessions WHERE created_at >= $2 AND created_at < $3 ORDER BY created_at DESC LIMIT $1'
          params.push(startDate, endDate)
        }
      }
      
      const result = await client.query(query, params)
      
      console.log(`Query returned ${result.rows.length} sessions`)
      
      // Process the results
      const processedData = result.rows.map((session: any) => {
        // Make sure photo_urls is an array
        let photoUrls: string[] = []
        if (typeof session.photo_urls === 'string') {
          try {
            photoUrls = JSON.parse(session.photo_urls)
          } catch (e) {
            console.error('Error parsing photo_urls:', e)
          }
        } else if (Array.isArray(session.photo_urls)) {
          photoUrls = session.photo_urls
        }
        
        return {
          ...session,
          photo_urls: photoUrls
        }
      })
      
      return processedData
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error in getSavedPhotoStripSessions:', error)
    return []
  }
}

// Function to update memory notes and/or caption for an existing session
export const updateSessionMemoryNotes = async (
  sessionId: string,
  memoryNotes: string,
  caption?: string
): Promise<boolean> => {
  try {
    if (!isServer) {
      // On client side, make an API call
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryNotes, caption })
      })
      return response.ok
    }
    
    const dbPool = getPool()
    if (!dbPool) {
      throw new Error('Database pool not initialized')
    }
    
    const client = await dbPool.connect()
    
    try {
      // Prepare update query
      let query = 'UPDATE sessions SET memory_notes = $1'
      const params: any[] = [memoryNotes]
      
      if (caption !== undefined) {
        query += ', captions = $2'
        params.push(caption)
      }
      
      query += ` WHERE id = $${params.length + 1}`
      params.push(sessionId)
      
      await client.query(query, params)
      
      console.log('Successfully updated session:', sessionId)
      return true
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error in updateSessionMemoryNotes:', error)
    return false
  }
}

// Helper function to debug auth state (now returns null since auth is removed)
export const debugAuthState = async () => {
  console.log('Auth not configured with Neon database')
  return { user: null, session: null }
}

// Debug function to get all sessions (admin only)
export const getAllSessions = async (limit = 100) => {
  // Same as getSavedPhotoStripSessions without user filter
  return getSavedPhotoStripSessions(limit)
}
