'use client'

import { useEffect, useRef } from 'react'
import type { ICameraVideoTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng'

interface VideoContainerProps {
  videoTrack: ICameraVideoTrack | null
  remoteUsers: IAgoraRTCRemoteUser[]
  isLocal?: boolean
}

export function VideoContainer({
  videoTrack,
  remoteUsers,
  isLocal = false,
}: VideoContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const remoteVideoRefs = useRef<Record<string | number, HTMLDivElement>>({})

  // Mount local video track
  useEffect(() => {
    if (!isLocal || !videoTrack || !containerRef.current) return

    const play = async () => {
      try {
        await videoTrack.play(containerRef.current!)
      } catch (err) {
        console.error('Failed to play local video:', err)
      }
    }

    play()

    return () => {
      videoTrack.stop()
    }
  }, [videoTrack, isLocal])

  // Mount remote video tracks
  useEffect(() => {
    remoteUsers.forEach((user) => {
      const videoElement = remoteVideoRefs.current[user.uid]
      if (videoElement && user.videoTrack) {
        user.videoTrack.play(videoElement)
      }
    })

    return () => {
      remoteUsers.forEach((user) => {
        if (user.videoTrack) {
          user.videoTrack.stop()
        }
      })
    }
  }, [remoteUsers])

  if (isLocal) {
    return (
      <div
        ref={containerRef}
        className="w-full h-full bg-black rounded-lg overflow-hidden"
        style={{ aspectRatio: '16 / 9' }}
      />
    )
  }

  return (
    <div className="w-full grid gap-4">
      {remoteUsers.map((user) => (
        <div
          key={user.uid}
          ref={(el) => {
            if (el) remoteVideoRefs.current[user.uid] = el
          }}
          className="w-full bg-black rounded-lg overflow-hidden"
          style={{ aspectRatio: '16 / 9' }}
        />
      ))}
      {remoteUsers.length === 0 && (
        <div className="w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center h-96">
          <p className="text-muted-foreground text-center">
            Waiting for broadcaster to connect...
          </p>
        </div>
      )}
    </div>
  )
}
