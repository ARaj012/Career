import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import AppChrome from '@/components/AppChrome'
import { BRAND_NAME, BRAND_TAGLINE, SITE_URL } from '@/lib/brand'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const HOME_TITLE = `${BRAND_NAME} — ${BRAND_TAGLINE}`
const HOME_DESCRIPTION = `${BRAND_NAME} helps Indian students choose careers, colleges, entrance exams and scholarships with official data, and get personalised career recommendations.`

export const metadata: Metadata = {
  // Relative URLs in page metadata (canonical, Open Graph) resolve against the site address
  metadataBase: new URL(SITE_URL),
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  keywords: 'career guidance, career counseling, career options, colleges, entrance exams, scholarships, AI career recommendations, Indian students',
  authors: [{ name: BRAND_NAME }],
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    siteName: BRAND_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col antialiased`}>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  )
}
