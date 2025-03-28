# Retrivia

- Retrivia comes from "Retrieve" (bringing back past moments) with a touch of nostalgia. The web application allows users to create memorable photostrips of special moments and add personal memorial notes to preserve the emotions and context of each memory. In the future, a semantic search feature will make it easy to find and relive these moments based on the content of your memorial notes. 

- Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Take 3 photos using your device's camera
- Upload 3 photos from your device
- Add custom captions to your photostrips
- Create a dated photostrip that displays the current date
- Add memorial notes to preserve the feelings and context of each moment
- Save and revisit your memories with a semantic search feature (coming soon)
- Download high-quality photostrips with your memorial notes

## Tech Stack

- Next.js 15.2.0
- React 18.3.1
- TypeScript
- Tailwind CSS

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
Retrivia/
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