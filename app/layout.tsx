import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Little Explorer — Personalized Activity Books for Kids',
  description:
    "Create a personalized, printable junior ranger activity booklet for your kids. AI-generated for any destination in the world.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">{children}</body>
    </html>
  )
}
