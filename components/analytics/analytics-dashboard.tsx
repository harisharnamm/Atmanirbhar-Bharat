"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { getAnalytics, type AnalyticsData } from '@/lib/tracking'
import { Loader2, TrendingUp, Users, MousePointer, Globe, Smartphone, Monitor, Tablet } from 'lucide-react'

interface AnalyticsDashboardProps {
  pledgeId?: string
  trackingId?: string
}

export default function AnalyticsDashboard({ pledgeId, trackingId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('7d')
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await getAnalytics(pledgeId, trackingId, timeframe, true)
      setAnalytics(data)
    } catch (err) {
      setError('Failed to load analytics data')
      console.error('Analytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [pledgeId, trackingId, timeframe])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchAnalytics}>Retry</Button>
      </div>
    )
  }

  // Handle different data structures from API
  let analyticsArray = []
  if (analytics) {
    console.log('Analytics data structure:', analytics)
    if (Array.isArray(analytics.analytics)) {
      analyticsArray = analytics.analytics
    } else if (Array.isArray(analytics)) {
      analyticsArray = analytics
    }
  }

  if (analyticsArray.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No analytics data available</p>
        <p className="text-sm text-gray-500 mt-2">
          Try completing a pledge and clicking the tracking link to generate data.
        </p>
      </div>
    )
  }

  // Get the first analytics record (or aggregate if multiple)
  const rawAnalytics = analyticsArray[0] || {}
  const analyticsData = {
    totalClicks: Number((rawAnalytics as any).total_clicks ?? (rawAnalytics as any).totalClicks ?? 0),
    uniqueVisitors: Number((rawAnalytics as any).unique_visitors ?? (rawAnalytics as any).uniqueVisitors ?? 0),
    conversions: Number((rawAnalytics as any).conversions ?? 0),
    conversionRate: Number((rawAnalytics as any).conversion_rate ?? (rawAnalytics as any).conversionRate ?? 0),
    clicksFromIndia: Number((rawAnalytics as any).clicks_from_india ?? (rawAnalytics as any).clicksFromIndia ?? 0),
    clicksFromOther: Number((rawAnalytics as any).clicks_from_other ?? (rawAnalytics as any).clicksFromOther ?? 0),
    mobileClicks: Number((rawAnalytics as any).mobile_clicks ?? (rawAnalytics as any).mobileClicks ?? 0),
    desktopClicks: Number((rawAnalytics as any).desktop_clicks ?? (rawAnalytics as any).desktopClicks ?? 0),
    tabletClicks: Number((rawAnalytics as any).tablet_clicks ?? (rawAnalytics as any).tabletClicks ?? 0),
    firstClick: (rawAnalytics as any).first_click ?? (rawAnalytics as any).firstClick ?? null,
    lastClick: (rawAnalytics as any).last_click ?? (rawAnalytics as any).lastClick ?? null,
  }

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return '0'
    return new Intl.NumberFormat().format(num)
  }

  const formatPercentage = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return '0.0%'
    return `${num.toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Link Analytics</h2>
          <p className="text-gray-600">Track your pledge sharing performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.totalClicks)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(analyticsData.uniqueVisitors)} unique visitors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.conversions)}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(analyticsData.conversionRate)} conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">From India</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.clicksFromIndia)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(analyticsData.clicksFromOther)} from other countries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mobile Clicks</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.mobileClicks)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(analyticsData.desktopClicks)} desktop, {formatNumber(analyticsData.tabletClicks)} tablet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Device Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Device Breakdown</CardTitle>
          <CardDescription>Click distribution by device type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span>Mobile</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${analyticsData.totalClicks > 0 ? (analyticsData.mobileClicks / analyticsData.totalClicks) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-medium">{formatNumber(analyticsData.mobileClicks)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <span>Desktop</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: `${analyticsData.totalClicks > 0 ? (analyticsData.desktopClicks / analyticsData.totalClicks) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-medium">{formatNumber(analyticsData.desktopClicks)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tablet className="h-4 w-4" />
                <span>Tablet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ 
                      width: `${analyticsData.totalClicks > 0 ? (analyticsData.tabletClicks / analyticsData.totalClicks) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-medium">{formatNumber(analyticsData.tabletClicks)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Click Trends */}
      {analytics.trends && analytics.trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Click Trends</CardTitle>
            <CardDescription>Click activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.trends.slice(-10).map((trend, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {new Date(trend.date).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.max(10, (trend.count / Math.max(...analytics.trends.map(t => t.count))) * 100)}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{trend.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Performance</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>First click:</span>
                  <span>{analyticsData.firstClick ? new Date(analyticsData.firstClick).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last click:</span>
                  <span>{analyticsData.lastClick ? new Date(analyticsData.lastClick).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Conversion rate:</span>
                  <Badge variant={(analyticsData.conversionRate || 0) > 5 ? "default" : "secondary"}>
                    {formatPercentage(analyticsData.conversionRate)}
                  </Badge>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Geographic</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>India clicks:</span>
                  <span>{formatNumber(analyticsData.clicksFromIndia)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other countries:</span>
                  <span>{formatNumber(analyticsData.clicksFromOther)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total unique visitors:</span>
                  <span>{formatNumber(analyticsData.uniqueVisitors)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
