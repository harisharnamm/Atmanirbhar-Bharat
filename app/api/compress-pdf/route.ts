import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)
    
    // Check if we're in a Vercel environment (no Ghostscript available)
    const isVercel = process.env.VERCEL === '1'
    
    if (isVercel) {
      // For Vercel deployment, return the original file without compression
      // This is a fallback since Ghostscript is not available
      console.log('Vercel environment detected - skipping PDF compression')
      return new NextResponse(inputBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': inputBuffer.length.toString(),
        },
      })
    }
    
    try {
      // Use compress-pdf for compression (only works in environments with Ghostscript)
      const { compress } = require('compress-pdf')
      
      // Compress the PDF
      const compressedBuffer = await compress(inputBuffer, {
        quality: 'low', // Maximum compression
        maxWidth: 800,
        maxHeight: 600,
      })
      
      // Return compressed PDF as response
      return new NextResponse(compressedBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': compressedBuffer.length.toString(),
        },
      })
    } catch (compressionError) {
      console.warn('PDF compression failed, returning original:', compressionError)
      // Fallback to original file if compression fails
      return new NextResponse(inputBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': inputBuffer.length.toString(),
        },
      })
    }
  } catch (error) {
    console.error('PDF compression API failed:', error)
    return NextResponse.json({ error: 'Compression failed' }, { status: 500 })
  }
}
