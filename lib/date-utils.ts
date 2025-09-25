// Date utilities for Indian timezone handling

/**
 * Format a date to Indian timezone
 */
export function formatIndianDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

/**
 * Get current Indian time
 */
export function getCurrentIndianTime(): Date {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}))
}

/**
 * Format date for display in Indian timezone
 */
export function formatDateForDisplay(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format time for display in Indian timezone
 */
export function formatTimeForDisplay(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

/**
 * Get relative time in Indian timezone
 */
export function getRelativeTime(date: string | Date): string {
  const d = new Date(date)
  const now = getCurrentIndianTime()
  const diffMs = now.getTime() - d.getTime()
  
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffSeconds < 60) {
    return 'just now'
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else {
    return formatDateForDisplay(d)
  }
}
