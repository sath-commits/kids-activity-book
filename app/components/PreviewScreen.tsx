'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { GeneratedBook } from '@/lib/types'
import { clearBook } from '@/lib/bookStore'

const PDFActions = dynamic(() => import('./PDFActions'), {
  ssr: false,
  loading: () => (
    <button disabled className="w-full py-4 px-8 rounded-2xl bg-green-300 text-white font-bold text-lg">
      ⏳ Loading PDF…
    </button>
  ),
})

interface PreviewScreenProps {
  books: GeneratedBook[]
}

export default function PreviewScreen({ books }: PreviewScreenProps) {
  const router = useRouter()
  const [activeIdx, setActiveIdx] = useState(0)
  const [pdfBlobs, setPdfBlobs] = useState<(Blob | null)[]>(books.map(() => null))
  const [emailSent, setEmailSent] = useState<boolean[]>(books.map(() => false))
  const [emailLoading, setEmailLoading] = useState<boolean[]>(books.map(() => false))
  const [emailErrors, setEmailErrors] = useState<(string | null)[]>(books.map(() => null))

  const book = books[activeIdx]
  const pdfBlob = pdfBlobs[activeIdx]
  const isIndividual = books.length > 1

  const childNames = book.childPersonalization.map((c) => c.name)
  const namesDisplay =
    childNames.length === 1
      ? `${childNames[0]}`
      : `${childNames.slice(0, -1).join(', ')} & ${childNames[childNames.length - 1]}`

  const fileName = isIndividual
    ? `${book.destinationSlug}-${book.childPersonalization[0]?.name?.toLowerCase()}-explorer.pdf`
    : `${book.destinationSlug}-explorer-book.pdf`

  const handleBlobReady = (blob: Blob | null) => {
    setPdfBlobs((prev) => prev.map((b, i) => (i === activeIdx ? blob : b)))
  }

  const handleEmailSend = async () => {
    if (!pdfBlob) return
    setEmailLoading((prev) => prev.map((v, i) => (i === activeIdx ? true : v)))
    setEmailErrors((prev) => prev.map((v, i) => (i === activeIdx ? null : v)))

    try {
      const arrayBuffer = await pdfBlob.arrayBuffer()
      const uint8 = new Uint8Array(arrayBuffer)
      let binary = ''
      for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i])
      const base64 = btoa(binary)

      const res = await fetch('/api/send-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentEmail: book.parentEmail,
          pdfBase64: base64,
          destinationDisplayName: book.destinationDisplayName,
          childNames,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setEmailErrors((prev) => prev.map((v, i) => (i === activeIdx ? (data.error ?? 'Failed to send email.') : v)))
      } else {
        setEmailSent((prev) => prev.map((v, i) => (i === activeIdx ? true : v)))
      }
    } catch {
      setEmailErrors((prev) => prev.map((v, i) => (i === activeIdx ? 'Failed to send email. Please try again.' : v)))
    } finally {
      setEmailLoading((prev) => prev.map((v, i) => (i === activeIdx ? false : v)))
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(232,249,239,0.92),_rgba(255,250,238,0.94)_48%,_rgba(255,255,255,1)_100%)] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎉</div>
          <h1 className="font-display text-4xl font-bold text-[var(--ink-strong)] mb-2">
            {isIndividual ? 'Your books are ready!' : 'Your book is ready!'}
          </h1>
          {isIndividual ? (
            <p className="text-[var(--brand-deep)] font-medium">
              {books.length} personalized books for {book.destinationDisplayName}
            </p>
          ) : (
            <p className="text-[var(--brand-deep)] font-medium">
              {namesDisplay}&apos;s {book.destinationDisplayName} Explorer Adventure
            </p>
          )}
          <p className="text-[var(--ink-soft)] text-sm mt-1">
            {book.content.sections.length} sections · {childNames.length} explorer{childNames.length > 1 ? 's' : ''}
          </p>
          {book.cacheHit && (
            <span className="inline-block mt-2 px-3 py-1 bg-[var(--brand-soft)] text-[var(--brand-deep)] text-xs rounded-full">
              ⚡ Delivered from cache
            </span>
          )}
        </div>

        {/* Child tabs for individual mode */}
        {isIndividual && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {books.map((b, i) => {
              const name = b.childPersonalization[0]?.name ?? `Book ${i + 1}`
              const age = b.childPersonalization[0]?.age
              return (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                    activeIdx === i
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-white/90 border-2 border-white text-[var(--ink-soft)] hover:border-[rgba(83,162,107,0.3)] shadow-sm'
                  }`}
                >
                  🎒 {name}
                  {age && <span className="ml-1 opacity-70 font-normal">age {age}</span>}
                  {pdfBlobs[i] && <span className="ml-1">✓</span>}
                </button>
              )
            })}
          </div>
        )}

        {/* Preview cards */}
        <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2">
          <div className="rounded-[1.75rem] border border-white/80 overflow-hidden bg-white/88 shadow-[0_18px_45px_rgba(36,67,52,0.12)]">
            {book.coverImageUrl ? (
              <img
                src={book.coverImageUrl}
                alt="Cover page preview"
                className="w-full object-cover"
                style={{ maxHeight: 320 }}
              />
            ) : (
              <div className="h-[320px] bg-[var(--brand-soft)] flex items-center justify-center">
                <span className="text-4xl">🌲</span>
              </div>
            )}
            <div className="p-4 text-center">
              <p className="text-sm font-semibold text-[var(--ink-strong)]">Cover Page</p>
              <p className="text-xs text-[var(--ink-soft)] mt-1">Personalized explorer cover with destination artwork</p>
            </div>
          </div>

          {book.sectionImageUrls?.[0] ? (
            <div className="rounded-[1.75rem] border border-white/80 overflow-hidden bg-white/88 shadow-[0_18px_45px_rgba(36,67,52,0.12)]">
              <img
                src={book.sectionImageUrls[0]}
                alt="Sample section preview"
                className="w-full object-cover"
                style={{ maxHeight: 320 }}
              />
              <div className="p-4 text-center">
                <p className="text-sm font-semibold text-[var(--ink-strong)]">
                  {book.content.sections[0]?.emoji} {book.content.sections[0]?.title}
                </p>
                <p className="text-xs text-[var(--ink-soft)] mt-1">Coloring page preview</p>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-white/80 bg-[var(--brand-soft)] flex flex-col items-center justify-center p-6 shadow-[0_18px_45px_rgba(36,67,52,0.12)]">
              <span className="text-3xl mb-2">{book.content.sections[0]?.emoji ?? '🗺️'}</span>
              <p className="text-sm font-semibold text-[var(--ink-strong)] text-center">
                {book.content.sections[0]?.title ?? 'Sample Section'}
              </p>
            </div>
          )}
        </div>

        {/* Book summary */}
        <div className="bg-white/86 rounded-[1.75rem] border border-white/80 p-5 mb-6 shadow-[0_20px_50px_rgba(36,67,52,0.1)]">
          <h2 className="font-bold text-[var(--ink-strong)] mb-3 text-sm uppercase tracking-[0.18em]">
            📋 {isIndividual ? `${book.childPersonalization[0]?.name}'s book:` : "What's inside:"}
          </h2>
          {isIndividual && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {book.childPersonalization[0]?.keywords?.map((kw) => (
                <span key={kw} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                  {kw}
                </span>
              ))}
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                age {book.childPersonalization[0]?.age} level activities
              </span>
            </div>
          )}
          <div className="space-y-1">
            {book.content.sections.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
                <span>{s.emoji}</span>
                <span>{s.title}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">🔍 Scavenger Hunt</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">🎯 Adventure Bingo</span>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">🏅 Explorer Badges</span>
            {childNames.map((name) => (
              <span key={name} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                🏆 {name}&apos;s Certificate
              </span>
            ))}
          </div>
        </div>

        {/* PDF actions — keyed by activeIdx so it re-mounts when tab switches */}
        <PDFActions
          key={activeIdx}
          book={book}
          fileName={fileName}
          onBlobReady={handleBlobReady}
          onEmailSend={handleEmailSend}
          emailSent={emailSent[activeIdx]}
          emailLoading={emailLoading[activeIdx]}
          emailError={emailErrors[activeIdx]}
          pdfBlob={pdfBlob}
        />

        {/* Start over */}
        <button
          onClick={() => {
            clearBook()
            sessionStorage.removeItem('little-explorer-form')
            router.push('/')
          }}
          className="w-full py-2.5 mt-3 text-[var(--ink-soft)] hover:text-[var(--ink-strong)] text-sm font-medium transition-colors"
        >
          🔄 Make another book
        </button>

        <p className="text-center text-xs text-[var(--ink-soft)]/70 mt-8">
          Little Explorer ·{' '}
          <a href="https://builtthisweekend.com" className="underline">
            builtthisweekend.com
          </a>
        </p>
      </div>
    </div>
  )
}
