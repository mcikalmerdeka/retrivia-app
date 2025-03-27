'use client'

import React from 'react'

interface CaptionComponentProps {
  caption: string
  onCaptionChange: (text: string) => void
  fontStyle: FontStyle
  onFontStyleChange: (style: FontStyle) => void
  textColor: string
  onTextColorChange: (color: string) => void
}

export type FontStyle = 'vintage' | 'handwritten' | 'modern' | 'fancy'

export default function CaptionComponent({ 
  caption, 
  onCaptionChange, 
  fontStyle,
  onFontStyleChange,
  textColor,
  onTextColorChange
}: CaptionComponentProps) {
  const fontStyles: { name: string; value: FontStyle; className: string }[] = [
    { name: 'Vintage', value: 'vintage', className: 'font-serif italic' },
    { name: 'Handwritten', value: 'handwritten', className: 'font-serif' },
    { name: 'Modern', value: 'modern', className: 'font-sans' },
    { name: 'Fancy', value: 'fancy', className: 'font-serif' }
  ]

  const colorOptions = [
    { name: 'Brown', value: '#5e503f' },
    { name: 'Gold', value: '#b8860b' },
    { name: 'Red', value: '#a52a2a' },
    { name: 'Blue', value: '#2a4b8a' },
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#ffffff' },
  ]

  return (
    <div className="mb-6">
      <h3 className="text-xl font-vintage text-vintage-sepia mb-3">Add Caption</h3>
      
      <div className="mb-3">
        <input
          type="text"
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Enter your caption..."
          className="w-full px-3 py-2 border border-vintage-border rounded-md bg-vintage-paper text-vintage-text"
          maxLength={50}
        />
        <div className="text-right text-sm text-gray-500 mt-1">
          {caption.length}/50 characters
        </div>
      </div>
      
      <div className="mt-4">
        <h4 className="text-sm font-vintage text-vintage-sepia mb-2">Font Style</h4>
        <div className="flex flex-wrap gap-2">
          {fontStyles.map((style) => (
            <button
              key={style.value}
              onClick={() => onFontStyleChange(style.value)}
              className={`px-3 py-2 text-sm rounded-md border transition-all ${style.className} ${
                fontStyle === style.value
                  ? 'bg-vintage-primary text-white' 
                  : 'bg-vintage-paper text-vintage-text border-vintage-primary hover:bg-vintage-secondary'
              }`}
            >
              {style.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-vintage text-vintage-sepia mb-2">Text Color</h4>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((color) => (
            <button
              key={color.value}
              onClick={() => onTextColorChange(color.value)}
              className={`w-8 h-8 rounded-full transition-all border-2 ${
                textColor === color.value
                  ? 'ring-2 ring-vintage-primary scale-110 border-white' 
                  : 'border-gray-200 hover:scale-105'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 