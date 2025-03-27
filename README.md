# Photobooth Web App

A modern web application for creating Instagram Story-sized photo collages. Built with Next.js, TypeScript, and Tailwind CSS.

## Live Demo

Try the application online: [https://photobooth-web-app.vercel.app/](https://photobooth-web-app.vercel.app/)

## Features

- Take 3 photos using your device's camera
- Upload 3 photos from your device
- Create beautiful collages
- Download photos in Instagram Story size (1080x1920)
- Vintage-inspired design

## Tech Stack

- Next.js 15.2.0
- React 18.3.1
- TypeScript
- Tailwind CSS
- shadcn/ui components

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
Photobooth Web App/
├── .git/                   # Git repository
├── .next/                  # Next.js build output
├── node_modules/           # Dependencies
├── src/                    # Source code
│   ├── app/                # Next.js app router pages
│   │   ├── page.tsx        # Home page
│   │   ├── photobooth/     # Photobooth page
│   │   └── upload/         # Upload page
│   ├── components/         # React components
│   │   ├── photobooth/     # Photobooth-specific components
│   │   │   ├── CaptionComponent.tsx
│   │   │   ├── FilterComponent.tsx
│   │   │   ├── FrameComponent.tsx
│   │   │   ├── PhotoboothComponent.tsx
│   │   │   ├── PhotoStripComponent.tsx
│   │   │   └── UploadComponent.tsx
│   │   ├── upload/         # Upload-specific components
│   │   │   └── UploadComponent.tsx
│   │   └── ui/             # Shared UI components
│   ├── lib/                # Utility functions
│   │   └── utils/          # Utility functions
│   │       └── photo.ts    # Photo manipulation utilities
│   └── types/              # TypeScript type definitions
├── .env                    # Environment variables
├── .eslintrc.json          # ESLint configuration
├── next.config.js          # Next.js configuration
├── package.json            # Dependencies and scripts
├── postcss.config.js       # PostCSS configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```