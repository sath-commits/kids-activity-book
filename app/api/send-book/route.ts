import { NextRequest, NextResponse } from 'next/server'
import { getResend } from '@/lib/resend'

export const maxDuration = 30

// Allow large request bodies for PDF attachments
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { parentEmail, pdfBase64, destinationDisplayName, childNames } = body

    if (!parentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return NextResponse.json({ error: 'Missing PDF data' }, { status: 400 })
    }
    if (!destinationDisplayName || !Array.isArray(childNames) || childNames.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const namesDisplay =
      childNames.length === 1
        ? childNames[0]
        : childNames.slice(0, -1).join(', ') + ' & ' + childNames[childNames.length - 1]

    const subject = `${namesDisplay}'s ${destinationDisplayName} Explorer Book is ready!`

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64')

    await getResend().emails.send({
      from: 'Little Explorer <hello@builtthisweekend.com>',
      to: parentEmail,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2d6a4f;">🌲 Your Explorer Book is Ready!</h1>
          <p>Hi there!</p>
          <p>
            The <strong>${destinationDisplayName} Junior Explorer Adventure</strong> book for
            <strong>${namesDisplay}</strong> is attached to this email.
          </p>
          <p>
            <strong>Printing tip:</strong> For the best experience, print double-sided and assemble into a booklet.
            Use cardstock for the cover if you can!
          </p>
          <p>
            Have an amazing adventure! 🎒🗺️
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">
            Little Explorer · <a href="https://builtthisweekend.com">builtthisweekend.com</a><br/>
            We only used your child's first name and age to personalize this book. We never store or share your child's information.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `${destinationDisplayName.toLowerCase().replace(/\s+/g, '-')}-explorer-book.pdf`,
          content: pdfBuffer,
        },
      ],
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[send-book]', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
