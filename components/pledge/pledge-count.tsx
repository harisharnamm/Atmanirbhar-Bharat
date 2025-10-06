"use client"

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface PledgeCountProps {
  lang: 'en' | 'hi'
}

export default function PledgeCount({ lang }: PledgeCountProps) {
  const [displayCount, setDisplayCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [usingRealtime, setUsingRealtime] = useState(true)

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    let channel: any = null

    async function fetchPledgeCount() {
      try {
        // Query Supabase directly from client for the latest count
        const { count, error } = await supabase
          .from('pledges')
          .select('pledge_id', { count: 'exact', head: true })

        if (error) {
          console.error('[pledge-count] Supabase count error:', error)
          setDisplayCount(13000)
        } else {
          const display = (count || 0) + 13000
          setDisplayCount(display)
        }
      } catch (error) {
        console.error('[pledge-count] Client supabase error:', error)
        setDisplayCount(13000)
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchPledgeCount()

    // Always keep a steady polling safety net (every 10s)
    intervalId = setInterval(fetchPledgeCount, 10000)

    // Real-time subscription: listen to all changes and refetch authoritative count
    channel = supabase
      .channel('pledge-count-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pledges'
        },
        () => {
          fetchPledgeCount()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setUsingRealtime(true)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setUsingRealtime(false)
        }
      })

    // Cleanup function
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
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

  if (!displayCount) return null

  const formattedCount = displayCount.toLocaleString()
  const message = lang === 'hi'
    ? <> <span className="text-red-600 font-bold">{formattedCount}</span> लोग पहले ही प्रतिज्ञा ले चुके हैं।</>
    : <> <span className="text-red-600 font-bold">{formattedCount}</span> people have already taken the pledge.</>

  return (
    <div className="text-center mt-2 mb-4">
      <p className="text-sm font-medium text-primary">
        {message}
      </p>
    </div>
  )
}
