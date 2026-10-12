import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { AppApolloProvider } from '@/providers/apollo-provider'
import { AuthSyncProvider } from '@/providers/auth-sync-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin']
})

// Headings and match-score numerals read through font-display instead of Inter —
// Space Grotesk's tabular numerals treat the score as a measured readout, not a badge.
const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Angkop',
  description: 'Hybrid semantic job matching for Filipino job seekers'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className='min-h-full flex flex-col'>
        <AuthSyncProvider>
          <AppApolloProvider>{children}</AppApolloProvider>
        </AuthSyncProvider>
        <Toaster />
      </body>
    </html>
  )
}
