import { NextResponse } from 'next/server'
import { testDatabaseConnection } from '@/lib/supabase'

export async function GET() {
  try {
    const result = await testDatabaseConnection()
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error testing database:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to test database connection' },
      { status: 500 }
    )
  }
}
