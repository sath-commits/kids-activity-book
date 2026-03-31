'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { GeneratedBook } from '@/lib/types'
import { clearBook } from '@/lib/bookStore'

// Load all @react-pdf/renderer usage as a single dynamic chunk (avoids ChunkLoadError)
const PDFActions = dynamic(() => import('./PDFActions'), {
  ssr: false,
  loading: () => (
    <button disabled className="w-full py-4 px-8 rounded-2xl bg-green-300 text-white font-bold text-lg">
      ⏳ Loading PDF…
    </button>
  ),
})

interface PreviewScreenProps {
  book: GeneratedBook
}

export default function PreviewScreen({ book }: PreviewScreenProps) {
  const router = useRouter()
  const [emailSent, setEmailSent] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)

  const childNames = book.childPersonalization.map((c) => c.name)
  const namesDisplay =
    childNames.length === 1
      ? `${childNames[0]}`
      : `${childNames.slice(0, -1).join(', ')} & ${childNames[childNames.length - 1]}`

  const fileName = `${book.destinationSlug}-explorer-book.pdf`

  const handleEmailSend = async () => {
    if (!pdfBlob) return
    setEmailLoading(true)
    setEmailError(null)

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
        setEmailError(data.error ?? 'Failed to send email.')
      } else {
        setEmailSent(true)
      }
    } catch {
      setEmailError('Failed to send email. Please try again.')
    } finally {
      setEmailLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎉</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Your book is ready!</h1>
          <p className="text-green-700 font-medium">
            {namesDisplay}&apos;s {book.destinationDisplayName} Explorer Adventure
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {book.content.sections.length} sections · {childNames.length} explorer{childNames.length > 1 ? 's' : ''}
          </p>
          {book.cacheHit && (
            <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              ⚡ Delivered from cache
            </span>
          )}
        </div>

        {/* Preview cards */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="rounded-xl border-2 border-gray-200 overflow-hidden bg-white shadow-sm">
            {book.coverImageB64 ? (
              <img
                src={`data:image/png;base64,${book.coverImageB64}`}
                alt="Cover page preview"
                className="w-full object-cover"
                style={{ maxHeight: 220 }}
              />
            ) : (
              <div className="h-[220px] bg-green-50 flex items-center justify-center">
                <span className="text-4xl">🌲</span>
              </div>
            )}
            <div className="p-3 text-center">
              <p className="text-xs font-semibold text-gray-600">Cover Page</p>
            </div>
          </div>

          {book.sectionImagesB64?.[0] ? (
            <div className="rounded-xl border-2 border-gray-200 overflow-hidden bg-white shadow-sm">
              <img
                src={`data:image/png;base64,${book.sectionImagesB64[0]}`}
                alt="Sample section preview"
                className="w-full object-cover"
                style={{ maxHeight: 220 }}
              />
              <div className="p-3 text-center">
                <p className="text-xs font-semibold text-gray-600">
                  {book.content.sections[0]?.emoji} {book.content.sections[0]?.title}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-gray-200 bg-green-50 flex flex-col items-center justify-center p-6 shadow-sm">
              <span className="text-3xl mb-2">{book.content.sections[0]?.emoji ?? '🗺️'}</span>
              <p className="text-xs font-semibold text-gray-600 text-center">
                {book.content.sections[0]?.title ?? 'Sample Section'}
              </p>
            </div>
          )}
        </div>

        {/* Book summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
          <h2 className="font-bold text-gray-700 mb-3 text-sm">📋 What&apos;s inside:</h2>
          <div className="space-y-1">
            {book.content.sections.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-sm text-gray-600">
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

        {/* PDF actions (download + email) */}
        <PDFActions
          book={book}
          fileName={fileName}
          onBlobReady={setPdfBlob}
          onEmailSend={handleEmailSend}
          emailSent={emailSent}
          emailLoading={emailLoading}
          emailError={emailError}
          pdfBlob={pdfBlob}
        />

        {/* Start over */}
        <button
          onClick={() => {
            clearBook()
            sessionStorage.removeItem('little-explorer-form')
            router.push('/')
          }}
          className="w-full py-2.5 mt-3 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
        >
          🔄 Make another book
        </button>

        <p className="text-center text-xs text-gray-400 mt-8">
          Little Explorer ·{' '}
          <a href="https://builtthisweekend.com" className="underline">
            builtthisweekend.com
          </a>
        </p>
      </div>
    </div>
  )
}
