# Technology Stack & Development Guide

## Core Technologies

- **Framework**: Next.js 15 with App Router and TypeScript
- **UI Library**: React 19 with modern hooks and context patterns
- **Styling**: Tailwind CSS 4 for responsive design
- **Canvas Library**: Konva.js with react-konva for visual editor
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI Integration**: OpenAI API via Next.js API routes
- **Image Processing**: @imgly/background-removal for client-side processing
- **Testing**: Jest with React Testing Library and jsdom environment

## Development Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build           # Production build with Turbopack
npm run start           # Start production server
npm run lint            # Run ESLint

# Testing
npm run test            # Run Jest tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
npm run test:ci         # CI-optimized test run
```

## Environment Configuration

Required environment variables in `.env.local`:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# OpenAI Configuration
OPENAI_API_KEY=

# Development (optional)
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true
```

## Key Libraries & Versions

- **Next.js**: 15.5.2 (App Router, Turbopack enabled)
- **React**: 19.1.0 (latest stable)
- **TypeScript**: 5.x (strict mode enabled)
- **Firebase**: 12.2.1 (v9+ modular SDK)
- **OpenAI**: 5.16.0 (latest API client)
- **Konva**: 9.3.22 (canvas manipulation)
- **@imgly/background-removal**: 1.7.0 (client-side processing)

## Build & Deployment

- **Build Tool**: Next.js with Turbopack for faster builds
- **Target**: ES2017 for broad browser compatibility
- **Module System**: ESNext with bundler resolution
- **Path Aliases**: `@/*` maps to `./src/*`
- **Strict TypeScript**: All strict checks enabled