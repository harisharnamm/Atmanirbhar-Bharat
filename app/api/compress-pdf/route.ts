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
    
    // Use compress-pdf for compression
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
  } catch (error) {
    console.error('PDF compression failed:', error)
    return NextResponse.json({ error: 'Compression failed' }, { status: 500 })
  }
}
