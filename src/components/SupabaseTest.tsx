'use client'

import React, { useState } from 'react'
import { supabase, testDatabaseConnection } from '@/lib/supabase'

export default function SupabaseTest() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const runTest = async () => {
    setLoading(true)
    setErrorMessage(null)
    
    try {
      // Test connection with a simple count query, not an insert
      console.log('Testing database connection with count query...')
      
      const { data, error } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.error('Database connection test failed:', error)
        setErrorMessage('Database connection test failed: ' + JSON.stringify(error))
        setTestResult({ success: false, error })
      } else {
        console.log('Database connection test successful')
        setTestResult({ 
          success: true, 
          message: 'Connection successful',
          data
        })
      }
    } catch (error) {
      console.error('Error running test:', error)
      setErrorMessage('Exception during test: ' + (error instanceof Error ? error.message : String(error)))
      setTestResult(null)
    } finally {
      setLoading(false)
    }
  }

  const runManualTest = async () => {
    setLoading(true)
    setErrorMessage(null)
    
    try {
      // Step 1: Try to create a test record
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          created_at: new Date().toISOString(),
          photo_urls: '[]',
          photostrip_url: 'test-url-' + Date.now(),
          captions: 'Test caption'
        })
        .select()
      
      if (error) {
        console.error('Manual test failed:', error)
        setErrorMessage('Insert failed: ' + JSON.stringify(error))
        setTestResult({ success: false, error })
      } else {
        console.log('Manual test succeeded:', data)
        setTestResult({ success: true, data })
      }
    } catch (error) {
      console.error('Error in manual test:', error)
      setErrorMessage('Exception during manual test: ' + (error instanceof Error ? error.message : String(error)))
      setTestResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-4">Supabase Database Test</h1>
      
      <div className="space-y-4">
        <p className="text-gray-600">
          This page helps diagnose issues with Supabase database connectivity.
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={runTest}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Run Connection Test'}
          </button>
          
          <button
            onClick={runManualTest}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Try Manual Insert'}
          </button>
        </div>
        
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {errorMessage}
          </div>
        )}
        
        {testResult && (
          <div className={`border px-4 py-3 rounded ${testResult.success ? 'bg-green-100 border-green-400 text-green-700' : 'bg-yellow-100 border-yellow-400 text-yellow-700'}`}>
            <h3 className="font-bold">{testResult.success ? 'Success!' : 'Test Failed'}</h3>
            <pre className="mt-2 text-xs overflow-auto max-h-40">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-6 border-t pt-4">
          <h2 className="text-lg font-semibold mb-2">Troubleshooting Tips</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Check that your Supabase URL and anon key are correct in .env</li>
            <li>Verify RLS policies for the sessions table are set up correctly</li>
            <li>Try direct SQL access through the Supabase dashboard</li>
            <li>Check browser console for detailed error messages</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 