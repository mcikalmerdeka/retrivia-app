# Retrivia

A simple, client-side photobooth web application for creating beautiful photostrips.

## Features

- **Capture Moments**: Take 3 photos using your device's camera
- **Upload Memories**: Upload 3 existing photos from your device
- **Customize**: Apply filters, choose frames, and add captions
- **Download**: Save your photostrip as a high-quality JPEG

## Tech Stack

- Next.js 15.5.12
- React 18.3.1
- TypeScript
- Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

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

## How to Use

### Capture Mode
1. Click "Capture Moments" on the home page
2. Grant camera permissions when prompted
3. Click "Capture 3 Photos" to start the countdown
4. The camera will automatically take 3 photos with countdown timers
5. Review your photos and click "Edit & Download" to customize
6. Apply filters, choose frames, and add a caption
7. Click "Download Photostrip" to save your creation

### Upload Mode
1. Click "Upload Memories" on the home page
2. Upload up to 3 photos from your device
3. Crop each photo to fit the photostrip format
4. Click "Edit & Download" to customize
5. Apply filters, choose frames, and add a caption
6. Click "Download Photostrip" to save your creation

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
Retrivia/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── page.tsx           # Home page
│   │   ├── photobooth/        # Camera capture page
│   │   └── upload/            # Photo upload page
│   ├── components/
│   │   ├── photobooth/        # Photobooth components
│   │   │   ├── PhotoboothComponent.tsx
│   │   │   ├── PhotoStripComponent.tsx
│   │   │   ├── FilterComponent.tsx
│   │   │   ├── FrameComponent.tsx
│   │   │   └── CaptionComponent.tsx
│   │   └── upload/            # Upload components
│   │       └── UploadComponent.tsx
│   ├── lib/
│   │   └── utils/             # Utility functions
│   └── types/                 # TypeScript types
├── .env.example               # Environment variables template
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Customization Options

### Filters
- Raw (no filter)
- Sepia
- Black & White
- Vintage 1
- Vintage 2

### Frames
- Classic (warm beige)
- Polaroid (cream)
- Filmstrip (with sprocket holes)
- Scalloped (light sepia)

### Caption Styles
- Vintage (serif, italic)
- Handwritten (serif)
- Modern (sans-serif)
- Fancy (serif)

## Notes

- This is a **client-side only** application - no database required
- Photos are processed in the browser and never sent to any server
- All data is temporary and cleared when you refresh or close the page
- The application works offline after the initial page load

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers with camera support

## License

MIT

## Author

Cikal Merdeka
