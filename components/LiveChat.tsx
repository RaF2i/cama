'use client'

import { useRef, useEffect, useState, KeyboardEvent } from 'react'
import { Send, MessageCircle, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { useAgoraRTM, type ChatMessage } from '@/hooks/useAgoraRTM'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export function LiveChat() {
  const { messages, sendMessage, isConnected, isConnecting, error, myDisplayName } = useAgoraRTM()
  const [inputValue, setInputValue] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || !isConnected) return
    const text = inputValue
    setInputValue('')
    await sendMessage(text)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-card border rounded-lg flex flex-col h-full min-h-80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm font-semibold">Live Chat</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {isConnecting ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Connecting…</span>
            </>
          ) : isConnected ? (
            <>
              <Wifi className="w-3 h-3 text-green-500" />
              <span className="text-green-600 dark:text-green-400">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-destructive" />
              <span className="text-destructive">Disconnected</span>
            </>
          )}
        </div>
      </div>

      {/* Display name badge */}
      {isConnected && (
        <div className="px-4 py-1.5 border-b bg-muted/40 shrink-0">
          <p className="text-[10px] text-muted-foreground">
            Chatting as <span className="font-semibold text-foreground">{myDisplayName}</span>
          </p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-b shrink-0">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full py-8">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              {isConnecting
                ? 'Joining chat…'
                : isConnected
                  ? 'No messages yet.\nBe the first to say something!'
                  : 'Chat unavailable'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-3 border-t flex items-center gap-2 shrink-0">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? 'Say something…' : 'Connecting to chat…'}
          disabled={!isConnected}
          className="text-sm h-8"
          maxLength={500}
          autoComplete="off"
        />
        <Button
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleSend}
          disabled={!isConnected || !inputValue.trim()}
          title="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={cn('flex flex-col gap-0.5', message.isOwn && 'items-end')}>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'text-[10px] font-semibold',
            message.isOwn ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {message.isOwn ? 'You' : message.displayName}
        </span>
        <span className="text-[10px] text-muted-foreground">{time}</span>
      </div>

      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-1.5 text-xs wrap-break-word leading-relaxed',
          message.isOwn
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted text-foreground rounded-tl-sm',
        )}
      >
        {message.text}
      </div>
    </div>
  )
}
