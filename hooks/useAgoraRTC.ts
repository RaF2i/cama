'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng'


const CHANNEL_ID = '123'
const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || ''
const TOKEN = process.env.NEXT_PUBLIC_AGORA_TEMP_TOKEN || null

export interface UseAgoraRTCProps {
  mode: 'broadcaster' | 'viewer'
  onError?: (error: Error) => void
}

export interface UseAgoraRTCReturn {
  client: IAgoraRTCClient | null
  localVideoTrack: ICameraVideoTrack | null
  localAudioTrack: IMicrophoneAudioTrack | null
  remoteUsers: IAgoraRTCRemoteUser[]
  isJoined: boolean
  isLoading: boolean
  isMicOn: boolean
  isCameraOn: boolean
  currentCamera: string
  availableCameras: MediaDeviceInfo[]
  error: string | null
  toggleMic: () => Promise<void>
  toggleCamera: () => Promise<void>
  switchCamera: (cameraId: string) => Promise<void>
  leave: () => Promise<void>
}

export function useAgoraRTC(props: UseAgoraRTCProps): UseAgoraRTCReturn {
  const { mode, onError } = props

  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null)
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null)

  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([])
  const [isJoined, setIsJoined] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [currentCamera, setCurrentCamera] = useState<string>('')
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [error, setError] = useState<string | null>(null)

  // Initialize Agora client
  useEffect(() => {
    if (!APP_ID) {
      const errorMsg = 'Agora App ID is not set. Please add NEXT_PUBLIC_AGORA_APP_ID to your .env.local'
      setError(errorMsg)
      onError?.(new Error(errorMsg))
      return
    }

    let cancelled = false

    const initClient = async () => {
      try {
        setIsLoading(true)

        // Dynamically import Agora SDK to avoid "window is not defined" during SSR
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default

        if (cancelled) return

        // Create Agora RTC client
        const client = AgoraRTC.createClient({
          mode: 'rtc',
          codec: 'vp8',
        })

        // Handle remote users
        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType)

          if (mediaType === 'video') {
            setRemoteUsers((prevUsers) => {
              const exists = prevUsers.some((u) => u.uid === user.uid)
              return exists ? prevUsers : [...prevUsers, user]
            })
          }

          if (mediaType === 'audio') {
            user.audioTrack?.play()
          }
        })

        client.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'video') {
            setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid))
          }
        })

        client.on('user-left', (user) => {
          setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid))
        })

        clientRef.current = client

        // For broadcaster, join and publish
        if (mode === 'broadcaster') {
          await client.join(APP_ID, CHANNEL_ID, TOKEN)
          if (cancelled) return
          setIsJoined(true)

          // Create and publish tracks
          const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()

          if (cancelled) {
            audioTrack.close()
            videoTrack.close()
            return
          }

          audioTrackRef.current = audioTrack
          videoTrackRef.current = videoTrack

          await client.publish([audioTrack, videoTrack])

          setIsMicOn(true)
          setIsCameraOn(true)

          // Get available cameras
          const cameras = await AgoraRTC.getCameras()
          setAvailableCameras(cameras)
          if (cameras.length > 0) {
            setCurrentCamera(cameras[0].deviceId)
          }
        }
        // For viewer, just join
        else {
          await client.join(APP_ID, CHANNEL_ID, TOKEN)
          if (cancelled) return
          setIsJoined(true)
        }

        setIsLoading(false)
      } catch (err) {
        if (cancelled) return
        const errorMsg = err instanceof Error ? err.message : 'Failed to initialize Agora'
        setError(errorMsg)
        onError?.(new Error(errorMsg))
        setIsLoading(false)
      }
    }

    initClient()

    return () => {
      cancelled = true
      // Cleanup on unmount
      if (audioTrackRef.current) {
        audioTrackRef.current.close()
        audioTrackRef.current = null
      }
      if (videoTrackRef.current) {
        videoTrackRef.current.close()
        videoTrackRef.current = null
      }
      if (clientRef.current) {
        clientRef.current.leave()
        clientRef.current = null
      }
    }
  }, [mode])

  // Toggle microphone
  const toggleMic = useCallback(async () => {
    if (!audioTrackRef.current) return

    try {
      if (isMicOn) {
        await audioTrackRef.current.setEnabled(false)
        setIsMicOn(false)
      } else {
        await audioTrackRef.current.setEnabled(true)
        setIsMicOn(true)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to toggle microphone'
      setError(errorMsg)
      onError?.(new Error(errorMsg))
    }
  }, [isMicOn, onError])

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (!videoTrackRef.current) return

    try {
      if (isCameraOn) {
        await videoTrackRef.current.setEnabled(false)
        setIsCameraOn(false)
      } else {
        await videoTrackRef.current.setEnabled(true)
        setIsCameraOn(true)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to toggle camera'
      setError(errorMsg)
      onError?.(new Error(errorMsg))
    }
  }, [isCameraOn, onError])

  // Switch camera (front/back)
  const switchCamera = useCallback(
    async (cameraId: string) => {
      if (!videoTrackRef.current) return

      try {
        await videoTrackRef.current.setDevice(cameraId)
        setCurrentCamera(cameraId)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to switch camera'
        setError(errorMsg)
        onError?.(new Error(errorMsg))
      }
    },
    [onError]
  )

  // Leave channel and cleanup
  const leave = useCallback(async () => {
    try {
      if (audioTrackRef.current) {
        audioTrackRef.current.close()
        audioTrackRef.current = null
      }

      if (videoTrackRef.current) {
        videoTrackRef.current.close()
        videoTrackRef.current = null
      }

      if (clientRef.current) {
        await clientRef.current.leave()
        clientRef.current = null
      }

      setIsJoined(false)
      setRemoteUsers([])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to leave channel'
      setError(errorMsg)
      onError?.(new Error(errorMsg))
    }
  }, [onError])

  return {
    client: clientRef.current,
    localVideoTrack: videoTrackRef.current,
    localAudioTrack: audioTrackRef.current,
    remoteUsers,
    isJoined,
    isLoading,
    isMicOn,
    isCameraOn,
    currentCamera,
    availableCameras,
    error,
    toggleMic,
    toggleCamera,
    switchCamera,
    leave,
  }
}
