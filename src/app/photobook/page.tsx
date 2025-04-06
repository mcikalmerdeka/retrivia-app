'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Calendar, Camera, Upload, RotateCcw } from 'lucide-react'
import { getSavedPhotoStripSessions, updateSessionMemoryNotes, getAllSessions, debugAuthState } from '@/lib/supabase'
import Link from 'next/link'

// Session type definition
interface PhotoSession {
  id: string
  created_at: string
  photostrip_url: string
  photo_urls: string[]
  captions: string
  memory_notes?: string
}

export default function PhotobookPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<PhotoSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<PhotoSession | null>(null);
  const [memoryNote, setMemoryNote] = useState('');
  const [editingNote, setEditingNote] = useState(false);
  
  // Date filter state
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number | null>(null);
  const [day, setDay] = useState<number | null>(null);

  // Get available years, months, and days from sessions
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [availableDays, setAvailableDays] = useState<number[]>([]);

  const [debugMode, setDebugMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Initial load of sessions
    const loadWithDebug = async () => {
      const { debugAuthState } = await import('@/lib/supabase');
      const { user } = await debugAuthState();
      
      // Check if user is admin
      if (user?.email === 'mcikalmerdeka@gmail.com') {
        console.log('Admin user detected');
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      
      fetchSessions();
    };
    
    loadWithDebug();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Load sessions when date filters change
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, day]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      // Debug: Check auth status
      const { supabase } = await import('@/lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user in photobook:', user ? `ID: ${user.id.substring(0, 8)}...` : 'Not logged in');
      
      const dateFilter = {
        year,
        month: month || undefined,
        day: day || undefined
      };
      
      console.log('Fetching sessions with filter:', dateFilter);
      const data = await getSavedPhotoStripSessions(100, dateFilter);
      console.log('Session data returned:', data ? `${data.length} sessions` : 'No sessions', data);
      
      if (data && data.length > 0) {
        setSessions(data);
        
        // Extract unique years, months, and days for filters
        const dates = data.map((session: PhotoSession) => new Date(session.created_at));
        
        // Get unique years
        const yearsSet = new Set<number>(dates.map((date: Date) => date.getFullYear()));
        const years: number[] = Array.from(yearsSet).sort((a: number, b: number) => b - a); // Sort descending
        setAvailableYears(years);
        
        // Get unique months for selected year
        if (year) {
          const monthsInYearSet = new Set<number>(
            dates
              .filter((date: Date) => date.getFullYear() === year)
              .map((date: Date) => date.getMonth() + 1)
          );
          const monthsInYear: number[] = Array.from(monthsInYearSet).sort((a: number, b: number) => a - b);
          setAvailableMonths(monthsInYear);
        }
        
        // Get unique days for selected year and month
        if (year && month) {
          const daysInMonthSet = new Set<number>(
            dates
              .filter((date: Date) => date.getFullYear() === year && date.getMonth() + 1 === month)
              .map((date: Date) => date.getDate())
          );
          const daysInMonth: number[] = Array.from(daysInMonthSet).sort((a: number, b: number) => a - b);
          setAvailableDays(daysInMonth);
        }
      } else {
        // No sessions found
        console.log('No sessions found for the current user with the specified filters');
        setSessions([]);
        
        // Get current year
        const currentYear = new Date().getFullYear();
        setAvailableYears([currentYear]);
        setAvailableMonths([]);
        setAvailableDays([]);
        
        // Reset filters if they were set
        if (month || day) {
          setMonth(null);
          setDay(null);
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
    setMonth(null);
    setDay(null);
  };

  const handleMonthChange = (newMonth: number | null) => {
    setMonth(newMonth);
    setDay(null);
  };

  const handleDayChange = (newDay: number | null) => {
    setDay(newDay);
  };

  const selectSession = (session: PhotoSession) => {
    setSelectedSession(session);
    setMemoryNote(session.memory_notes || '');
    setEditingNote(false);
  };

  const saveMemoryNote = async () => {
    if (!selectedSession) return;
    
    const success = await updateSessionMemoryNotes(selectedSession.id, memoryNote);
    if (success) {
      // Update local state
      setSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === selectedSession.id 
            ? { ...session, memory_notes: memoryNote } 
            : session
        )
      );
      setSelectedSession(prev => prev ? { ...prev, memory_notes: memoryNote } : null);
      setEditingNote(false);
    } else {
      alert('Failed to save memory note. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Add a debug function
  const runDebugCheck = async () => {
    // Only run for admin user
    if (!isAdmin) {
      console.log('Debug mode is only available for admin users');
      return;
    }
    
    console.log('Running debug checks...');
    
    // Check auth state
    await debugAuthState();
    
    // Attempt to fetch all sessions as a sanity check
    const allSessions = await getAllSessions();
    
    if (allSessions.length > 0) {
      console.log(`Debug found ${allSessions.length} total sessions`);
      
      // Toggle debug mode to show all sessions temporarily
      setDebugMode(true);
      setSessions(allSessions);
    } else {
      console.log('No sessions found at all in the database');
    }
  };

  return (
    <div className="p-4">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-vintage text-vintage-sepia">Your Memories</h1>
        <div className="flex space-x-4">
          <Link href="/photobooth" className="vintage-button flex items-center gap-2">
            <Camera size={16} />
            Create New
          </Link>
          <Link href="/upload" className="vintage-button flex items-center gap-2">
            <Upload size={16} />
            Upload Photos
          </Link>
          {/* Debug button - only visible to admin */}
          {isAdmin && (
            <button 
              onClick={runDebugCheck}
              className="vintage-button flex items-center gap-2 opacity-50 hover:opacity-100"
              title="Troubleshoot album"
            >
              <RotateCcw size={16} />
              Refresh
            </button>
          )}
        </div>
      </div>
      
      {debugMode && isAdmin && (
        <div className="mb-4 p-2 bg-yellow-100 border border-yellow-600 rounded text-sm">
          <p className="font-semibold text-yellow-800">Debug Mode: Showing all sessions</p>
          <p>This is temporary to help troubleshoot the empty album issue.</p>
          <button 
            onClick={() => {
              setDebugMode(false);
              fetchSessions();
            }}
            className="px-2 py-1 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 rounded mt-1"
          >
            Return to normal view
          </button>
        </div>
      )}
      
      {sessions.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {/* Year filter */}
          <select
            value={year}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="px-3 py-2 border border-vintage-sepia rounded bg-vintage-paper text-vintage-text"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          
          {/* Month filter */}
          <select
            value={month || ''}
            onChange={(e) => handleMonthChange(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 border border-vintage-sepia rounded bg-vintage-paper text-vintage-text"
            disabled={availableMonths.length === 0}
          >
            <option value="">All Months</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          
          {/* Day filter */}
          <select
            value={day || ''}
            onChange={(e) => handleDayChange(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 border border-vintage-sepia rounded bg-vintage-paper text-vintage-text"
            disabled={availableDays.length === 0}
          >
            <option value="">All Days</option>
            {availableDays.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      ) : null}

      {/* Sessions display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full text-center py-16">
            <div className="text-xl font-vintage text-vintage-sepia animate-pulse">
              Loading your memories...
            </div>
          </div>
        ) : sessions.length > 0 ? (
          sessions.map(session => (
            <div 
              key={session.id} 
              className={`border-4 ${selectedSession?.id === session.id 
                ? 'border-vintage-sepia' 
                : 'border-vintage-paper'} 
                cursor-pointer hover:shadow-lg transition-all duration-200 bg-white
                transform hover:scale-[1.02] ${selectedSession?.id === session.id ? 'scale-[1.02]' : ''}`}
              onClick={() => selectSession(session)}
            >
              <div className="relative">
                <img 
                  src={session.photostrip_url} 
                  alt="Photostrip" 
                  className="w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-30 text-white text-xs p-2">
                  {formatDate(session.created_at)}
                  {session.captions && (
                    <div className="mt-1 truncate">{session.captions}</div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16 border-2 border-dashed border-vintage-sepia rounded-lg">
            <div className="text-xl font-vintage text-vintage-sepia mb-4">
              Your album is empty
            </div>
            <div className="mb-8 text-vintage-text">
              Time to create some memories! Take photos or upload your favorites.
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/photobooth" className="vintage-button flex items-center justify-center gap-2">
                <Camera size={16} />
                Take Photos
              </Link>
              <Link href="/upload" className="vintage-button flex items-center justify-center gap-2">
                <Upload size={16} />
                Upload Photos
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Modal for memory notes */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-40">
          <div className="bg-vintage-paper border-4 border-vintage-sepia rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-vintage text-vintage-sepia">Memory Details</h2>
                <button 
                  onClick={() => setSelectedSession(null)}
                  className="text-vintage-sepia hover:text-red-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Photostrip */}
                <div className="flex justify-center">
                  <img 
                    src={selectedSession.photostrip_url} 
                    alt="Photostrip" 
                    className="max-h-[70vh] w-auto border-2 border-vintage-sepia"
                  />
                </div>

                {/* Details and Memory Notes */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-vintage text-vintage-sepia mb-1">Date Captured</h3>
                    <p className="text-vintage-text">
                      {formatDate(selectedSession.created_at)}
                    </p>
                  </div>

                  {/* Caption is now rendered directly on the photostrip image, so we don't need this section
                     But keep it in the data model for searching/filtering purposes */}
                  <div className="mb-4">
                    <h3 className="text-lg font-vintage text-vintage-sepia mb-1">Memory Notes</h3>
                    <div className="flex justify-between items-center mb-2">
                      <button
                        onClick={() => setEditingNote(!editingNote)}
                        className="text-sm text-vintage-sepia underline"
                      >
                        {editingNote ? 'Cancel' : (selectedSession.memory_notes ? 'Edit' : 'Add Note')}
                      </button>
                    </div>

                    {editingNote ? (
                      <div>
                        <textarea
                          value={memoryNote}
                          onChange={(e) => setMemoryNote(e.target.value)}
                          className="w-full h-40 p-3 border-2 border-vintage-sepia bg-vintage-paper rounded"
                          placeholder="Write your memory note here..."
                        />
                        <button
                          onClick={saveMemoryNote}
                          className="px-4 py-2 bg-vintage-sepia text-white rounded mt-2"
                        >
                          Save Note
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-vintage-sepia bg-white p-4 rounded min-h-[100px]">
                        {selectedSession.memory_notes ? (
                          <p className="text-vintage-text whitespace-pre-wrap">{selectedSession.memory_notes}</p>
                        ) : (
                          <p className="text-gray-400 italic">No memory notes yet. Click &quot;Add Note&quot; to write your thoughts about this moment.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 