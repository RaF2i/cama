'use client'

import { Mic, MicOff, Video, VideoOff, Smartphone, Gauge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type VideoQuality, VIDEO_QUALITY_PRESETS } from '@/hooks/useAgoraRTC'

interface ControlPanelProps {
  isMicOn: boolean
  isCameraOn: boolean
  currentCamera: string
  availableCameras: MediaDeviceInfo[]
  videoQuality: VideoQuality
  onToggleMic: () => Promise<void>
  onToggleCamera: () => Promise<void>
  onSwitchCamera: (cameraId: string) => Promise<void>
  onSetVideoQuality: (quality: VideoQuality) => Promise<void>
  isLoading?: boolean
}

export function ControlPanel({
  isMicOn,
  isCameraOn,
  currentCamera,
  availableCameras,
  videoQuality,
  onToggleMic,
  onToggleCamera,
  onSwitchCamera,
  onSetVideoQuality,
  isLoading = false,
}: ControlPanelProps) {
  return (
    <div className="flex flex-col gap-4 bg-card p-4 rounded-lg border">
      <h3 className="text-sm font-semibold">Media Controls</h3>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={isMicOn ? 'default' : 'destructive'}
          size="sm"
          onClick={onToggleMic}
          disabled={isLoading}
          className="gap-2"
        >
          {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          {isMicOn ? 'Mic On' : 'Mic Off'}
        </Button>

        <Button
          variant={isCameraOn ? 'default' : 'destructive'}
          size="sm"
          onClick={onToggleCamera}
          disabled={isLoading}
          className="gap-2"
        >
          {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          {isCameraOn ? 'Camera On' : 'Camera Off'}
        </Button>
      </div>

      {availableCameras.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium">Camera</label>
          <Select value={currentCamera} onValueChange={onSwitchCamera}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select camera" />
            </SelectTrigger>
            <SelectContent>
              {availableCameras.map((camera) => (
                <SelectItem key={camera.deviceId} value={camera.deviceId}>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    {camera.label || `Camera ${camera.deviceId.slice(0, 5)}`}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-medium flex items-center gap-1">
          <Gauge className="w-3 h-3" />
          Video Quality
        </label>
        <Select value={videoQuality} onValueChange={(v) => onSetVideoQuality(v as VideoQuality)} disabled={isLoading}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select quality" />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(VIDEO_QUALITY_PRESETS) as [VideoQuality, typeof VIDEO_QUALITY_PRESETS[VideoQuality]][]).map(
              ([key, preset]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center justify-between gap-4 w-full">
                    <span>{preset.label}</span>
                    <span className="text-xs text-muted-foreground">{preset.frameRate}fps</span>
                  </div>
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
