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

// Create a single supabase client for the entire app
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    }
  }
)

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

// Function to save a photostrip session in Supabase
export const savePhotoStripSession = async (
  photos: { id: string | number, dataUrl: string }[],
  photoStripUrl: string,
  captions?: string,
  memoryNotes?: string
): Promise<{ url: string; sessionId: string } | null> => {
  try {
    // Get the current authenticated user
    console.log('Getting user for saving photo session');
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    console.log('Saving session for user:', userId ? `ID: ${userId.substring(0, 8)}...` : 'anonymous');

    // First, upload all individual photos
    const sessionTimestamp = Date.now();
    const userFolder = userId ? `user_${userId}` : 'anonymous';
    const sessionFolder = `${userFolder}/${sessionTimestamp}`;
    
    const photoUploadPromises = photos.map((photo, index) => 
      uploadBase64Image(
        'photostrips',
        `sessions/${sessionFolder}/photo_${index}.jpg`,
        photo.dataUrl
      )
    );
    
    const uploadedPhotoUrls = await Promise.all(photoUploadPromises);
    console.log(`Uploaded ${uploadedPhotoUrls.filter(Boolean).length}/${photos.length} photos successfully`);
    
    // Then, upload the photostrip
    const photoStripPath = `sessions/${sessionFolder}/photostrip.jpg`;
    const photoStripStorageUrl = await uploadBase64Image(
      'photostrips', 
      photoStripPath, 
      photoStripUrl
    );
    
    console.log('Photostrip URL generated:', photoStripStorageUrl ? 'Success' : 'Failed');
    
    if (!photoStripStorageUrl) {
      console.error('Failed to upload photostrip');
      return null;
    }
    
    // Double-check user is still authenticated
    const { data: currentUser } = await supabase.auth.getUser();
    const currentUserId = currentUser?.user?.id || null;
    
    if (userId && userId !== currentUserId) {
      console.warn('User ID changed during upload process!', 
        `Original: ${userId.substring(0, 8)}...`, 
        `Current: ${currentUserId ? currentUserId.substring(0, 8) + '...' : 'null'}`);
    }
    
    // Prepare session data
    const sessionData = {
      created_at: new Date().toISOString(),
      photo_urls: JSON.stringify(uploadedPhotoUrls.filter(Boolean)),
      photostrip_url: photoStripStorageUrl,
      captions: captions || '',
      memory_notes: memoryNotes || '',
      user_id: currentUserId, // Use the most current user ID
    };
    
    console.log('Inserting session with user_id:', sessionData.user_id || 'null');
    
    try {
      // Insert the session data
      const { data, error } = await supabase
        .from('sessions')
        .insert(sessionData)
        .select('id')
        .single();
      
      if (error) {
        console.error('Database insert error:', error.message, error.details, error.hint);
        // Even if DB insert fails, return the photostrip URL since images are saved
        return { url: photoStripStorageUrl, sessionId: 'unknown' };
      }
      
      console.log('Successfully saved session data with ID:', data.id);
      
      // Verify the session was saved correctly
      const { data: verifyData, error: verifyError } = await supabase
        .from('sessions')
        .select('id, user_id')
        .eq('id', data.id)
        .single();
        
      if (verifyError) {
        console.error('Error verifying saved session:', verifyError);
      } else {
        console.log('Verified session data:', {
          id: verifyData.id,
          user_id: verifyData.user_id || 'null'
        });
      }
      
      return { url: photoStripStorageUrl, sessionId: data.id };
    } catch (dbError) {
      console.error('Exception during database operation:', dbError);
      return { url: photoStripStorageUrl, sessionId: 'unknown' }; // Return URL even if DB insertion fails
    }
  } catch (error) {
    console.error('Error in savePhotoStripSession:', error);
    return null;
  }
}

