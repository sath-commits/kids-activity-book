'use client'

// All @react-pdf/renderer usage lives here so it loads as a single dynamic chunk.
import { useEffect, useMemo, useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { GeneratedBook } from '@/lib/types'
import BookPDF from './pdf/BookPDF'

interface PDFActionsProps {
  book: GeneratedBook
  fileName: string
  onBlobReady: (blob: Blob) => void
  onEmailSend: () => void
  emailSent: boolean
  emailLoading: boolean
  emailError: string | null
  pdfBlob: Blob | null
}

export default function PDFActions({
  book,
  fileName,
  onBlobReady,
  onEmailSend,
  emailSent,
  emailLoading,
  emailError,
  pdfBlob,
}: PDFActionsProps) {
  const [preparedCoverUrl, setPreparedCoverUrl] = useState<string | null>(null)
  const [preparedSectionUrls, setPreparedSectionUrls] = useState<(string | null)[] | null>(null)
  const [assetsLoading, setAssetsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function preparePdfAssets() {
      setAssetsLoading(true)
      setPreparedCoverUrl(null)
      setPreparedSectionUrls(null)

      try {
        const res = await fetch('/api/pdf-assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coverImageUrl: book.coverImageUrl,
            sectionImageUrls: book.sectionImageUrls,
          }),
        })
        const data = await res.json()
        if (cancelled) return
        setPreparedCoverUrl(data.coverImageDataUrl ?? book.coverImageUrl ?? null)
        setPreparedSectionUrls(
          Array.isArray(data.sectionImageDataUrls) ? data.sectionImageDataUrls : book.sectionImageUrls
        )
      } catch {
        if (cancelled) return
        setPreparedCoverUrl(book.coverImageUrl ?? null)
        setPreparedSectionUrls(book.sectionImageUrls)
      } finally {
        if (!cancelled) setAssetsLoading(false)
      }
    }

    preparePdfAssets()
    return () => {
      cancelled = true
    }
  }, [book])

  const pdfBook = useMemo<GeneratedBook>(() => ({
    ...book,
    coverImageUrl: preparedCoverUrl ?? book.coverImageUrl,
    sectionImageUrls: preparedSectionUrls ?? book.sectionImageUrls,
  }), [book, preparedCoverUrl, preparedSectionUrls])

  return (
    <div className="space-y-3">
      {/* Download */}
      <PDFDownloadLink
        document={<BookPDF book={pdfBook} />}
        fileName={fileName}
        className="block w-full"
      >
        {({ loading, blob, error: pdfError }) => {
          if (blob && !pdfBlob) onBlobReady(blob)
          if (pdfError) console.error('PDF render error:', pdfError)
          return (
            <button
              disabled={assetsLoading || loading || !!pdfError}
              className="w-full py-4 px-8 rounded-2xl bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold text-lg transition-colors shadow-lg shadow-green-200"
            >
              {assetsLoading ? '🖼️ Preparing artwork…' : loading ? '⏳ Building PDF…' : pdfError ? `❌ PDF Error: ${pdfError.message}` : '⬇️ Download PDF'}
            </button>
          )
        }}
      </PDFDownloadLink>

      {/* Email */}
      <button
        onClick={onEmailSend}
        disabled={emailLoading || emailSent || !pdfBlob}
        className={`w-full py-3 px-8 rounded-2xl border-2 font-semibold text-base transition-colors ${
          emailSent
            ? 'border-green-300 bg-green-50 text-green-700'
            : 'border-green-400 text-green-700 hover:bg-green-50 disabled:opacity-50'
        }`}
      >
        {emailSent ? '✅ Email sent!' : emailLoading ? '📨 Sending…' : `📧 Email to ${book.parentEmail}`}
      </button>

      {emailError && <p className="text-red-600 text-sm text-center">{emailError}</p>}

      {!pdfBlob && (
        <p className="text-xs text-gray-400 text-center">
          The email button will activate once the PDF artwork and document have finished loading.
        </p>
      )}
    </div>
  )
}
