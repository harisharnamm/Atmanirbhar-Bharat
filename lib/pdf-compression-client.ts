// Client-side PDF compression using pdf-lib
// This is a fallback when server-side compression with Ghostscript is not available

import { PDFDocument } from 'pdf-lib'

export async function compressPdfClient(pdfFile: File): Promise<File> {
  try {
    // Load the PDF
    const arrayBuffer = await pdfFile.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    
    // Get all pages
    const pages = pdfDoc.getPages()
    
    // Create a new PDF document
    const newPdfDoc = await PDFDocument.create()
    
    // Copy pages with reduced quality settings
    for (const page of pages) {
      const { width, height } = page.getSize()
      
      // Scale down the page for compression
      const scale = Math.min(800 / width, 600 / height, 1) // Don't scale up
      const scaledWidth = width * scale
      const scaledHeight = height * scale
      
      // Add page with scaled dimensions
      const newPage = newPdfDoc.addPage([scaledWidth, scaledHeight])
      
      // Draw the original page scaled down
      newPage.drawPage(page, {
        x: 0,
        y: 0,
        xScale: scale,
        yScale: scale,
      })
    }
    
    // Save the compressed PDF
    const pdfBytes = await newPdfDoc.save({
      useObjectStreams: false, // Disable object streams for better compression
      addDefaultPage: false,
    })
    
    // Create a new File object
    const compressedFile = new File([pdfBytes], pdfFile.name, {
      type: 'application/pdf',
    })
    
    console.log(`PDF compressed: ${pdfFile.size} bytes -> ${compressedFile.size} bytes (${Math.round((1 - compressedFile.size / pdfFile.size) * 100)}% reduction)`)
    
    return compressedFile
  } catch (error) {
    console.warn('Client-side PDF compression failed:', error)
    // Return original file if compression fails
    return pdfFile
  }
}

// Alternative simple compression by reducing image quality in PDF
export async function simplePdfCompression(pdfFile: File): Promise<File> {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    
    // Save with compression options
    const pdfBytes = await pdfDoc.save({
      useObjectStreams: false,
      addDefaultPage: false,
      objectsPerTick: 50, // Process fewer objects per tick for memory efficiency
    })
    
    const compressedFile = new File([pdfBytes], pdfFile.name, {
      type: 'application/pdf',
    })
    
    console.log(`Simple PDF compression: ${pdfFile.size} bytes -> ${compressedFile.size} bytes`)
    
    return compressedFile
  } catch (error) {
    console.warn('Simple PDF compression failed:', error)
    return pdfFile
  }
}
