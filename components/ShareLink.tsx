'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ShareLinkProps {
  link: string
  channelName?: string
}

export function ShareLink({ link, channelName = 'Channel' }: ShareLinkProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  return (
    <div className="bg-card p-4 rounded-lg border space-y-3">
      <h3 className="text-sm font-semibold">Share Your Stream</h3>

      <div className="bg-muted p-3 rounded text-xs break-all font-mono">
        {link}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleCopy}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Link
            </>
          )}
        </Button>

        <Button
          onClick={() => {
            const subject = `Join my stream on ${channelName}`
            const body = `Watch my stream here: ${link}`
            window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
          }}
          size="sm"
          variant="outline"
        >
          Share via Email
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Share this link with anyone to let them watch your stream.
      </p>
    </div>
  )
}
