'use client'

import Link from 'next/link'
import { Video, Eye, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-12 md:py-24">
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Live Video Streaming
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Stream directly from your mobile camera to viewers anywhere in the world. 
            Simple, fast, and powered by Agora.io.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Mobile Streaming</h3>
            <p className="text-sm text-muted-foreground">
              Use your mobile camera (front or back) to broadcast live to your viewers.
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <Eye className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Easy Sharing</h3>
            <p className="text-sm text-muted-foreground">
              Share a simple link with viewers. No account creation or downloads needed.
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Low Latency</h3>
            <p className="text-sm text-muted-foreground">
              Real-time streaming with minimal delay for an interactive experience.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-2xl mx-auto bg-card border rounded-lg p-8 md:p-12 space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            Get Started Now
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/broadcast" className="w-full">
              <Button size="lg" className="w-full">
                <Video className="w-4 h-4 mr-2" />
                Start Broadcasting
              </Button>
            </Link>

            <Link href="/watch" className="w-full">
              <Button size="lg" variant="outline" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                Watch Stream
              </Button>
            </Link>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>For Testing:</strong> This app is configured with a hardcoded channel (ID: 123).
            </p>
            <p>
              To set up your Agora.io credentials, see{' '}
              <code className="bg-muted px-2 py-1 rounded">AGORA_SETUP_GUIDE.md</code>.
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="max-w-2xl mx-auto mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            Powered by{' '}
            <a
              href="https://www.agora.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Agora.io
            </a>
            {' '}| For development and testing purposes
          </p>
        </div>
      </div>
    </main>
  )
}
