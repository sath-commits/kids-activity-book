'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GeneratedBook } from '@/lib/types'
import { getBook } from '@/lib/bookStore'
import PreviewScreen from '../components/PreviewScreen'

export default function PreviewPage() {
  const router = useRouter()
  const [book, setBookState] = useState<GeneratedBook | null>(null)

  useEffect(() => {
    const stored = getBook()
    if (!stored) {
      router.replace('/')
      return
    }
    setBookState(stored)
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
