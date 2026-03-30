'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ChildCard from './ChildCard'
import { Child, FormState } from '@/lib/types'
import { SUPPORTED_LANGUAGES } from '@/lib/languageCodes'

const defaultChild = (): Child => ({
  name: '',
  age: 0,
  gender: 'girl',
  interests: '',
})

export default function BookForm() {
  const router = useRouter()
  const [destination, setDestination] = useState('')
  const [places, setPlaces] = useState('')
  const [tripStart, setTripStart] = useState('')
  const [tripEnd, setTripEnd] = useState('')
  const [children, setChildren] = useState<Child[]>([defaultChild()])
  const [language, setLanguage] = useState('en')
  const [parentEmail, setParentEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canonicalizing, setCanonicalize] = useState(false)
  const canonicalizeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const addChild = () => {
    if (children.length < 4) setChildren((prev) => [...prev, defaultChild()])
  }

  const updateChild = (index: number, updated: Child) => {
    setChildren((prev) => prev.map((c, i) => (i === index ? updated : c)))
  }

  const removeChild = (index: number) => {
    setChildren((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDestinationChange = (value: string) => {
    setDestination(value)
    setError(null)
    if (canonicalizeTimeout.current) clearTimeout(canonicalizeTimeout.current)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate children
    for (const child of children) {
      if (!child.name.trim()) return setError('Please enter a name for each explorer.')
      if (!child.age || child.age < 2 || child.age > 12) return setError('Each explorer must be between 2 and 12 years old.')
    }

    if (!destination.trim()) return setError('Please enter your destination.')
    if (!parentEmail.trim()) return setError('Please enter your email address.')

    setLoading(true)

    try {
      // Step 1: Canonicalize destination
      const canonRes = await fetch('/api/canonicalize-destination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: destination.trim() }),
      })
      const canonData = await canonRes.json()

      if (!canonRes.ok || !canonData.isValid) {
        setError(
          canonData.invalidReason ||
            `We couldn't find "${destination}" — try being more specific, like "Yellowstone National Park, Wyoming".`
        )
        setLoading(false)
        return
      }

      // Store form state and canonicalized info in sessionStorage for loading/preview pages
      const parsedPlaces = places
        .split(/[\n,]+/)
        .map((p) => p.trim())
        .filter(Boolean)

      const formState: FormState & { destinationSlug: string; displayName: string; cacheHit: boolean } = {
        destination: canonData.displayName,
        tripDates: tripStart && tripEnd ? { start: tripStart, end: tripEnd } : null,
        children,
        language,
        parentEmail,
        places: parsedPlaces.length > 0 ? parsedPlaces : undefined,
        destinationSlug: canonData.slug,
        displayName: canonData.displayName,
        cacheHit: canonData.cacheHit,
      }
      sessionStorage.setItem('little-explorer-form', JSON.stringify(formState))

      router.push('/loading')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section A: Destination */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🗺️</span>
          <h2 className="text-xl font-bold text-gray-800">Where are you going?</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Destination *
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => handleDestinationChange(e.target.value)}
              placeholder="e.g. Yellowstone National Park, Grand Canyon, San Diego Zoo"
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-green-400 text-base transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Specific places you&apos;ll visit{' '}
              <span className="text-gray-400 font-normal">(optional but recommended)</span>
            </label>
            <textarea
              value={places}
              onChange={(e) => setPlaces(e.target.value)}
              placeholder="e.g. the aquarium, downtown, beach boardwalk, theme park"
              rows={2}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-green-400 text-base transition-colors resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              We&apos;ll build the book around your actual stops and add a map of your route.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Trip Start <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={tripStart}
                onChange={(e) => setTripStart(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-green-400 text-sm transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Trip End <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={tripEnd}
                onChange={(e) => setTripEnd(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-green-400 text-sm transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-green-400 text-sm bg-white transition-colors"
            >
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Section B: Children */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🎒</span>
          <h2 className="text-xl font-bold text-gray-800">Tell us about your explorers</h2>
        </div>

        <div className="space-y-3">
          {children.map((child, i) => (
            <ChildCard
              key={i}
              child={child}
              index={i}
              onChange={(updated) => updateChild(i, updated)}
              onRemove={() => removeChild(i)}
              canRemove={children.length > 1}
            />
          ))}

          {children.length < 4 && (
            <button
              type="button"
              onClick={addChild}
              className="w-full py-3 rounded-xl border-2 border-dashed border-green-300 text-green-600 font-semibold text-sm hover:bg-green-50 transition-colors"
            >
              + Add another explorer
            </button>
          )}
        </div>
      </section>

      {/* Section C: Email */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📬</span>
          <h2 className="text-xl font-bold text-gray-800">How to get your book</h2>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Your email address *
          </label>
          <input
            type="email"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            placeholder="parent@example.com"
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-green-400 text-base transition-colors"
          />
          <p className="text-xs text-gray-400 mt-2">
            We'll email you the PDF so you can print it anytime.
          </p>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 leading-relaxed">
            🔒 <strong>Privacy:</strong> We only use your child's first name and age to personalize the book. We never store or share your child's information. Your email is used only to send your book.
          </p>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 px-8 rounded-2xl bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold text-lg transition-colors shadow-lg shadow-green-200"
      >
        {loading ? '🗺️ Getting started…' : '🌲 Create Our Book!'}
      </button>
    </form>
  )
}
