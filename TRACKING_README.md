# Link Tracking System

This document describes the comprehensive link tracking system implemented for the Atmanirbhar Bharat Pledge Flow App.

## Overview

The tracking system allows you to monitor when people click on shared pledge links, providing detailed analytics about your audience and engagement.

## Features

### 📊 Analytics Data Collected
- **Click Counts**: Total clicks per link/link type
- **Click Trends**: Time-based analytics (daily, weekly, monthly)
- **Geographic Data**: IP-based location insights
- **Device Analytics**: Browser, OS, device type breakdown
- **User Behavior**: Click patterns and engagement metrics
- **Conversion Tracking**: Track if visitors complete pledges

### 🔗 Link Flow
1. User completes pledge and gets a unique pledge ID
2. System generates a trackable link: `yourdomain.com/track/TRK-XXXXXX`
3. When someone clicks the link:
   - Analytics data is captured (IP, device, referrer, etc.)
   - User is redirected to main app with original pledge ID
   - Click is recorded in database

## Database Schema

### `tracking_links` Table
Stores tracking link metadata:
- `id`: UUID primary key
- `tracking_id`: Unique tracking identifier (TRK-XXXXXX)
- `pledge_id`: Original pledge ID
- `original_pledge_id`: Source pledge ID
- `created_at`: Creation timestamp
- `created_by`: Who created the link
- `metadata`: Additional data (JSON)
- `is_active`: Whether link is active
- `expires_at`: Optional expiration

### `link_clicks` Table
Stores individual click records:
- `id`: UUID primary key
- `tracking_link_id`: Foreign key to tracking_links
- `clicked_at`: Click timestamp
- `ip_address`: Visitor IP
- `user_agent`: Browser information
- `referrer`: Source page
- `country/region/city`: Geographic data
- `device_type`: mobile/desktop/tablet
- `browser/os`: Device details
- `screen_resolution`: Display info
- `language/timezone`: Locale data
- `session_id`: User session tracking
- `is_bot`: Bot detection
- `converted_to_pledge`: Conversion tracking

## API Endpoints

### POST `/api/track-link`
Create a new tracking link.

**Request:**
```json
{
  "pledgeId": "AANIRBHA-2024-XXXXXX-X",
  "originalPledgeId": "AANIRBHA-2024-XXXXXX-X",
  "metadata": { "name": "John Doe" },
  "createdBy": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "trackingId": "TRK-ABC123",
  "trackingLink": "/track/TRK-ABC123"
}
```

### POST `/api/track-click`
Record a click on a tracking link.

**Request:**
```json
{
  "trackingId": "TRK-ABC123",
  "sessionId": "sess_123456789",
  "userAgent": "Mozilla/5.0...",
  "referrer": "https://twitter.com",
  "screenResolution": "1920x1080",
  "language": "en-US",
  "timezone": "America/New_York"
}
```

### GET `/api/analytics`
Get analytics data.

**Query Parameters:**
- `pledgeId`: Filter by pledge ID
- `trackingId`: Filter by tracking ID
- `timeframe`: 1d, 7d, 30d, 90d, all
- `includeDetails`: true/false

## Usage

### 1. Automatic Tracking Link Generation
When a user completes a pledge, the system automatically:
- Creates a tracking link
- Replaces the regular share URL with the tracking link
- No changes needed in existing code

### 2. Manual Tracking Link Creation
```typescript
import { createTrackingLink } from '@/lib/tracking'

const { trackingId, trackingLink } = await createTrackingLink(
  'AANIRBHA-2024-XXXXXX-X',
  'AANIRBHA-2024-XXXXXX-X',
  { campaign: 'social-media' },
  'user@example.com'
)
```

### 3. Viewing Analytics
Visit `/analytics` to view the analytics dashboard:
- Enter a pledge ID or tracking ID
- View comprehensive analytics data
- Filter by timeframes
- Export data if needed

## Files Added/Modified

### New Files
- `supabase/migrations/001_create_tracking_tables.sql` - Database schema
- `app/api/track-link/route.ts` - Create tracking links
- `app/api/track-click/route.ts` - Record clicks
- `app/api/analytics/route.ts` - Get analytics data
- `app/track/[trackingId]/page.tsx` - Tracking redirect page
- `app/analytics/page.tsx` - Analytics dashboard
- `components/analytics/analytics-dashboard.tsx` - Dashboard component
- `lib/tracking.ts` - Tracking utilities
- `test-tracking.js` - Test script

### Modified Files
- `components/pledge/step-confirm.tsx` - Added tracking link generation

## Testing

Run the test script to verify functionality:

```bash
# Start your development server
npm run dev

# In another terminal, run the test
node test-tracking.js
```

## Privacy & Compliance

- IP addresses are stored for geographic analysis
- No personally identifiable information is collected
- Users can opt out by not clicking tracking links
- Data retention policies can be implemented

## Performance Considerations

- Database indexes on frequently queried columns
- Efficient queries with proper joins
- Caching for analytics dashboard
- Rate limiting on API endpoints (recommended)

## Security

- Row Level Security (RLS) enabled on tables
- API endpoints validate input data
- No sensitive data in tracking links
- Bot detection to prevent spam

## Monitoring

- Check `/analytics` dashboard regularly
- Monitor API response times
- Set up alerts for unusual activity
- Review conversion rates

## Troubleshooting

### Common Issues

1. **Tracking links not working**
   - Check if tracking_links table exists
   - Verify API endpoints are accessible
   - Check browser console for errors

2. **Analytics not showing data**
   - Ensure clicks are being recorded
   - Check timezone settings
   - Verify database permissions

3. **Redirect not working**
   - Check tracking redirect page
   - Verify pledge ID format
   - Check for JavaScript errors

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` and check console logs.

## Future Enhancements

- Real-time analytics updates
- Email notifications for high engagement
- A/B testing for different link formats
- Integration with external analytics tools
- Advanced geographic mapping
- Social media platform detection
- Conversion funnel analysis
