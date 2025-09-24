import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
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
      'Take the Sankalp for Aatmanirbhar Bharat and receive your Sankalp Patra.',
    siteName: 'Aatmanirbhar Bharat',
    images: [
      {
        url: '/atmanirbharBharat.png',
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
      'Take the Sankalp for Aatmanirbhar Bharat and receive your personalized certificate.',
    images: ['/atmanirbharBharat.png'],
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
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
