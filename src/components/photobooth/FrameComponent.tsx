'use client'

import React from 'react'

export type FrameType = 'none' | 'classic' | 'polaroid' | 'filmstrip' | 'scalloped'

interface FrameComponentProps {
  selectedFrame: FrameType
  onSelectFrame: (frame: FrameType) => void
}

export default function FrameComponent({ selectedFrame, onSelectFrame }: FrameComponentProps) {
  const frames = [
    { name: 'None', value: 'none' },
    { name: 'Classic', value: 'classic' },
    { name: 'Polaroid', value: 'polaroid' },
    { name: 'Film Strip', value: 'filmstrip' },
    { name: 'Scalloped', value: 'scalloped' }
  ]

  return (
    <div className="mb-6">
      <h3 className="text-xl font-vintage text-vintage-sepia mb-3">Choose Frame</h3>
      <div className="flex flex-wrap gap-2">
        {frames.map((frame) => (
          <button
            key={frame.value}
            onClick={() => onSelectFrame(frame.value as FrameType)}
            className={`px-3 py-2 rounded-md border transition-all ${
              selectedFrame === frame.value
                ? 'bg-vintage-primary text-white' 
                : 'bg-vintage-paper text-vintage-text border-vintage-primary hover:bg-vintage-secondary'
            }`}
          >
            {frame.name}
          </button>
        ))}
      </div>
    </div>
  )
} 