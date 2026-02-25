'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const CHANNEL_ID = '123'
const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || ''

export interface ChatMessage {
  id: string
  uid: string
  displayName: string
  text: string
  timestamp: number
  isOwn: boolean
}

export interface UseAgoraRTMReturn {
  messages: ChatMessage[]
  sendMessage: (text: string) => Promise<void>
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  myDisplayName: string
}

function generateGuestName(): string {
  const id = Math.floor(Math.random() * 9000) + 1000
  return `Guest ${id}`
}

function generateUid(): string {
  return `user_${Math.random().toString(36).slice(2, 10)}`
}

async function fetchRtmToken(uid: string): Promise<string> {
  const res = await fetch(`/api/rtm-token?uid=${encodeURIComponent(uid)}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Token fetch failed (${res.status})`)
  }
  const { token } = await res.json()
  return token as string
}

export function useAgoraRTM(): UseAgoraRTMReturn {
  const uidRef = useRef<string>(generateUid())
  const displayNameRef = useRef<string>(generateGuestName())
  const rtmRef = useRef<any>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!APP_ID) {
      setError('Agora App ID is not set')
      return
    }

    let cancelled = false

    const initRTM = async () => {
      try {
        setError(null)
        setIsConnecting(true)

        // 1. Fetch a fresh RTM token from the Next.js API route
        const token = await fetchRtmToken(uidRef.current)
        if (cancelled) return

        // 2. Load Agora RTM SDK (avoid SSR issues)
        const AgoraRTM = (await import('agora-rtm-sdk')).default
        if (cancelled) return

        // 3. Create RTM v2 client
        const rtm = new (AgoraRTM as any).RTM(APP_ID, uidRef.current, {
          token,
          logLevel: 'WARN',
        })
        rtmRef.current = rtm

        // 4. Incoming channel messages
        rtm.addEventListener('message', (event: any) => {
          if (cancelled) return
          try {
            const payload = JSON.parse(event.message as string)
            setMessages((prev) => [
              ...prev,
              {
                id: `${event.publisher}-${Date.now()}-${Math.random()}`,
                uid: event.publisher,
                displayName: payload.displayName || `User ${event.publisher.slice(-4)}`,
                text: payload.text,
                timestamp: Date.now(),
                isOwn: false,
              },
            ])
          } catch {
            setMessages((prev) => [
              ...prev,
              {
                id: `${event.publisher}-${Date.now()}-${Math.random()}`,
                uid: event.publisher,
                displayName: `User ${event.publisher.slice(-4)}`,
                text: String(event.message),
                timestamp: Date.now(),
                isOwn: false,
              },
            ])
          }
        })

        rtm.addEventListener('status', (event: any) => {
          if (event.state === 'DISCONNECTED' && !cancelled) {
            setIsConnected(false)
          }
        })

        // 5. Login with the server-generated token
        await rtm.login({ token })
        if (cancelled) { await rtm.logout(); return }

        // 6. Subscribe to channel
        await rtm.subscribe(CHANNEL_ID)
        if (cancelled) { await rtm.unsubscribe(CHANNEL_ID); await rtm.logout(); return }

        setIsConnected(true)
        setIsConnecting(false)
      } catch (err) {
        if (cancelled) return
        const errorMsg = err instanceof Error ? err.message : 'Failed to connect to chat'
        setError(errorMsg)
        setIsConnecting(false)
      }
    }

    initRTM()

    return () => {
      cancelled = true
      const rtm = rtmRef.current
      if (rtm) {
        rtmRef.current = null
        rtm.unsubscribe(CHANNEL_ID).catch(() => {})
        rtm.logout().catch(() => {})
      }
    }
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    const rtm = rtmRef.current
    if (!rtm || !text.trim()) return

    const trimmed = text.trim()
    const payload = JSON.stringify({
      text: trimmed,
      displayName: displayNameRef.current,
    })

    try {
      await rtm.publish(CHANNEL_ID, payload)
      setMessages((prev) => [
        ...prev,
        {
          id: `own-${Date.now()}-${Math.random()}`,
          uid: uidRef.current,
          displayName: displayNameRef.current,
          text: trimmed,
          timestamp: Date.now(),
          isOwn: true,
        },
      ])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send message'
      setError(errorMsg)
    }
  }, [])

  return {
    messages,
    sendMessage,
    isConnected,
    isConnecting,
    error,
    myDisplayName: displayNameRef.current,
  }
}
