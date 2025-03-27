'use client'

import React from 'react'

export type FilterType = 'raw' | 'sepia' | 'blackAndWhite' | 'vintage1' | 'vintage2'

interface FilterComponentProps {
  selectedFilter: FilterType
  onSelectFilter: (filter: FilterType) => void
}

export default function FilterComponent({ selectedFilter, onSelectFilter }: FilterComponentProps) {
  const filters: { name: string; value: FilterType; preview: string }[] = [
    { 
      name: 'None', 
      value: 'raw',
      preview: 'bg-gradient-to-r from-white to-gray-50'
    },
    { 
      name: 'Sepia', 
      value: 'sepia',
      preview: 'bg-gradient-to-r from-yellow-700 to-amber-600'
    },
    { 
      name: 'Black & White', 
      value: 'blackAndWhite',
      preview: 'bg-gradient-to-r from-gray-700 to-gray-900'
    },
    { 
      name: 'Vintage 1', 
      value: 'vintage1',
      preview: 'bg-gradient-to-r from-orange-300 to-rose-300'
    },
    { 
      name: 'Vintage 2', 
      value: 'vintage2',
      preview: 'bg-gradient-to-r from-teal-300 to-blue-400'
    }
  ]

  return (
    <div className="mb-6">
      <h3 className="text-xl font-vintage text-vintage-sepia mb-3">Choose Filter</h3>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onSelectFilter(filter.value)}
            className={`p-1 rounded-md transition-all ${
              selectedFilter === filter.value 
                ? 'ring-2 ring-vintage-primary scale-110' 
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <div className={`w-12 h-12 rounded ${filter.preview}`}></div>
            <span className="text-xs mt-1 block">{filter.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
} 