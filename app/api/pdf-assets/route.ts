import { NextRequest, NextResponse } from 'next/server'

function isAllowedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const supabaseUrl = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL) : null
    return !!supabaseUrl && parsed.hostname === supabaseUrl.hostname
  } catch {
    return false
  }
}

async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') ?? 'image/png'
    const buffer = Buffer.from(await res.arrayBuffer())
    return `data:${contentType};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const coverImageUrl = typeof body?.coverImageUrl === 'string' ? body.coverImageUrl : null
  const sectionImageUrls = Array.isArray(body?.sectionImageUrls) ? body.sectionImageUrls : []

  const safeCoverUrl = coverImageUrl && isAllowedImageUrl(coverImageUrl) ? coverImageUrl : null
  const safeSectionUrls = sectionImageUrls.map((url: unknown) => (typeof url === 'string' && isAllowedImageUrl(url) ? url : null))

  const [coverImageDataUrl, ...sectionImageDataUrls] = await Promise.all([
    safeCoverUrl ? fetchAsDataUrl(safeCoverUrl) : Promise.resolve(null),
    ...safeSectionUrls.map((url: string | null) => (url ? fetchAsDataUrl(url) : Promise.resolve(null))),
  ])

  return NextResponse.json({
    coverImageDataUrl,
    sectionImageDataUrls,
  })
}
