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
  'bg-[linear-gradient(135deg,rgba(232,249,239,0.92),rgba(255,255,255,0.86))] border-[rgba(83,162,107,0.22)]',
  'bg-[linear-gradient(135deg,rgba(236,244,255,0.92),rgba(255,255,255,0.86))] border-[rgba(93,145,206,0.22)]',
  'bg-[linear-gradient(135deg,rgba(247,239,255,0.92),rgba(255,255,255,0.86))] border-[rgba(146,104,196,0.22)]',
  'bg-[linear-gradient(135deg,rgba(255,247,222,0.92),rgba(255,255,255,0.86))] border-[rgba(243,182,85,0.28)]',
]

export default function ChildCard({ child, index, onChange, onRemove, canRemove }: ChildCardProps) {
  const colorClass = cardColors[index % cardColors.length]

  return (
    <div className={`rounded-[1.5rem] border p-4 ${colorClass} relative shadow-sm`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-[var(--ink-strong)] text-sm uppercase tracking-[0.18em]">
          Explorer {index + 1}
        </h3>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[var(--ink-soft)]/70 hover:text-red-500 text-sm transition-colors"
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
            className="w-full px-3 py-2 rounded-xl border border-white bg-white/90 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
          <p className="text-xs text-gray-400 mt-1">Used only to personalize the book</p>
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
            placeholder="2–12"
            min={2}
            max={12}
            required
            className="w-full px-3 py-2 rounded-xl border border-white bg-white/90 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
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
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ ...child, gender: value as Child['gender'] })}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                  child.gender === value
                    ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-deep)]'
                    : 'border-white bg-white/90 text-[var(--ink-soft)] hover:border-[rgba(83,162,107,0.3)]'
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
            className="w-full px-3 py-2 rounded-xl border border-white bg-white/90 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        </div>
      </div>
    </div>
  )
}
