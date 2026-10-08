import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AppApolloProvider } from '@/providers/apollo-provider'
import { AuthSyncProvider } from '@/providers/auth-sync-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Angkop',
  description: 'Hybrid semantic job matching for Filipino job seekers'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className={`${inter.variable} h-full antialiased`}>
      <body className='min-h-full flex flex-col'>
        <AuthSyncProvider>
          <AppApolloProvider>{children}</AppApolloProvider>
        </AuthSyncProvider>
        <Toaster />
      </body>
    </html>
  )
}
