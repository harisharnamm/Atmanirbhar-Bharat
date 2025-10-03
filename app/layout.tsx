import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import 'regenerator-runtime/runtime'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Aatmanirbhar Bharat – Sankalp Pledge',
    template: '%s – Aatmanirbhar Bharat',
  },
  description:
    'Take the Sankalp for Aatmanirbhar Bharat. Fill details, read the pledge, add a selfie, and download your certificate.',
  applicationName: 'Aatmanirbhar Bharat Pledge',
  keywords: [
    'Aatmanirbhar Bharat',
    'Sankalp',
    'Pledge',
    'Certificate',
    'Vocal for Local',
    'Swadeshi',
  ],
  authors: [{ name: 'Aatmanirbhar Bharat' }],
  creator: 'Aatmanirbhar Bharat',
  publisher: 'Aatmanirbhar Bharat',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    title: 'Aatmanirbhar Bharat – Sankalp Pledge',
    description:
      'आत्मनिर्भर भारत — स्वदेशी संकल्प | आइए हम साथ मिलकर स्वदेशी का समर्थन करें। aatmanirbharbharatabhiyan.com पर जाएँ और अपना संकल्प लें।',
    siteName: 'Aatmanirbhar Bharat',
    images: [
      {
        url: 'https://res.cloudinary.com/dxtmchwif/image/upload/v1759514125/%E0%A4%B8%E0%A5%8D%E0%A4%B5%E0%A4%A6%E0%A5%87%E0%A4%B6%E0%A5%80_%E0%A4%B8%E0%A4%82%E0%A4%95%E0%A4%B2%E0%A5%8D%E0%A4%AA_%E0%A4%AA%E0%A4%A4%E0%A5%8D%E0%A4%B0.pdf-2_umnhkt.jpg',
        width: 1200,
        height: 630,
        alt: 'Aatmanirbhar Bharat',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aatmanirbhar Bharat – Sankalp Pledge',
    description:
      'आत्मनिर्भर भारत — स्वदेशी संकल्प | आइए हम साथ मिलकर स्वदेशी का समर्थन करें। aatmanirbharbharatabhiyan.com पर जाएँ और अपना संकल्प लें।',
    images: ['https://res.cloudinary.com/dxtmchwif/image/upload/v1759514125/%E0%A4%B8%E0%A5%8D%E0%A4%B5%E0%A4%A6%E0%A5%87%E0%A4%B6%E0%A5%80_%E0%A4%B8%E0%A4%82%E0%A4%95%E0%A4%B2%E0%A5%8D%E0%A4%AA_%E0%A4%AA%E0%A4%A4%E0%A5%8D%E0%A4%B0.pdf-2_umnhkt.jpg'],
    creator: '@aatmanirbhar',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'civic',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preload local fonts for Devanagari script support */}
        <link
          rel="preload"
          href="/fonts/NotoSansDevanagari-Regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/NotoSansDevanagari-Bold.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
