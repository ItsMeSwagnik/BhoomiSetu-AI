import Script from 'next/script'
import { DM_Sans, Source_Serif_4 } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const sourceSerif = Source_Serif_4({ subsets: ['latin'], variable: '--font-source-serif' })

export const metadata: Metadata = {
  title: 'BhoomiSetu AI — Trust the record',
  description: 'AI-powered land record intelligence for accountable digital public service.',
  icons: { icon: '/icon.svg' },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${dmSans.variable} ${sourceSerif.variable} antialiased`}>
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function(){
            try {
              var saved = localStorage.getItem('bhoomisetu-theme');
              var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              var isDark = saved === 'dark' || (!saved && prefersDark);
              document.documentElement.classList.toggle('dark', isDark);
            } catch(e) {}
          })();
        `}</Script>
        {children}
      </body>
    </html>
  )
}
