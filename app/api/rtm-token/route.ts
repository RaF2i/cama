import { NextRequest, NextResponse } from 'next/server'
// eslint-disable-next-line @typescript-eslint/no-require-imports
import { RtmTokenBuilder, RtmRole } from 'agora-access-token'

export async function GET(req: NextRequest) {
  // Read inside handler — ensures env vars are available at request time
  const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || ''
  const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || ''

  const uid = req.nextUrl.searchParams.get('uid')

  if (!uid) {
    return NextResponse.json({ error: 'uid is required' }, { status: 400 })
  }

  if (!APP_ID) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_AGORA_APP_ID is not set' }, { status: 500 })
  }

  if (!APP_CERTIFICATE) {
    return NextResponse.json({ error: 'AGORA_APP_CERTIFICATE is not set' }, { status: 500 })
  }

  try {
    // Token valid for 24 hours
    const expireTs = Math.floor(Date.now() / 1000) + 24 * 60 * 60

    const token: string = RtmTokenBuilder.buildToken(
      APP_ID,
      APP_CERTIFICATE,
      uid,
      RtmRole.Rtm_User,
      expireTs,
    )

    return NextResponse.json({ token })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[rtm-token] buildToken failed:', message)
    return NextResponse.json({ error: `Token generation failed: ${message}` }, { status: 500 })
  }
}
