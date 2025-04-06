'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Calendar } from 'lucide-react'
import { getSavedPhotoStripSessions, updateSessionMemoryNotes } from '@/lib/supabase'
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

  useEffect(() => {
    // Initial load of sessions
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Load sessions when date filters change
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, day]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const dateFilter = {
        year,
        month: month || undefined,
        day: day || undefined
      };
      
      const data = await getSavedPhotoStripSessions(100, dateFilter);
      
      if (data) {
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
        setSessions([]);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
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

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        {/* Year filter */}
        <select
          value={year}
          onChange={(e) => handleYearChange(Number(e.target.value))}
        >
          {availableYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        
        {/* Month filter */}
        <select
          value={month || ''}
          onChange={(e) => handleMonthChange(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">All</option>
          {availableMonths.map(m => (
            <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'short' })}</option>
          ))}
        </select>
        
        {/* Day filter */}
        <select
          value={day || ''}
          onChange={(e) => handleDayChange(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">All</option>
          {availableDays.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Sessions display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="text-center py-8">
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
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-vintage-sepia rounded-lg">
            <div className="text-xl font-vintage text-vintage-sepia">
              No photostrips found for this date range
            </div>
            <div className="mt-2 text-vintage-text">
              Try selecting a different time period or create new memories
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