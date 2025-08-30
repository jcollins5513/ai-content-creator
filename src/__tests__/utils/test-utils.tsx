import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthProvider } from '@/contexts/AuthContext'
import { UserProfile } from '@/types'

// Mock AuthContext for testing
const MockAuthProvider = ({ 
  children, 
  mockUser = null,
  loading = false 
}: { 
  children: React.ReactNode
  mockUser?: UserProfile | null
  loading?: boolean 
}) => {
  const mockAuthValue = {
    user: mockUser,
    loading,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  }

  return (
    <div data-testid="mock-auth-provider">
      {React.cloneElement(children as ReactElement, { authValue: mockAuthValue })}
    </div>
  )
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  mockUser?: UserProfile | null
  loading?: boolean
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { mockUser, loading, ...renderOptions } = options

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <MockAuthProvider mockUser={mockUser} loading={loading}>
      {children}
    </MockAuthProvider>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

test('test-utils placeholder', () => {
  expect(true).toBe(true)
})

// Test data factories
export const createMockUser = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  customImageCategories: [],
  subscriptionPlan: 'free',
  createdAt: new Date('2024-01-01'),
  lastLoginAt: new Date(),
  usageStats: {
    contentGenerations: 0,
    designsCreated: 0,
    imagesUploaded: 0,
  },
  ...overrides,
})

export const createMockTemplate = (overrides = {}) => ({
  id: 'test-template-id',
  userId: null,
  name: 'Test Template',
  industry: 'Retail',
  description: 'Test template description',
  questions: [
    {
      id: 'q1',
      question: 'What is your business name?',
      type: 'text',
      required: true,
    },
  ],
  promptTemplate: 'Create content for {businessName}',
  isActive: true,
  createdAt: new Date(),
  ...overrides,
})

export const createMockDesign = (overrides = {}) => ({
  id: 'test-design-id',
  userId: 'test-user-id',
  name: 'Test Design',
  canvasSettings: {
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
  },
  elements: [],
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  },
  ...overrides,
})

export const createMockImage = (overrides = {}) => ({
  id: 'test-image-id',
  userId: 'test-user-id',
  filename: 'test-image.jpg',
  category: 'Backgrounds',
  storageUrl: 'https://example.com/image.jpg',
  metadata: {
    size: 1024000,
    dimensions: { width: 800, height: 600 },
    uploadedAt: new Date(),
  },
  ...overrides,
})

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }