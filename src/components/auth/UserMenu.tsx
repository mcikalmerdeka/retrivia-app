'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { LogOut, User as UserIcon, Camera, Upload, Book } from 'lucide-react'

export default function UserMenu() {
  const { user, signOut, isLoading, isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsOpen(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Display username from email (part before @)
  const displayName = user?.email ? user.email.split('@')[0] : 'User'

  if (isLoading) {
    return (
      <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Link 
        href="/login" 
        className="px-4 py-2 border-2 border-vintage-sepia text-vintage-sepia rounded-lg 
                   hover:bg-vintage-sepia hover:text-white transition-colors"
      >
        Sign In
      </Link>
    )
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-vintage-paper transition-colors"
      >
        <div className="h-8 w-8 rounded-full bg-vintage-sepia flex items-center justify-center text-white">
          <UserIcon size={16} />
        </div>
        <span className="hidden md:block text-vintage-sepia">
          {displayName}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-vintage-sepia rounded-lg shadow-lg py-2 z-50">
          <div className="px-4 py-2 border-b border-vintage-paper">
            <p className="font-medium text-vintage-sepia">
              {displayName}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
          
          <Link 
            href="/photobook"
            className="flex items-center gap-2 px-4 py-2 text-vintage-text hover:bg-vintage-paper w-full text-left"
            onClick={() => setIsOpen(false)}
          >
            <Book size={16} />
            My Photobook
          </Link>
          
          <Link 
            href="/photobooth"
            className="flex items-center gap-2 px-4 py-2 text-vintage-text hover:bg-vintage-paper w-full text-left"
            onClick={() => setIsOpen(false)}
          >
            <Camera size={16} />
            Take Photos
          </Link>
          
          <Link 
            href="/upload"
            className="flex items-center gap-2 px-4 py-2 text-vintage-text hover:bg-vintage-paper w-full text-left"
            onClick={() => setIsOpen(false)}
          >
            <Upload size={16} />
            Upload Photos
          </Link>
          
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left border-t border-vintage-paper mt-1"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
} 