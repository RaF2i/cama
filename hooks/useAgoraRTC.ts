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

export type VideoQuality = 'low' | 'medium' | 'high' | 'hd'
export type ViewerStreamQuality = 'high' | 'low'

export const VIDEO_QUALITY_PRESETS: Record<VideoQuality, { label: string; width: number; height: number; frameRate: number; bitrateMax: number }> = {
  low:    { label: '360p',  width: 640,  height: 360,  frameRate: 15, bitrateMax: 400  },
  medium: { label: '480p',  width: 854,  height: 480,  frameRate: 15, bitrateMax: 700  },
  high:   { label: '720p',  width: 1280, height: 720,  frameRate: 30, bitrateMax: 1500 },
  hd:     { label: '1080p', width: 1920, height: 1080, frameRate: 30, bitrateMax: 3000 },
}

export interface UseAgoraRTCProps {
  mode: 'broadcaster' | 'viewer'
  onError?: (error: Error) => void
}

export interface UseAgoraRTCReturn {
  client: IAgoraRTCClient | null
  localVideoTrack: ICameraVideoTrack | null
  localAudioTrack: IMicrophoneAudioTrack | null
  remoteUsers: IAgoraRTCRemoteUser[]
  viewerCount: number
  isJoined: boolean
  isLoading: boolean
  isMicOn: boolean
  isCameraOn: boolean
  currentCamera: string
  availableCameras: MediaDeviceInfo[]
  videoQuality: VideoQuality
  viewerStreamQuality: ViewerStreamQuality
  error: string | null
  toggleMic: () => Promise<void>
  toggleCamera: () => Promise<void>
  switchCamera: (cameraId: string) => Promise<void>
  setVideoQuality: (quality: VideoQuality) => Promise<void>
  setViewerStreamQuality: (quality: ViewerStreamQuality) => Promise<void>
  leave: () => Promise<void>
}

export function useAgoraRTC(props: UseAgoraRTCProps): UseAgoraRTCReturn {
  const { mode, onError } = props

  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null)
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null)

  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([])
  const [viewerCount, setViewerCount] = useState(0)
  const [isJoined, setIsJoined] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [currentCamera, setCurrentCamera] = useState<string>('')
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [videoQuality, setVideoQualityState] = useState<VideoQuality>('high')
  const [viewerStreamQuality, setViewerStreamQualityState] = useState<ViewerStreamQuality>('high')
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

        client.on('user-joined', () => {
          setViewerCount((prev) => prev + 1)
        })

        client.on('user-left', (user) => {
          setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid))
          setViewerCount((prev) => Math.max(0, prev - 1))
        })

        clientRef.current = client

        // For broadcaster, join and publish
        if (mode === 'broadcaster') {
          await client.join(APP_ID, CHANNEL_ID, TOKEN)
          if (cancelled) return
          setIsJoined(true)
          // Initialize count with users already in channel
          setViewerCount(client.remoteUsers.length)

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

          // Enable dual-stream so viewers can switch between high/low quality
          await client.enableDualStream()

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
          // Initialize count with users already in channel
          setViewerCount(client.remoteUsers.length)
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

  // Set viewer stream quality (high = full stream, low = low-res dual stream)
  const setViewerStreamQuality = useCallback(
    async (quality: ViewerStreamQuality) => {
      if (!clientRef.current) return
      try {
        const streamType = quality === 'high' ? 0 : 1
        for (const user of clientRef.current.remoteUsers) {
          await clientRef.current.setRemoteVideoStreamType(user.uid, streamType)
        }
        setViewerStreamQualityState(quality)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to set stream quality'
        setError(errorMsg)
        onError?.(new Error(errorMsg))
      }
    },
    [onError]
  )

  // Set video encoder quality
  const setVideoQuality = useCallback(
    async (quality: VideoQuality) => {
      if (!videoTrackRef.current) return
      try {
        const preset = VIDEO_QUALITY_PRESETS[quality]
        await videoTrackRef.current.setEncoderConfiguration({
          width: preset.width,
          height: preset.height,
          frameRate: preset.frameRate,
          bitrateMax: preset.bitrateMax,
        })
        setVideoQualityState(quality)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to set video quality'
        setError(errorMsg)
        onError?.(new Error(errorMsg))
      }
    },
    [onError]
  )

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
    viewerCount,
    isJoined,
    isLoading,
    videoQuality,
    setVideoQuality,
    viewerStreamQuality,
    setViewerStreamQuality,
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
