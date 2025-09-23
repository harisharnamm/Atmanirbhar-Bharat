# Atmanirbhar Bharat Pledge Flow App

A Next.js web application for citizens to make pledges supporting Atmanirbhar Bharat (Self-Reliant India) initiative.

## Features

- **Multi-step Pledge Flow**: Guided pledge process with form validation
- **District & Constituency Selection**: Searchable dropdowns for Rajasthan districts and constituencies
- **Animated Pledge Reading**: Character-by-character animation of pledge text
- **Certificate Generation**: PDF certificate generation and download
- **Bilingual Support**: English and Hindi language support
- **Responsive Design**: Mobile-friendly interface using shadcn/ui components

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **PDF Generation**: jsPDF
- **Icons**: Lucide React
- **Deployment**: Vercel

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/harisharnamm/atmanirbharBharat.git
   cd atmanirbharBharat
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

The application is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect Next.js and configure the build settings
3. Deploy the application

## Project Structure

- `app/`: Next.js app router pages and layouts
- `components/`: React components including UI components and pledge flow steps
- `lib/`: Utility functions including PDF generation
- `public/`: Static assets including images and logos

## Environment Variables

No environment variables are required for this application.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is private and proprietary.
