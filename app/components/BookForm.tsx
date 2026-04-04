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
  const sectionTitleClass = 'font-display text-2xl font-extrabold tracking-[-0.03em] text-[var(--ink-strong)]'
  const labelClass = 'mb-1 block text-sm font-semibold text-[var(--ink-strong)]'
  const inputClass = 'w-full rounded-2xl border border-white bg-white/92 px-4 py-3 text-base shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const inputSmallClass = 'w-full rounded-2xl border border-white bg-white/92 px-3 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'

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
      <section className="rounded-[1.75rem] border border-[rgba(53,88,67,0.1)] bg-[linear-gradient(135deg,rgba(232,249,239,0.82),rgba(255,255,255,0.74))] p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🗺️</span>
          <h2 className={sectionTitleClass}>Where are you going?</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>
              Destination *
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => handleDestinationChange(e.target.value)}
              placeholder="e.g. Yellowstone National Park, Grand Canyon, San Diego Zoo"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Specific places you&apos;ll visit{' '}
              <span className="text-[var(--ink-soft)] font-normal">(optional but recommended)</span>
            </label>
            <textarea
              value={places}
              onChange={(e) => setPlaces(e.target.value)}
              placeholder="e.g. the aquarium, downtown, beach boardwalk, theme park"
              rows={2}
              className={`${inputClass} resize-none`}
            />
            <p className="text-xs text-[var(--ink-soft)] mt-1">
              We&apos;ll build the book around your actual stops and add a map of your route.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Trip Start <span className="text-[var(--ink-soft)] font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={tripStart}
                onChange={(e) => setTripStart(e.target.value)}
                className={inputSmallClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Trip End <span className="text-[var(--ink-soft)] font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={tripEnd}
                onChange={(e) => setTripEnd(e.target.value)}
                className={inputSmallClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={inputSmallClass}
            >
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Section B: Children */}
      <section className="rounded-[1.75rem] border border-[rgba(93,145,206,0.12)] bg-[linear-gradient(135deg,rgba(236,244,255,0.78),rgba(255,255,255,0.76))] p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🎒</span>
          <h2 className={sectionTitleClass}>Tell us about your explorers</h2>
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
              className="w-full rounded-2xl border border-dashed border-[rgba(83,162,107,0.34)] bg-white/65 py-3 text-sm font-semibold text-[var(--brand-deep)] transition hover:bg-white"
            >
              + Add another explorer
            </button>
          )}
        </div>
      </section>

      {/* Section C: Book mode (only shown for 2+ children) */}
      {children.length >= 2 && (
        <section className="rounded-[1.75rem] border border-[rgba(243,182,85,0.18)] bg-[linear-gradient(135deg,rgba(255,247,222,0.82),rgba(255,255,255,0.76))] p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">📚</span>
            <h2 className={sectionTitleClass}>Book format</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setBookMode('shared')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                bookMode === 'shared'
                  ? 'border-[var(--brand)] bg-white shadow-md'
                  : 'border-white bg-white/80 hover:border-[rgba(83,162,107,0.25)]'
              }`}
            >
              <div className="text-2xl mb-1">📚</div>
              <div className={`font-bold text-sm mb-1 ${bookMode === 'shared' ? 'text-[var(--brand-deep)]' : 'text-[var(--ink-strong)]'}`}>
                One book for everyone
              </div>
              <div className="text-xs text-[var(--ink-soft)] leading-snug">
                All explorers share one book. Great for kids close in age.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setBookMode('individual')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                bookMode === 'individual'
                  ? 'border-[var(--brand)] bg-white shadow-md'
                  : 'border-white bg-white/80 hover:border-[rgba(83,162,107,0.25)]'
              }`}
            >
              <div className="text-2xl mb-1">🎒</div>
              <div className={`font-bold text-sm mb-1 ${bookMode === 'individual' ? 'text-[var(--brand-deep)]' : 'text-[var(--ink-strong)]'}`}>
                One book per explorer
              </div>
              <div className="text-xs text-[var(--ink-soft)] leading-snug">
                Each child gets their own book, age-matched puzzles and personalized just for them.
              </div>
            </button>
          </div>

          {bookMode === 'individual' && (
            <p className="mt-2 rounded-2xl bg-[var(--brand-soft)] px-3 py-2 text-xs text-[var(--brand-deep)]">
              ✨ Each book will have difficulty levels matched to that child&apos;s age and activities tailored to their interests.
            </p>
          )}
        </section>
      )}

      {/* Section D: Email */}
      <section className="rounded-[1.75rem] border border-[rgba(53,88,67,0.1)] bg-[linear-gradient(135deg,rgba(245,248,250,0.82),rgba(255,255,255,0.78))] p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📬</span>
          <h2 className={sectionTitleClass}>How to get your book</h2>
        </div>

        <div>
          <label className={labelClass}>
            Your email address *
          </label>
          <input
            type="email"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            placeholder="parent@example.com"
            required
            className={inputClass}
          />
          <p className="text-xs text-[var(--ink-soft)] mt-2">
            We'll email you the PDF so you can print it anytime.
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-white bg-white/75 p-4">
          <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
            🔒 <strong>Privacy:</strong> We only use your child's first name and age to personalize the book. We never store or share your child's information. Your email is used only to send your book.
          </p>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-3 rounded-[1.5rem] border border-amber-200 bg-amber-50/90 p-4">
        <input
          type="checkbox"
          id="disclaimer"
          checked={disclaimerChecked}
          onChange={(e) => setDisclaimerChecked(e.target.checked)}
          className="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-gray-300 text-green-600"
          required
        />
        <label htmlFor="disclaimer" className="cursor-pointer text-sm leading-relaxed text-amber-800">
          I understand this book is AI-generated and may contain inaccuracies. I take full responsibility for reviewing the content before sharing with my children. By generating this book, I confirm I am using it at my own discretion. Little Explorer and its creators are not responsible for any actions taken based on this content. We do not store your child&apos;s personal information.
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !disclaimerChecked}
        className="w-full rounded-[1.75rem] bg-[linear-gradient(135deg,#53a26b,#3f8657)] px-8 py-4 text-lg font-bold text-white shadow-[0_18px_40px_rgba(83,162,107,0.26)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-55"
      >
        {loading ? '🗺️ Getting started…' : '🌲 Create Our Book!'}
      </button>

      {verification && (
        <div className="mt-4 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4">
          <h3 className="mb-3 font-bold text-amber-800">Verify your places</h3>
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
              className="flex-1 rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:bg-gray-50"
            >
              Edit Places
            </button>
            <button
              type="button"
              onClick={handleConfirmPlaces}
              className="flex-1 rounded-2xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
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
