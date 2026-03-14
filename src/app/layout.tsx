import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Retrivia',
  description: 'Create beautiful photostrips from your favorite moments',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-vintage-paper border-b-4 border-vintage-sepia py-4">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <Link 
              href="/" 
              className="flex items-center"
            >
              <span className="text-2xl font-vintage text-vintage-sepia">
                Retrivia
              </span>
            </Link>
          </div>
        </header>
        
        {children}
        
        <footer className="bg-vintage-paper border-t-4 border-vintage-sepia py-6 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-vintage-text">
              &copy; {new Date().getFullYear()} Retrivia. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
