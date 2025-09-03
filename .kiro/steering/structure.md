# Project Structure & Architecture Patterns

## Directory Organization

```
src/
├── app/                    # Next.js App Router (pages & API routes)
│   ├── api/               # Server-side API endpoints
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main application pages
│   └── globals.css        # Global styles
├── components/            # React components (organized by feature)
│   ├── auth/             # Authentication components
│   ├── background-removal/ # Image processing components
│   ├── categories/       # Category management
│   ├── content-generation/ # AI content generation
│   ├── image-library/    # Image management
│   ├── settings/         # User settings
│   └── ui/               # Reusable UI components
├── contexts/             # React Context providers
├── hooks/                # Custom React hooks
├── lib/                  # Library configurations & utilities
├── services/             # Business logic & API services
├── types/                # TypeScript type definitions
└── utils/                # Helper functions & constants
```

## Code Organization Patterns

### Component Structure
- **Feature-based organization**: Components grouped by functionality
- **Index files**: Each feature folder exports components via `index.ts`
- **Single responsibility**: Each component handles one specific concern
- **Composition over inheritance**: Use React composition patterns

### Service Layer Pattern
- **Service classes**: Static methods for business logic (e.g., `UserProfileService`)
- **Firebase abstraction**: Services handle all Firestore/Storage operations
- **Error handling**: Consistent error handling across all services
- **Type safety**: Full TypeScript coverage with proper interfaces

### Hook Patterns
- **Custom hooks**: Encapsulate stateful logic and side effects
- **Context integration**: Hooks consume React contexts (e.g., `useAuth`)
- **Data fetching**: Hooks handle Firebase real-time subscriptions
- **State management**: Local state with hooks, global state with contexts

## File Naming Conventions

- **Components**: PascalCase (e.g., `AuthModal.tsx`, `ImageCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`, `useImages.ts`)
- **Services**: PascalCase with `Service` suffix (e.g., `UserProfileService`)
- **Types**: PascalCase interfaces (e.g., `UserProfile`, `ImageMetadata`)
- **Utils**: camelCase functions (e.g., `formatDate`, `validateEmail`)

## Import/Export Patterns

### Path Aliases
- Use `@/` for all internal imports: `import { useAuth } from '@/hooks/useAuth'`
- Relative imports only for same-directory files

### Export Patterns
- **Named exports**: Preferred for components and utilities
- **Default exports**: Only for Next.js pages and single-purpose modules
- **Index files**: Re-export related components for cleaner imports

## Architecture Principles

### Client-Server Separation
- **Client**: React components, hooks, contexts, client-side logic
- **Server**: Next.js API routes for OpenAI integration and server actions
- **Firebase**: Direct client SDK usage for auth, Firestore, and storage

### State Management
- **Local state**: React useState for component-specific state
- **Global state**: React Context for user auth and app-wide state
- **Server state**: Firebase real-time listeners with custom hooks
- **Form state**: Controlled components with validation

### Error Boundaries
- **Global error boundary**: Catches React component errors
- **Service error handling**: Consistent error types and messages
- **User feedback**: Toast notifications for user-facing errors
- **Logging**: Console logging for development, structured logging for production

### Testing Structure
- **Unit tests**: Components, hooks, services, and utilities
- **Integration tests**: User flows and Firebase interactions
- **Test utilities**: Shared test helpers in `src/__tests__/utils/`
- **Mocking**: Firebase emulator and OpenAI API mocks