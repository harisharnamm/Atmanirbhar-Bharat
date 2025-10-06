"use client"

import { useEffect, useState } from 'react'

interface PledgeCountProps {
  lang: 'en' | 'hi'
}

export default function PledgeCount({ lang }: PledgeCountProps) {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPledgeCount() {
      try {
        const response = await fetch('/api/pledges/count')
        const data = await response.json()
        if (response.ok) {
          setCount(data.display)
        } else {
          console.error('Failed to fetch pledge count:', data.error)
          // Fallback to a default count if API fails
          setCount(3000)
        }
      } catch (error) {
        console.error('Error fetching pledge count:', error)
        // Fallback to a default count if API fails
        setCount(3000)
      } finally {
        setLoading(false)
      }
    }

    fetchPledgeCount()
  }, [])

  if (loading) {
    return (
      <div className="text-center mt-2 mb-4">
        <p className="text-sm text-muted-foreground animate-pulse">
          {lang === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}
        </p>
      </div>
    )
  }

  if (!count) return null

  const message = lang === 'hi'
    ? `${count.toLocaleString()} लोग पहले ही प्रतिज्ञा ले चुके हैं।`
    : `${count.toLocaleString()} people have already taken the pledge.`

  return (
    <div className="text-center mt-2 mb-4">
      <p className="text-sm font-medium text-primary">
        {message}
      </p>
    </div>
  )
}
