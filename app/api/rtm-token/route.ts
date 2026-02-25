import { NextRequest, NextResponse } from 'next/server'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { RtmTokenBuilder, Role } = require('agora-access-token')

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || ''
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || ''

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid')

  if (!uid) {
    return NextResponse.json({ error: 'uid is required' }, { status: 400 })
  }

  if (!APP_ID || !APP_CERTIFICATE) {
    return NextResponse.json({ error: 'Agora credentials not configured' }, { status: 500 })
  }

  // Token valid for 24 hours
  const expireTs = Math.floor(Date.now() / 1000) + 24 * 60 * 60

  const token: string = RtmTokenBuilder.buildToken(
    APP_ID,
    APP_CERTIFICATE,
    uid,
    Role.Rtm_User,
    expireTs,
  )

  return NextResponse.json({ token })
}
