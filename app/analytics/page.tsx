"use client"

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AnalyticsDashboard from '@/components/analytics/analytics-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

// Simple password protection
const ANALYTICS_PASSWORD = process.env.NEXT_PUBLIC_ANALYTICS_PASSWORD || 'admin123'

function AnalyticsContent() {
  const searchParams = useSearchParams()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [pledgeId, setPledgeId] = useState(searchParams.get('pledgeId') || '')
  const [trackingId, setTrackingId] = useState(searchParams.get('trackingId') || '')
  const [showDashboard, setShowDashboard] = useState(false)

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ANALYTICS_PASSWORD) {
      setIsAuthenticated(true)
      setPasswordError('')
    } else {
      setPasswordError('Incorrect password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setPassword('')
    setPasswordError('')
    setShowDashboard(false)
  }

  const handleViewAnalytics = () => {
    if (pledgeId || trackingId) {
      setShowDashboard(true)
    }
  }

  // Show password form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Access</CardTitle>
              <CardDescription>
                Enter the password to access analytics dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                  />
                  {passwordError && (
                    <p className="text-sm text-red-600 mt-1">{passwordError}</p>
                  )}
                </div>
                <Button type="submit" className="w-full">
                  Access Analytics
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Logout button */}
        <div className="mb-4 flex justify-end">
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        
        {!showDashboard ? (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>View Analytics</CardTitle>
                <CardDescription>
                  Enter a pledge ID or tracking ID to view analytics data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pledgeId">Pledge ID (optional)</Label>
                  <Input
                    id="pledgeId"
                    value={pledgeId}
                    onChange={(e) => setPledgeId(e.target.value)}
                    placeholder="AANIRBHA-2024-XXXXXX-X"
                  />
                </div>
                <div>
                  <Label htmlFor="trackingId">Tracking ID (optional)</Label>
                  <Input
                    id="trackingId"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    placeholder="TRK-XXXXXX"
                  />
                </div>
                <Button 
                  onClick={handleViewAnalytics}
                  disabled={!pledgeId && !trackingId}
                  className="w-full"
                >
                  View Analytics
                </Button>
                <p className="text-xs text-gray-600 text-center">
                  You can find these IDs in your share links or pledge records
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <Button 
                variant="outline" 
                onClick={() => setShowDashboard(false)}
                className="mb-4"
              >
                ← Back to Search
              </Button>
              <div className="text-sm text-gray-600">
                {pledgeId && <div>Pledge ID: <code className="bg-gray-100 px-1 rounded">{pledgeId}</code></div>}
                {trackingId && <div>Tracking ID: <code className="bg-gray-100 px-1 rounded">{trackingId}</code></div>}
              </div>
            </div>
            <AnalyticsDashboard pledgeId={pledgeId || undefined} trackingId={trackingId || undefined} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">Loading...</div>}>
      <AnalyticsContent />
    </Suspense>
  )
}
