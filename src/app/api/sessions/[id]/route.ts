import { NextRequest, NextResponse } from 'next/server'
import { updateSessionMemoryNotes } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { memoryNotes, caption } = body
    
    const success = await updateSessionMemoryNotes(id, memoryNotes, caption)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update session' },
      { status: 500 }
    )
  }
}
