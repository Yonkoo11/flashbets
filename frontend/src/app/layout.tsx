import type { Metadata } from 'next'
import { Anton, Roboto_Mono } from 'next/font/google'
import dynamic from 'next/dynamic'
import './globals.css'
import { Navigation } from '@/components/navigation/Navigation'
import { AmbientBackground } from '@/components/AmbientBackground'

// WalletConnect uses indexedDB which doesn't exist on the server — load client-only
const Providers = dynamic(() => import('./providers').then(m => m.Providers), { ssr: false })

const anton = Anton({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400']
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700']
})

export const metadata: Metadata = {
  title: 'FlashBets — 60-Second Crypto Predictions',
  description: 'Predict. 60 Seconds. Win. Ultra-fast BTC prediction market on Base.',
  keywords: ['crypto', 'prediction', 'bitcoin', 'btc', 'base', 'blockchain', 'defi'],
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${anton.variable} ${robotoMono.variable}`}>
      <body className="bg-background text-text-primary min-h-screen antialiased">
        <Providers>
          <AmbientBackground />
          <div className="ambient-grid" />
          <div className="ambient-vignette" />
          <div className="relative z-10">
            <Navigation />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
