import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate pledge ID: AANIRBHA-YYYY-XXXXXX-Z
// - XXXXXX: 6-char upper alphanumeric, non-sequential (crypto-based)
// - Z: checksum digit (mod 10 of char codes)
export function generatePledgeId(date = new Date()): string {
  const prefix = 'AANIRBHA'
  const year = date.getFullYear().toString()
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // exclude 0,1, O, I
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  let middle = ''
  for (let i = 0; i < 6; i++) {
    middle += alphabet[bytes[i] % alphabet.length]
  }
  const base = `${prefix}-${year}-${middle}`
  // checksum: sum of char codes modulo 10
  const sum = base.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const check = (sum % 10).toString()
  return `${base}-${check}`
}

export function isNewPledgeIdFormat(id: string): boolean {
  // AANIRBHA-YYYY-XXXXXX-Z
  return /^AANIRBHA-\d{4}-[A-Z0-9]{6}-\d$/.test(id)
}
