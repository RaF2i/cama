'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2, Radio } from 'lucide-react'
import { useAgoraRTC } from '@/hooks/useAgoraRTC'
import { VideoContainer } from '@/components/VideoContainer'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function WatchPage() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  const {
    remoteUsers,
    viewerCount,
    isJoined,
    isLoading,
    error,
    leave,
    viewerStreamQuality,
    setViewerStreamQuality,
  } = useAgoraRTC({
    mode: 'viewer',
    onError: (err) => console.error('Agora Error:', err),
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleLeave = async () => {
    await leave()
    router.push('/')
  }

  if (!isClient) return null

  const isBroadcasterOnline = remoteUsers.length > 0

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Watch Live Stream</h1>
          {isJoined && (
            <Button onClick={handleLeave} variant="outline">
              Leave Stream
            </Button>
          )}
        </div>

        {/* Status Indicator */}
        <div className="mb-6">
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Connecting to stream...</span>
            </div>
          )}
          {isJoined && !isLoading && (
            <div className="flex items-center gap-4">
              {isBroadcasterOnline ? (
                <>
                  <div className="flex items-center gap-2 text-green-600">
                    <Radio className="w-5 h-5 animate-pulse" />
                    <span>Broadcaster is live</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                      <span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />
                      {viewerCount + 1} watching
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-yellow-600">
                  <div className="w-3 h-3 bg-yellow-600 rounded-full animate-pulse" />
                  <span>Waiting for broadcaster...</span>
                </div>
              )}
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Channel 123</h2>
              {isJoined && isBroadcasterOnline && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Quality</label>
                  <Select
                    value={viewerStreamQuality}
                    onValueChange={(v) => setViewerStreamQuality(v as 'high' | 'low')}
                  >
                    <SelectTrigger className="h-7 text-xs w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High quality</SelectItem>
                      <SelectItem value="low">Low quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {isJoined ? (
              <VideoContainer videoTrack={null} remoteUsers={remoteUsers} isLocal={false} />
            ) : (
              <div className="w-full bg-muted rounded-lg flex items-center justify-center h-96">
                <p className="text-muted-foreground text-center">
                  {isLoading ? 'Connecting...' : 'Not connected'}
                </p>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="grid md:grid-cols-2 gap-4 mt-8">
            {/* Stream Info */}
            <div className="bg-card border rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold">Stream Information</h3>
              <div className="text-xs text-muted-foreground space-y-2">
                <p>
                  <strong>Channel:</strong> 123
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span className={isBroadcasterOnline ? 'text-green-600' : 'text-yellow-600'}>
                    {isBroadcasterOnline ? 'Live' : 'Waiting'}
                  </span>
                </p>
                <p>
                  <strong>Viewers:</strong>{' '}
                  <span className="text-primary">
                    {viewerCount + 1} watching
                  </span>
                </p>
              </div>
            </div>

            {/* Viewing Tips */}
            <div className="bg-card border rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold">Viewing Tips</h3>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li>• Full-screen mode available on desktop</li>
                <li>• Stable internet recommended for smooth playback</li>
                <li>• If no video appears, check if broadcaster is online</li>
                <li>• Refresh the page if you encounter any issues</li>
              </ul>
            </div>
          </div>

          {/* Setup Required Info */}
          {!isJoined && !isLoading && error && (
            <Alert variant="destructive" className="mt-8">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">Setup Required</p>
                <p className="text-sm">Please make sure your .env.local file has NEXT_PUBLIC_AGORA_APP_ID set.</p>
                <p className="text-sm mt-2">See AGORA_SETUP_GUIDE.md for instructions.</p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </main>
  )
}
