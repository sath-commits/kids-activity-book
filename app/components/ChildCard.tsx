'use client'

import { Child } from '@/lib/types'

interface ChildCardProps {
  child: Child
  index: number
  onChange: (updated: Child) => void
  onRemove: () => void
  canRemove: boolean
}

const cardColors = [
  'bg-green-50 border-green-200',
  'bg-blue-50 border-blue-200',
  'bg-purple-50 border-purple-200',
  'bg-amber-50 border-amber-200',
]

export default function ChildCard({ child, index, onChange, onRemove, canRemove }: ChildCardProps) {
  const colorClass = cardColors[index % cardColors.length]

  return (
    <div className={`rounded-xl border-2 p-4 ${colorClass} relative`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-700 text-sm">
          Explorer {index + 1}
        </h3>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-gray-400 hover:text-red-400 text-sm transition-colors"
            aria-label="Remove child"
          >
            ✕ Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Name */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            First Name *
          </label>
          <input
            type="text"
            value={child.name}
            onChange={(e) => onChange({ ...child, name: e.target.value.slice(0, 20) })}
            placeholder="Explorer's name"
            maxLength={20}
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          />
        </div>

        {/* Age */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Age *
          </label>
          <input
            type="number"
            value={child.age || ''}
            onChange={(e) => onChange({ ...child, age: parseInt(e.target.value) || 0 })}
            placeholder="4–12"
            min={4}
            max={12}
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          />
        </div>

        {/* Gender */}
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            I am a...
          </label>
          <div className="flex gap-2">
            {[
              { value: 'girl', label: '👧 Girl' },
              { value: 'boy', label: '🧒 Boy' },
              { value: 'explorer', label: '🌟 Explorer' },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ ...child, gender: value as Child['gender'] })}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                  child.gender === value
                    ? 'border-green-500 bg-green-100 text-green-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-green-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            What does {child.name || 'this explorer'} love?
            <span className="font-normal text-gray-400 ml-1">(optional)</span>
          </label>
          <input
            type="text"
            value={child.interests || ''}
            onChange={(e) => onChange({ ...child, interests: e.target.value.slice(0, 100) })}
            placeholder="e.g. dinosaurs, Lego, animals, space, drawing"
            maxLength={100}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          />
        </div>
      </div>
    </div>
  )
}
