import { NextRequest, NextResponse } from 'next/server'
import { getSavedPhotoStripSessions, savePhotoStripSession } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined
    const day = searchParams.get('day') ? parseInt(searchParams.get('day')!) : undefined
    
    const dateFilter = year ? { year, month, day } : undefined
    
    const sessions = await getSavedPhotoStripSessions(limit, dateFilter as any)
    
    return NextResponse.json(sessions)
  } catch (error: any) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { photos, photoStripUrl, captions, memoryNotes } = body
    
    const result = await savePhotoStripSession(
      photos,
      photoStripUrl,
      captions,
      memoryNotes
    )
    
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to save session' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error saving session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save session' },
      { status: 500 }
    )
  }
}
