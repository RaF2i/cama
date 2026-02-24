'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useAgoraRTC } from '@/hooks/useAgoraRTC'
import { VideoContainer } from '@/components/VideoContainer'
import { ControlPanel } from '@/components/ControlPanel'
import { ShareLink } from '@/components/ShareLink'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export default function BroadcastPage() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')

  const {
    client,
    localVideoTrack,
    localAudioTrack,
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
  } = useAgoraRTC({
    mode: 'broadcaster',
    onError: (err) => console.error('Agora Error:', err),
  })

  useEffect(() => {
    setIsClient(true)
    setBaseUrl(window.location.origin)
  }, [])

  const handleLeave = async () => {
    await leave()
    router.push('/')
  }

  if (!isClient) return null

  const viewerLink = `${baseUrl}/watch`

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Live Broadcasting</h1>
          {isJoined && (
            <Button onClick={handleLeave} variant="destructive">
              Stop Broadcasting
            </Button>
          )}
        </div>

        {/* Status Indicator */}
        <div className="mb-6">
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Initializing...</span>
            </div>
          )}
          {isJoined && !isLoading && (
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse" />
              <span>Live - Broadcasting to channel 123</span>
            </div>
          )}
          {error && !isLoading && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Feed - Left/Top */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border rounded-lg p-4">
              <h2 className="text-sm font-semibold mb-4">Your Camera Feed</h2>
              {localVideoTrack && isJoined ? (
                <VideoContainer videoTrack={localVideoTrack} remoteUsers={[]} isLocal={true} />
              ) : (
                <div className="w-full bg-muted rounded-lg flex items-center justify-center h-96">
                  <p className="text-muted-foreground text-center">
                    {isLoading ? 'Setting up your camera...' : 'Camera not ready'}
                  </p>
                </div>
              )}
            </div>

            {/* Media Controls */}
            {isJoined && (
              <ControlPanel
                isMicOn={isMicOn}
                isCameraOn={isCameraOn}
                currentCamera={currentCamera}
                availableCameras={availableCameras}
                onToggleMic={toggleMic}
                onToggleCamera={toggleCamera}
                onSwitchCamera={switchCamera}
                isLoading={isLoading}
              />
            )}
          </div>

          {/* Sidebar - Share Link */}
          <div className="space-y-4">
            {isJoined && (
              <>
                <ShareLink link={viewerLink} channelName="Stream" />

                {/* Info Card */}
                <div className="bg-card border rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold">Broadcasting Tips</h3>
                  <ul className="text-xs text-muted-foreground space-y-2">
                    <li>
                      <strong>Camera:</strong> Switch between front and back cameras using the dropdown
                    </li>
                    <li>
                      <strong>Mic:</strong> Toggle your microphone on/off with the button
                    </li>
                    <li>
                      <strong>Lighting:</strong> Make sure you have good lighting for better video quality
                    </li>
                    <li>
                      <strong>Network:</strong> Use a stable WiFi connection for best results
                    </li>
                  </ul>
                </div>

                {/* Tech Info */}
                <div className="bg-muted border rounded-lg p-4 space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground">Status</h3>
                  <div className="text-xs space-y-1 font-mono">
                    <p>
                      Channel: <span className="text-primary">123</span>
                    </p>
                    <p>
                      Video: <span className="text-primary">{isCameraOn ? 'On' : 'Off'}</span>
                    </p>
                    <p>
                      Audio: <span className="text-primary">{isMicOn ? 'On' : 'Off'}</span>
                    </p>
                  </div>
                </div>
              </>
            )}

            {!isJoined && !isLoading && error && (
              <Alert variant="destructive" className="lg:col-span-1">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Setup Required</p>
                  <p className="text-xs">Please make sure your .env.local file has NEXT_PUBLIC_AGORA_APP_ID set.</p>
                  <p className="text-xs mt-2">See AGORA_SETUP_GUIDE.md for instructions.</p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
