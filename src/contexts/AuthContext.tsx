'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface User {
  id: string
  email?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Auth is disabled - app works without login
  // To re-enable auth, implement NextAuth.js or Clerk
  const [user] = useState<User | null>(null)
  const [isLoading] = useState(false)

  const signInWithGoogle = async () => {
    console.log('Authentication is disabled. Implement NextAuth.js or Clerk to enable.')
    alert('Authentication is currently disabled. All photos are shared publicly.')
  }

  const signOut = async () => {
    console.log('Authentication is disabled.')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: false,
        isLoading,
        signInWithGoogle,
        signOut
      }}
    >
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
