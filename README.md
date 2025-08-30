# AI Content Creator Platform

A comprehensive web application that enables users to create professional marketing content by combining AI-generated text with visual design tools. Built with Next.js 14, Firebase, and OpenAI.

## Features

- **User Authentication**: Secure email/password authentication with Firebase Auth
- **Image Management**: Upload, organize, and manage images with smart categorization
- **Background Removal**: Client-side background removal using @imgly/background-removal
- **AI Content Generation**: Generate industry-specific content using OpenAI with built-in templates
- **Visual Canvas Editor**: Combine text and images on a flexible canvas using Konva.js
- **Design Management**: Save, load, and manage design projects
- **Export Functionality**: Export designs as high-quality images

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI Integration**: OpenAI API for content generation
- **Canvas Library**: Konva.js with react-konva
- **Image Processing**: @imgly/background-removal

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-content-creator
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages and API routes
│   ├── api/            # API routes for OpenAI integration
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── auth/          # Authentication components
│   ├── canvas/        # Canvas editor components
│   ├── content-generation/ # Content generation components
│   ├── image-library/ # Image management components
│   ├── layout/        # Layout components
│   └── ui/            # Reusable UI components
├── contexts/          # React contexts
├── hooks/             # Custom React hooks
├── lib/               # Library configurations (Firebase, etc.)
├── services/          # Business logic and API services
├── types/             # TypeScript type definitions
└── utils/             # Utility functions and constants
```

## Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password provider
3. Create a Firestore database
4. Set up Cloud Storage
5. Configure security rules for Firestore and Storage
6. Copy your Firebase config to the environment variables

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
