// Link tracking service for analytics collection

export interface TrackingData {
  trackingId: string
  pledgeId: string
  originalPledgeId?: string
  metadata?: Record<string, any>
  createdBy?: string
}

export interface ClickData {
  trackingId: string
  sessionId?: string
  userAgent?: string
  referrer?: string
  screenResolution?: string
  language?: string
  timezone?: string
}

export interface AnalyticsData {
  totalClicks: number
  uniqueVisitors: number
  conversions: number
  conversionRate: number
  clicksFromIndia: number
  clicksFromOther: number
  mobileClicks: number
  desktopClicks: number
  tabletClicks: number
  firstClick?: string
  lastClick?: string
  trends: Array<{ date: string; count: number }>
}

// Generate a tracking link for a pledge
export async function createTrackingLink(
  pledgeId: string, 
  originalPledgeId?: string, 
  metadata: Record<string, any> = {},
  createdBy?: string
): Promise<{ trackingId: string; trackingLink: string }> {
  try {
    const response = await fetch('/api/track-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pledgeId,
        originalPledgeId,
        metadata,
        createdBy
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create tracking link')
    }

    const data = await response.json()
    return {
      trackingId: data.trackingId,
      trackingLink: data.trackingLink
    }
  } catch (error) {
    console.error('Error creating tracking link:', error)
    throw error
  }
}

// Record a click on a tracking link
export async function recordClick(clickData: ClickData): Promise<{ success: boolean; pledgeId?: string; clickId?: string }> {
  try {
    const response = await fetch('/api/track-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clickData),
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error('primary-post-failed')
    }

    const data = await response.json()
    return { success: true, pledgeId: data.pledgeId, clickId: data.clickId }
  } catch (error) {
    // Try sendBeacon fallback
    try {
      if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
        const blob = new Blob([JSON.stringify(clickData)], { type: 'application/json' })
        const ok = (navigator as any).sendBeacon('/api/track-click', blob)
        if (ok) {
          // We cannot read response; proceed with redirect and let analytics catch up
          return { success: true }
        }
      }
    } catch (_) {}

    // Last attempt: small retry with fetch
    try {
      const retry = await fetch('/api/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clickData),
        cache: 'no-store'
      })
      if (retry.ok) {
        const data = await retry.json()
        return { success: true, pledgeId: data.pledgeId, clickId: data.clickId }
      }
    } catch (_) {}

    console.error('Error recording click:', error)
    return { success: false }
  }
}

// Get analytics data
export async function getAnalytics(
  pledgeId?: string,
  trackingId?: string,
  timeframe: string = '7d',
  includeDetails: boolean = false
): Promise<AnalyticsData | null> {
  try {
    const params = new URLSearchParams()
    if (pledgeId) params.append('pledgeId', pledgeId)
    if (trackingId) params.append('trackingId', trackingId)
    params.append('timeframe', timeframe)
    if (includeDetails) params.append('includeDetails', 'true')

    const response = await fetch(`/api/analytics?${params.toString()}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch analytics')
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return null
  }
}

// Generate a session ID for tracking user sessions
export function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
}

// Get client-side tracking data
export function getClientTrackingData(): Partial<ClickData> {
  if (typeof window === 'undefined') return {}

  return {
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    screenResolution: `${screen.width}x${screen.height}`,
    language: navigator.language,
    timezone: 'Asia/Kolkata' // Force Indian timezone for consistency
  }
}

// Track a click and redirect to the main app
export async function trackAndRedirect(trackingId: string, baseUrl: string = '/') {
  try {
    // Get session ID from localStorage or generate new one
    let sessionId = localStorage.getItem('tracking_session_id')
    if (!sessionId) {
      sessionId = generateSessionId()
      localStorage.setItem('tracking_session_id', sessionId)
    }

    // Persist last tracking id for conversion attribution
    try { localStorage.setItem('last_tracking_id', trackingId) } catch (_) {}

    // Get client tracking data
    const clientData = getClientTrackingData()

    // Record the click
    const result = await recordClick({
      trackingId,
      sessionId,
      ...clientData
    })

    if (result.success && result.pledgeId) {
      // Redirect to main app with pledge ID
      const redirectUrl = new URL(baseUrl, window.location.origin)
      redirectUrl.searchParams.set('pledge', result.pledgeId)
      window.location.href = redirectUrl.toString()
    } else {
      // Fallback redirect
      window.location.href = baseUrl
    }
  } catch (error) {
    console.error('Error in trackAndRedirect:', error)
    // Fallback redirect
    window.location.href = baseUrl
  }
}

// Mark latest click for this session/tracking as converted
export async function markConversion(pledgeId: string) {
  try {
    if (typeof window === 'undefined') {
      console.log('[markConversion] Running on server side, skipping')
      return
    }
    
    const sessionId = localStorage.getItem('tracking_session_id') || undefined
    const trackingId = localStorage.getItem('last_tracking_id') || undefined
    
    console.log('[markConversion] Attempting to mark conversion:', {
      pledgeId,
      sessionId,
      trackingId,
      hasSessionId: !!sessionId,
      hasTrackingId: !!trackingId
    })
    
    if (!sessionId && !trackingId) {
      console.log('[markConversion] No session ID or tracking ID found, skipping conversion tracking')
      return
    }

    const response = await fetch('/api/track-conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, trackingId, pledgeId })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('[markConversion] Conversion marked successfully:', result)
    } else {
      const errorData = await response.json().catch(() => ({}))
      console.error('[markConversion] API error:', response.status, errorData)
    }
  } catch (e) {
    console.error('[markConversion] Failed to mark conversion:', e)
  }
}

// Utility to check if a URL is a tracking link
export function isTrackingLink(url: string): boolean {
  return url.includes('/track/')
}

// Extract tracking ID from URL
export function extractTrackingId(url: string): string | null {
  const match = url.match(/\/track\/([a-zA-Z0-9-]+)/)
  return match ? match[1] : null
}

// Create a trackable share URL
export function createTrackableUrl(pledgeId: string, baseUrl: string = '/'): string {
  return `${window.location.origin}/track/${pledgeId}`
}
