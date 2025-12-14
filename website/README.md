# WorkerAI - Your Personal Autonomous Digital Worker

Modern landing page built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to see the website.

## 📦 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)

## 📁 Project Structure

```
website/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── pricing/
│   │   └── page.tsx        # Pricing page
│   └── download/
│       └── page.tsx        # Download page
├── components/
│   ├── Hero.tsx            # Hero section
│   ├── Features.tsx        # Features grid
│   ├── Demo.tsx            # Demo video section
│   ├── Security.tsx        # Security & trust
│   ├── CTA.tsx             # Call to action
│   └── Navbar.tsx          # Navigation
├── public/
│   └── images/             # Images and assets
└── styles/
    └── globals.css         # Global styles
```

## 🎨 Design System

### Colors
- Background: `#0C0C0D`
- Card: `#1A1A1D`
- Primary: `#5C7CFA`
- Accent: `#6EE7B7`

### Fonts
- Primary: Inter (from Google Fonts)
- Mono: JetBrains Mono

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Vercel will auto-detect Next.js and deploy
4. Done! Your site is live.

### Environment Variables

Create `.env.local`:
```env
# Chrome Web Store Extension ID (once published)
NEXT_PUBLIC_EXTENSION_ID=your-extension-id-here

# Analytics (optional)
NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

## 📝 Customization

### Update Extension Link

In `components/CTA.tsx` and `app/download/page.tsx`, update the Chrome Web Store URL:

```tsx
const EXTENSION_URL = "https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID"
```

### Update Content

All content is in the component files. Simply edit the text, headings, and descriptions to match your product.

### Add Demo Video

Place your demo video in `public/demo.mp4` or use a YouTube/Vimeo embed in `components/Demo.tsx`.

## ✨ Features

- ✅ Fully responsive design
- ✅ Dark mode optimized
- ✅ Smooth scroll animations
- ✅ SEO optimized with Next.js metadata
- ✅ Fast page loads with Next.js 14
- ✅ Type-safe with TypeScript
- ✅ Production-ready

## 📄 License

MIT License - feel free to use for your product.
