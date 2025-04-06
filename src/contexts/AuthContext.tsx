'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User, AuthError, AuthResponse } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signInWithGoogle: () => Promise<AuthResponse>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        setIsLoading(true)
        
        // Check for existing user
        const { data, error } = await supabase.auth.getUser()
        
        if (error) {
          if (error.message !== 'Auth session missing!' && error.message !== 'Failed to get user') {
            console.error('Error getting user:', error)
          } else {
            console.log('No active session found')
          }
          setUser(null)
        } else {
          setUser(data.user)
        }
      } catch (error) {
        console.error('Unexpected error during auth init:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED' | 'PASSWORD_RECOVERY' | 'TOKEN_REFRESHED', 
       session: { user: User } | null) => {
        console.log('Auth state changed:', event)
        setUser(session?.user ?? null)
        
        // Handle session changes
        if (event === 'SIGNED_IN') {
          console.log('User signed in')
          router.refresh() // Refresh to update any server-side data
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out')
          router.refresh() // Refresh to update any server-side data
          router.push('/') // Redirect to home page
        }
      }
    )

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google sign-in flow')
      const response = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' 
            ? `${window.location.origin}/auth/callback` 
            : undefined,
          queryParams: {
            prompt: 'select_account' // Always show account selector
          }
        }
      })

      if (response.error) {
        console.error('Error in OAuth flow:', response.error)
        throw response.error
      }

      return response
    } catch (error) {
      console.error('Unexpected error during sign in:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        throw error
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error)
      throw error
    }
  }

  const value = {
    user,
    isLoading,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 