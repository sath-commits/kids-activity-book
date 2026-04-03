import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai'
import { getSupabase } from '@/lib/supabase'
import { slugify } from '@/lib/slugify'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const destination: string = body?.destination ?? ''

    if (!destination || typeof destination !== 'string' || destination.trim().length === 0) {
      return NextResponse.json({ error: 'Destination is required' }, { status: 400 })
    }

    const trimmed = destination.trim().slice(0, 200)

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 200,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a geography assistant. Return ONLY valid JSON with no markdown, no code fences.',
        },
        {
          role: 'user',
          content: `Given this destination input: "${trimmed}"
Return JSON with this exact shape:
{
  "displayName": "Full official name, e.g. Olympic National Park, Washington, USA",
  "slug": "lowercase-hyphenated-slug-max-60-chars",
  "isValid": true,
  "invalidReason": null
}
If the input is not a real visitable place (e.g. gibberish, a person's name, a fictional place), set isValid to false and invalidReason to a friendly 1-sentence explanation.
Return ONLY the JSON object.`,
        },
      ],
    })

    const raw = completion.choices[0].message.content?.trim() ?? ''
    let parsed: {
      displayName: string
      slug: string
      isValid: boolean
      invalidReason: string | null
    }

    try {
      parsed = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: 'Failed to parse destination' }, { status: 500 })
    }

    if (!parsed.isValid) {
      return NextResponse.json({
        isValid: false,
        invalidReason: parsed.invalidReason,
        displayName: trimmed,
        slug: '',
        cacheHit: false,
      })
    }

    // Normalize slug further
    const finalSlug = slugify(parsed.slug || parsed.displayName)

    // Check cache
    const { data } = await getSupabase()
      .from('destination_cache')
      .select('destination_slug')
      .eq('destination_slug', finalSlug)
      .maybeSingle()

    return NextResponse.json({
      isValid: true,
      invalidReason: null,
      displayName: parsed.displayName,
      slug: finalSlug,
      cacheHit: !!data,
    })
  } catch (err) {
    console.error('[canonicalize-destination]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
