'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ChildCard from './ChildCard'
import { Child, FormState } from '@/lib/types'
import { SUPPORTED_LANGUAGES } from '@/lib/languageCodes'

interface VerifiedPlace {
  original: string
  found: string | null
  notFound: boolean
  hasSuggestion: boolean
  geocodeQuery: string | null
}

interface VerificationState {
  results: VerifiedPlace[]
  displayName: string
  slug: string
  cacheHit: boolean
  parsedPlaces: string[]
  parsedGeoQueries: string[]
}

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
  const [bookMode, setBookMode] = useState<'shared' | 'individual'>('shared')
  const [language, setLanguage] = useState('en')
  const [parentEmail, setParentEmail] = useState('')
  const [disclaimerChecked, setDisclaimerChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canonicalizing, setCanonicalize] = useState(false)
  const canonicalizeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [verification, setVerification] = useState<VerificationState | null>(null)

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

      if (parsedPlaces.length > 0) {
        const verifyRes = await fetch('/api/verify-places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ places: parsedPlaces, destination: canonData.displayName }),
        })
        const verifyData = await verifyRes.json()
        const parsedGeoQueries = (verifyData.results as VerifiedPlace[]).map(r => r.geocodeQuery ?? r.found ?? r.original)
        const hasIssues = verifyData.results?.some((r: VerifiedPlace) => r.hasSuggestion || r.notFound)
        if (hasIssues) {
          setVerification({
            results: verifyData.results,
            displayName: canonData.displayName,
            slug: canonData.slug,
            cacheHit: canonData.cacheHit,
            parsedPlaces,
            parsedGeoQueries,
          })
          setLoading(false)
          return
        }

        // No issues — proceed directly with LLM-verified geo queries
        const formState: FormState & { destinationSlug: string; displayName: string; cacheHit: boolean } = {
          destination: canonData.displayName,
          tripDates: tripStart && tripEnd ? { start: tripStart, end: tripEnd } : null,
          children,
          language,
          parentEmail,
          bookMode,
          places: parsedPlaces,
          placeGeoQueries: parsedGeoQueries,
          destinationSlug: canonData.slug,
          displayName: canonData.displayName,
          cacheHit: canonData.cacheHit,
        }
        sessionStorage.setItem('little-explorer-form', JSON.stringify(formState))
        router.push('/loading')
        return
      }

      const formState: FormState & { destinationSlug: string; displayName: string; cacheHit: boolean } = {
        destination: canonData.displayName,
        tripDates: tripStart && tripEnd ? { start: tripStart, end: tripEnd } : null,
        children,
        language,
        parentEmail,
        bookMode,
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

  const handleConfirmPlaces = async () => {
    if (!verification) return
    setLoading(true)
    const correctedPlaces = verification.results.map(r => r.found ?? r.original)
    const formState = {
      destination: verification.displayName,
      tripDates: tripStart && tripEnd ? { start: tripStart, end: tripEnd } : null,
      children,
      language,
      parentEmail,
      bookMode,
      places: correctedPlaces,
      placeGeoQueries: verification.parsedGeoQueries,
      destinationSlug: verification.slug,
      displayName: verification.displayName,
      cacheHit: verification.cacheHit,
    }
    sessionStorage.setItem('little-explorer-form', JSON.stringify(formState))
    router.push('/loading')
  }

  const handleProceedWithOriginal = async () => {
    if (!verification) return
    setLoading(true)
    const formState = {
      destination: verification.displayName,
      tripDates: tripStart && tripEnd ? { start: tripStart, end: tripEnd } : null,
      children,
      language,
      parentEmail,
      bookMode,
      places: verification.parsedPlaces,
      placeGeoQueries: verification.parsedGeoQueries,
      destinationSlug: verification.slug,
      displayName: verification.displayName,
      cacheHit: verification.cacheHit,
    }
    sessionStorage.setItem('little-explorer-form', JSON.stringify(formState))
    router.push('/loading')
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

      {/* Section C: Book mode (only shown for 2+ children) */}
      {children.length >= 2 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">📚</span>
            <h2 className="text-xl font-bold text-gray-800">Book format</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setBookMode('shared')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                bookMode === 'shared'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">📚</div>
              <div className={`font-bold text-sm mb-1 ${bookMode === 'shared' ? 'text-green-700' : 'text-gray-700'}`}>
                One book for everyone
              </div>
              <div className="text-xs text-gray-500 leading-snug">
                All explorers share one book. Great for kids close in age.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setBookMode('individual')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                bookMode === 'individual'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">🎒</div>
              <div className={`font-bold text-sm mb-1 ${bookMode === 'individual' ? 'text-green-700' : 'text-gray-700'}`}>
                One book per explorer
              </div>
              <div className="text-xs text-gray-500 leading-snug">
                Each child gets their own book, age-matched puzzles and personalized just for them.
              </div>
            </button>
          </div>

          {bookMode === 'individual' && (
            <p className="mt-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
              ✨ Each book will have difficulty levels matched to that child&apos;s age and activities tailored to their interests.
            </p>
          )}
        </section>
      )}

      {/* Section D: Email */}
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

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <input
          type="checkbox"
          id="disclaimer"
          checked={disclaimerChecked}
          onChange={(e) => setDisclaimerChecked(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-gray-300 text-green-600 flex-shrink-0 cursor-pointer"
          required
        />
        <label htmlFor="disclaimer" className="text-sm text-amber-800 leading-relaxed cursor-pointer">
          I understand this book is AI-generated and may contain inaccuracies. I take full responsibility for reviewing the content before sharing with my children. By generating this book, I confirm I am using it at my own discretion. Little Explorer and its creators are not responsible for any actions taken based on this content. We do not store your child&apos;s personal information.
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !disclaimerChecked}
        className="w-full py-4 px-8 rounded-2xl bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold text-lg transition-colors shadow-lg shadow-green-200"
      >
        {loading ? '🗺️ Getting started…' : '🌲 Create Our Book!'}
      </button>

      {verification && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mt-4">
          <h3 className="font-bold text-amber-800 mb-3">Verify your places</h3>
          <p className="text-sm text-amber-700 mb-3">We looked up the places you entered. Please check these:</p>
          <div className="space-y-2 mb-4">
            {verification.results.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {r.notFound ? (
                  <>
                    <span className="text-red-500 font-bold">?</span>
                    <span className="text-red-700">&quot;{r.original}&quot; — couldn&apos;t find this place. Double-check the spelling.</span>
                  </>
                ) : r.hasSuggestion ? (
                  <>
                    <span className="text-amber-500 font-bold">!</span>
                    <span className="text-gray-700">&quot;{r.original}&quot; &rarr; Did you mean <strong>&quot;{r.found}&quot;</strong>?</span>
                  </>
                ) : (
                  <>
                    <span className="text-green-500 font-bold">✓</span>
                    <span className="text-gray-700">{r.original}</span>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVerification(null)}
              className="flex-1 py-2 px-4 rounded-xl border-2 border-gray-300 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Edit Places
            </button>
            <button
              type="button"
              onClick={handleConfirmPlaces}
              className="flex-1 py-2 px-4 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors"
            >
              Use Suggestions &amp; Continue
            </button>
          </div>
          <button
            type="button"
            onClick={handleProceedWithOriginal}
            className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Keep my original spelling instead
          </button>
        </div>
      )}
    </form>
  )
}
