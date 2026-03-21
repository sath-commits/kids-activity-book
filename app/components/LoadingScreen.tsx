'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const MESSAGES = [
  'Packing our backpacks…',
  'Reading up on your destination…',
  'Drawing the coloring pages…',
  'Writing your adventure missions…',
  'Almost ready to explore!',
  'Rolling up the map…',
  'Adding final touches…',
]

export default function LoadingScreen() {
  const router = useRouter()
  const [messageIdx, setMessageIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [childNames, setChildNames] = useState<string[]>([])
  const [destinationName, setDestinationName] = useState('')
  const [cacheHit, setCacheHit] = useState(false)
  const hasFetched = useRef(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('little-explorer-form')
    if (!raw) {
      router.replace('/')
      return
    }

    const form = JSON.parse(raw) as {
      destination: string
      tripDates: { start: string; end: string } | null
      children: { name: string; age: number; gender: string; interests?: string }[]
      language: string
      parentEmail: string
      destinationSlug: string
      displayName: string
      cacheHit: boolean
    }

    setChildNames(form.children.map((c) => c.name))
    setDestinationName(form.displayName)
    setCacheHit(form.cacheHit)

    if (hasFetched.current) return
    hasFetched.current = true

    generateBook(form)
  }, [router])

  const generateBook = async (form: {
    destination: string
    tripDates: { start: string; end: string } | null
    children: { name: string; age: number; gender: string; interests?: string }[]
    language: string
    parentEmail: string
    destinationSlug: string
    displayName: string
    cacheHit: boolean
  }) => {
    try {
      const res = await fetch('/api/generate-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationSlug: form.destinationSlug,
          destinationDisplayName: form.displayName,
          tripDates: form.tripDates ?? undefined,
          children: form.children,
          language: form.language,
          parentEmail: form.parentEmail,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      sessionStorage.setItem('little-explorer-book', JSON.stringify(data))
      router.push('/preview')
    } catch {
      setError('Failed to generate your book. Please try again.')
    }
  }

  // Progress animation
  useEffect(() => {
    const target = cacheHit ? 95 : 85
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= target) {
          clearInterval(interval)
          return p
        }
        const increment = cacheHit ? 12 : 1.5
        return Math.min(p + increment, target)
      })
    }, cacheHit ? 200 : 600)
    return () => clearInterval(interval)
  }, [cacheHit])

  // Rotate messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIdx((i) => (i + 1) % MESSAGES.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  const namesDisplay =
    childNames.length === 0
      ? 'your explorers'
      : childNames.length === 1
      ? `${childNames[0]}`
      : `${childNames.slice(0, -1).join(', ')} & ${childNames[childNames.length - 1]}`

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-6">
        <div className="max-w-md text-center">
          <p className="text-4xl mb-4">😕</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-6">
      <div className="max-w-lg w-full text-center">
        {/* Animated icon */}
        <div className="text-6xl mb-6 animate-bounce">🌲</div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Creating your adventure book!
        </h1>

        {childNames.length > 0 && (
          <p className="text-green-700 font-semibold mb-1">
            Getting ready for {namesDisplay}'s big adventure!
          </p>
        )}

        {destinationName && (
          <p className="text-gray-500 text-sm mb-8">📍 {destinationName}</p>
        )}

        {/* Estimated time */}
        <div className="mb-6 inline-block px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
          {cacheHit ? '⚡ Estimated wait: ~5 seconds' : '⏳ Estimated wait: ~45–60 seconds'}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Rotating message */}
        <p className="text-gray-500 text-sm min-h-[1.5rem] transition-all duration-500">
          {MESSAGES[messageIdx]}
        </p>

        <p className="text-xs text-gray-400 mt-8">
          Please keep this tab open while we create your book…
        </p>
      </div>
    </div>
  )
}
