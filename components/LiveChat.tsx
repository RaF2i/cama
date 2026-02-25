'use client'

import { useRef, useEffect, useState, KeyboardEvent } from 'react'
import {
  Send,
  MessageCircle,
  Wifi,
  WifiOff,
  Loader2,
  Key,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  LogOut,
} from 'lucide-react'
import { useAgoraRTM, type ChatMessage } from '@/hooks/useAgoraRTM'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// ─── helpers ────────────────────────────────────────────────────────────────

const ENV_TOKEN = process.env.NEXT_PUBLIC_AGORA_RTM_TOKEN || ''

// ─── component ──────────────────────────────────────────────────────────────

export function LiveChat() {
  // 'setup' → user hasn't connected yet; 'chat' → connected (or connecting)
  const [mode, setMode] = useState<'setup' | 'chat'>('setup')
  const [tokenInput, setTokenInput] = useState<string>(ENV_TOKEN)
  const [activeToken, setActiveToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [tokenVisible, setTokenVisible] = useState(false)

  const { messages, sendMessage, isConnected, isConnecting, error, myDisplayName, disconnect } =
    useAgoraRTM(mode === 'chat' ? activeToken : null)

  const [inputValue, setInputValue] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleConnect = () => {
    setActiveToken(tokenInput.trim() || null)
    setMode('chat')
  }

  const handleDisconnect = async () => {
    await disconnect()
    setMode('setup')
    setActiveToken(null)
  }

  const handleCopy = async () => {
    if (!tokenInput) return
    await navigator.clipboard.writeText(tokenInput)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm font-semibold">Live Chat</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {mode === 'setup' ? (
            <>
              <Key className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Token setup</span>
            </>
          ) : isConnecting ? (
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

      {/* ── Token Setup Panel ── */}
      {mode === 'setup' && (
        <div className="px-4 py-4 flex flex-col gap-3 border-b">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              RTM Token
            </p>
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              test only
            </span>
          </div>

          {/* Token input row */}
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Input
                type={tokenVisible ? 'text' : 'password'}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste token or generate one…"
                className="text-xs h-8 pr-16 font-mono"
              />
              <button
                onClick={() => setTokenVisible((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground hover:text-foreground"
              >
                {tokenVisible ? 'hide' : 'show'}
              </button>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleCopy}
              disabled={!tokenInput}
              title="Copy token"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>

          {/* Token display box */}
          {tokenInput && (
            <div className="rounded-md bg-muted/60 border px-3 py-2">
              <p className="text-[10px] text-muted-foreground mb-1">Active token</p>
              <p className="text-[11px] font-mono break-all leading-relaxed text-foreground/80 select-all">
                {tokenInput}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 flex-1 text-xs"
              onClick={handleConnect}
            >
              Connect to Chat
            </Button>
            {tokenInput && (
              <button
                className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2"
                onClick={() => { setTokenInput(''); setActiveToken(null) }}
              >
                Clear
              </button>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Leave blank if your Agora app has token auth <span className="font-medium text-foreground">disabled</span>.
            Otherwise paste a real RTM token generated by your token server.
          </p>
        </div>
      )}

      {/* ── Chat mode ── */}
      {mode === 'chat' && (
        <>
          {/* Collapsible token info bar */}
          <TokenBar token={activeToken} onDisconnect={handleDisconnect} />

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
        </>
      )}
    </div>
  )
}

// ─── TokenBar ───────────────────────────────────────────────────────────────

function TokenBar({ token, onDisconnect }: { token: string | null; onDisconnect: () => void }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!token) return
    await navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border-b shrink-0">
      <button
        className="w-full flex items-center justify-between px-4 py-1.5 text-[10px] text-muted-foreground hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-1.5">
          <Key className="w-3 h-3" />
          {token ? 'Token active' : 'No token (test mode)'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onDisconnect() }}
            className="flex items-center gap-1 text-destructive hover:text-destructive/80"
            title="Disconnect and change token"
          >
            <LogOut className="w-3 h-3" />
            <span>Disconnect</span>
          </button>
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-3 bg-muted/30 flex flex-col gap-2">
          <div className="rounded-md bg-muted border px-3 py-2 flex items-start justify-between gap-2">
            <p className="text-[11px] font-mono break-all leading-relaxed text-foreground/70 select-all flex-1">
              {token ?? <span className="italic text-muted-foreground">null — token auth disabled</span>}
            </p>
            {token && (
              <button onClick={handleCopy} className="shrink-0 mt-0.5" title="Copy token">
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MessageBubble ───────────────────────────────────────────────────────────

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
