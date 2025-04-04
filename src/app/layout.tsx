import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Retrivia',
  description: 'Capture and relive nostalgic moments with photostrips and memory notes',
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
          <div className="container mx-auto px-4">
            <Link 
              href="/" 
              className="flex items-center justify-center md:justify-start"
            >
              <span className="text-2xl font-vintage text-vintage-sepia">
                Retrivia <span className="text-sm">by Cikal Merdeka</span>
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
            <p className="text-sm text-vintage-text mt-2">
              Created with love for capturing and reliving nostalgic moments.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
} 