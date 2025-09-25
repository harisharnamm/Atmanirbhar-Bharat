"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { trackAndRedirect } from '@/lib/tracking'

export const dynamic = 'force-dynamic'

export default function TrackingRedirectPage() {
  const params = useParams()
  const trackingId = params.trackingId as string
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!trackingId) {
      setError('Invalid tracking link')
      setStatus('error')
      return
    }

    // Track the click and redirect
    const handleTracking = async () => {
      try {
        setStatus('redirecting')
        await trackAndRedirect(trackingId)
      } catch (err) {
        console.error('Tracking error:', err)
        setError('Failed to process tracking link')
        setStatus('error')
      }
    }

    // Small delay to show loading state
    const timer = setTimeout(handleTracking, 500)
    return () => clearTimeout(timer)
  }, [trackingId])

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Link Error
          </h1>
          <p className="text-gray-600 mb-4">
            {error || 'This tracking link is invalid or has expired.'}
          </p>
          <a 
            href="/" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Home Page
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="mb-4">
          {status === 'loading' ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          ) : (
            <div className="animate-pulse">
              <svg className="mx-auto h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          )}
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          {status === 'loading' ? 'Processing...' : 'Redirecting...'}
        </h1>
        <p className="text-gray-600">
          {status === 'loading' 
            ? 'Please wait while we process your request.' 
            : 'Taking you to the pledge page...'
          }
        </p>
        <div className="mt-4 text-sm text-gray-500">
          Tracking ID: {trackingId}
        </div>
      </div>
    </div>
  )
}