// Function to retrieve saved photostrip sessions
export const getSavedPhotoStripSessions = async (
  limit = 20,
  dateFilter?: { year?: number, month?: number, day?: number }
) => {
  try {
    // Define session interface to avoid 'any' type
    interface SessionRecord {
      id: string;
      created_at: string;
      photo_urls: string | string[];
      photostrip_url: string;
      captions: string;
      memory_notes?: string;
      user_id?: string;
      [key: string]: any; // Allow other properties
    }
    
    // Get the current authenticated user
    console.log('Getting current user in getSavedPhotoStripSessions');
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    console.log('Auth check for sessions:', userId ? `User ID: ${userId.substring(0, 8)}...` : 'Not authenticated');
    
    // Start building the query
    let query = supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply user filtering if signed in
    if (userId) {
      // Only fetch sessions that belong to this user
      console.log(`Filtering sessions for user: ${userId.substring(0, 8)}...`);
      query = query.eq('user_id', userId);
    } else {
      console.log('No user signed in, showing anonymous sessions only');
      // Only show sessions with null user_id (anonymous sessions)
      query = query.is('user_id', null);
    }
    
    // Apply date filtering if provided
    if (dateFilter) {
      const { year, month, day } = dateFilter;
      
      if (year && month && day) {
        // Filter by specific date
        const startDate = new Date(year, month - 1, day).toISOString();
        const endDate = new Date(year, month - 1, day + 1).toISOString();
        query = query.gte('created_at', startDate).lt('created_at', endDate);
      } else if (year && month) {
        // Filter by month
        const startDate = new Date(year, month - 1, 1).toISOString();
        const endDate = new Date(year, month, 1).toISOString();
        query = query.gte('created_at', startDate).lt('created_at', endDate);
      } else if (year) {
        // Filter by year
        const startDate = new Date(year, 0, 1).toISOString();
        const endDate = new Date(year + 1, 0, 1).toISOString();
        query = query.gte('created_at', startDate).lt('created_at', endDate);
      }
    }

    console.log('Executing sessions query with limit:', limit);
    // Apply limit
    query = query.limit(limit);
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }

    console.log(`Query returned ${data.length} sessions`);
    
    // For debugging purposes, log the first session if available
    if (data.length > 0) {
      const firstSession = { ...data[0] };
      if (firstSession.photo_urls) {
        // Don't log all the URLs
        firstSession.photo_urls = '[URLs hidden]';
      }
      console.log('First session:', firstSession);
    }
    
    // Process the results to handle photo_urls that might be strings
    const processedData = data.map((session: SessionRecord) => {
      // Make sure photo_urls is an array
      let photoUrls: string[] = [];
      if (typeof session.photo_urls === 'string') {
        try {
          photoUrls = JSON.parse(session.photo_urls);
        } catch (e) {
          console.error('Error parsing photo_urls:', e);
        }
      } else if (Array.isArray(session.photo_urls)) {
        photoUrls = session.photo_urls;
      }
      
      return {
        ...session,
        photo_urls: photoUrls
      };
    });
    
    return processedData;
  } catch (error) {
    console.error('Error in getSavedPhotoStripSessions:', error);
    return [];
  }
}

// Function to update memory notes and/or caption for an existing session
export const updateSessionMemoryNotes = async (
  sessionId: string,
  memoryNotes: string,
  caption?: string
): Promise<boolean> => {
  try {
    // Get the current authenticated user
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    // First, check if this session belongs to the current user
    const { data: sessionData, error: fetchError } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (fetchError) {
      console.error('Error fetching session:', fetchError);
      return false;
    }

    // If session has a user_id and it doesn't match the current user, deny access
    if (sessionData.user_id && sessionData.user_id !== userId) {
      console.error('Permission denied: Users can only modify their own sessions');
      return false;
    }

    // Prepare update data
    const updateData: { memory_notes: string; captions?: string } = {
      memory_notes: memoryNotes
    };
    
    // Add caption to update if provided
    if (caption !== undefined) {
      updateData.captions = caption;
    }
    
    // Update the session
    const { error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId);
    
    if (error) {
      console.error('Error updating session memory notes:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception in updateSessionMemoryNotes:', error);
    return false;
  }
}

// Helper function to debug auth state
export const debugAuthState = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: { session } } = await supabase.auth.getSession()
    
    console.log('Auth Debug:', {
      hasUser: !!user,
      hasSession: !!session,
      userId: user?.id ? `${user.id.substring(0, 8)}...` : null,
      email: user?.email ? `${user.email.split('@')[0]}@...` : null
    })
    
    return { user, session }
  } catch (error) {
    console.error('Error debugging auth state:', error)
    return { user: null, session: null }
  }
}

// Debug function to get all sessions regardless of user (for troubleshooting)
export const getAllSessions = async (limit = 100) => {
  try {
    console.log('ADMIN DEBUG: Fetching all sessions regardless of user');
    
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Error fetching all sessions:', error);
      return [];
    }
    
    console.log(`Found ${data.length} total sessions in database`);
    
    // Group by user_id for analysis
    const sessionsByUser: Record<string, number> = {};
    for (const session of data) {
      const userId = session.user_id || 'anonymous';
      sessionsByUser[userId] = (sessionsByUser[userId] || 0) + 1;
    }
    
    console.log('Sessions by user:', sessionsByUser);
    
    return data;
  } catch (error) {
    console.error('Error in getAllSessions:', error);
    return [];
  }
} 