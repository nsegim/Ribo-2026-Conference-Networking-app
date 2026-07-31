import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './theme.css'
import BootstrapClient from './BootstrapClient'

// This is a Next.js "multiple root layouts" setup: (app) and the sibling (payload) route group
// each own a full <html>/<body> — there is deliberately no shared top-level src/app/layout.tsx.
// Payload's own RootLayout (used in (payload)/layout.tsx) renders its own <html>/<body>
// internally; a shared outer root layout would have nested a second <html> inside it, which is
// invalid HTML and was causing a hydration mismatch (React discarding and fully re-rendering the
// admin panel client-side on every load — the actual cause of the "sluggish, needs a refresh"
// symptom). See https://nextjs.org/docs -> Route Groups -> "Defining multiple root layouts".
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RIBO2026 Conference',
  description: 'RIBO2026 Conference Networking',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <BootstrapClient />
        {children}
      </body>
    </html>
  )
}
