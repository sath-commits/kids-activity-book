'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GeneratedBook } from '@/lib/types'
import PreviewScreen from '../components/PreviewScreen'

export default function PreviewPage() {
  const router = useRouter()
  const [book, setBook] = useState<GeneratedBook | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('little-explorer-book')
    if (!raw) {
      router.replace('/')
      return
    }
    try {
      setBook(JSON.parse(raw) as GeneratedBook)
    } catch {
      router.replace('/')
    }
  }, [router])

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <div className="text-4xl animate-bounce">🌲</div>
      </div>
    )
  }

  return <PreviewScreen book={book} />
}
