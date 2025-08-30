import { UserProfileService } from '@/services/userProfile'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { SUBSCRIPTION_PLANS, FREE_TIER_LIMITS } from '@/types/firestore'

// Mock Firebase functions
jest.mock('firebase/firestore')
jest.mock('@/lib/firebase', () => ({
  db: {},
}))

const mockDoc = doc as jest.MockedFunction<typeof doc>
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>

describe('UserProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createUserProfile', () => {
    it('should create a new user profile successfully', async () => {
      const mockDocRef = { id: 'test-uid' }
      mockDoc.mockReturnValue(mockDocRef as any)
      mockGetDoc.mockResolvedValue({ exists: () => false } as any)
      mockSetDoc.mockResolvedValue(undefined)

      const result = await UserProfileService.createUserProfile(
        'test-uid',
        'test@example.com',
        'Test User'
      )

      expect(result).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        customImageCategories: [],
        subscriptionPlan: SUBSCRIPTION_PLANS.FREE,
        createdAt: expect.any(Date),
        lastLoginAt: expect.any(Date),
        usageStats: {
          contentGenerations: 0,
          designsCreated: 0,
          imagesUploaded: 0,
        },
      })

      expect(mockSetDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          email: 'test@example.com',
          displayName: 'Test User',
          customImageCategories: [],
          subscriptionPlan: SUBSCRIPTION_PLANS.FREE,
        })
      )
    })

    it('should throw error if user profile already exists', async () => {
      mockDoc.mockReturnValue({ id: 'test-uid' } as any)
      mockGetDoc.mockResolvedValue({ exists: () => true } as any)

      await expect(
        UserProfileService.createUserProfile('test-uid', 'test@example.com')
      ).rejects.toThrow('User profile already exists')
    })
  })

  describe('getUserProfile', () => {
    it('should return user profile if exists', async () => {
      const mockUserData = {
        email: 'test@example.com',
        displayName: 'Test User',
        customImageCategories: ['Custom Category'],
        subscriptionPlan: 'free',
        createdAt: { toDate: () => new Date('2024-01-01') },
        lastLoginAt: { toDate: () => new Date() },
        usageStats: {
          contentGenerations: 5,
          designsCreated: 3,
          imagesUploaded: 10,
        },
      }

      mockDoc.mockReturnValue({ id: 'test-uid' } as any)
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
        id: 'test-uid',
      } as any)

      const result = await UserProfileService.getUserProfile('test-uid')

      expect(result).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        customImageCategories: ['Custom Category'],
        subscriptionPlan: 'free',
        createdAt: new Date('2024-01-01'),
        lastLoginAt: expect.any(Date),
        usageStats: {
          contentGenerations: 5,
          designsCreated: 3,
          imagesUploaded: 10,
        },
      })
    })

    it('should return null if user profile does not exist', async () => {
      mockDoc.mockReturnValue({ id: 'test-uid' } as any)
      mockGetDoc.mockResolvedValue({ exists: () => false } as any)

      const result = await UserProfileService.getUserProfile('test-uid')

      expect(result).toBeNull()
    })
  })

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const mockDocRef = { id: 'test-uid' }
      mockDoc.mockReturnValue(mockDocRef as any)
      mockUpdateDoc.mockResolvedValue(undefined)

      const updates = {
        displayName: 'Updated Name',
        customImageCategories: ['New Category'],
      }

      await UserProfileService.updateUserProfile('test-uid', updates)

      expect(mockUpdateDoc).toHaveBeenCalledWith(mockDocRef, updates)
    })

    it('should convert Date objects to Timestamps', async () => {
      const mockDocRef = { id: 'test-uid' }
      mockDoc.mockReturnValue(mockDocRef as any)
      mockUpdateDoc.mockResolvedValue(undefined)

      const lastLoginAt = new Date()
      const updates = { lastLoginAt }

      await UserProfileService.updateUserProfile('test-uid', updates)

      expect(mockUpdateDoc).toHaveBeenCalledWith(mockDocRef, {
        lastLoginAt: expect.any(Object), // Timestamp object
      })
    })
  })

  describe('checkUsageLimits', () => {
    it('should return unlimited access for premium users', async () => {
      const mockUserData = {
        subscriptionPlan: SUBSCRIPTION_PLANS.PREMIUM,
        customImageCategories: ['Cat1', 'Cat2', 'Cat3'],
        usageStats: { contentGenerations: 100 },
      }

      mockDoc.mockReturnValue({ id: 'test-uid' } as any)
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
        id: 'test-uid',
      } as any)

      const result = await UserProfileService.checkUsageLimits('test-uid')

      expect(result).toEqual({
        canGenerateContent: true,
        canCreateCustomTemplate: true,
        canAddCustomCategory: true,
        remainingGenerations: -1,
        customTemplatesUsed: 3,
        customCategoriesUsed: 3,
      })
    })

    it('should enforce limits for free tier users', async () => {
      const mockUserData = {
        subscriptionPlan: SUBSCRIPTION_PLANS.FREE,
        customImageCategories: ['Cat1'],
        usageStats: { contentGenerations: 45 },
      }

      mockDoc.mockReturnValue({ id: 'test-uid' } as any)
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
        id: 'test-uid',
      } as any)

      const result = await UserProfileService.checkUsageLimits('test-uid')

      expect(result).toEqual({
        canGenerateContent: true,
        canCreateCustomTemplate: true,
        canAddCustomCategory: true,
        remainingGenerations: 5, // 50 - 45
        customTemplatesUsed: 1,
        customCategoriesUsed: 1,
      })
    })

    it('should block content generation when limit reached', async () => {
      const mockUserData = {
        subscriptionPlan: SUBSCRIPTION_PLANS.FREE,
        customImageCategories: [],
        usageStats: { contentGenerations: FREE_TIER_LIMITS.MONTHLY_CONTENT_GENERATIONS },
      }

      mockDoc.mockReturnValue({ id: 'test-uid' } as any)
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
        id: 'test-uid',
      } as any)

      const result = await UserProfileService.checkUsageLimits('test-uid')

      expect(result.canGenerateContent).toBe(false)
      expect(result.remainingGenerations).toBe(0)
    })
  })

  describe('validateProfileData', () => {
    it('should validate email format', () => {
      const result = UserProfileService.validateProfileData({
        email: 'invalid-email',
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid email format')
    })

    it('should validate custom categories limit', () => {
      const result = UserProfileService.validateProfileData({
        customImageCategories: ['Cat1', 'Cat2', 'Cat3'], // Exceeds limit of 2
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        `Cannot have more than ${FREE_TIER_LIMITS.CUSTOM_CATEGORIES} custom categories`
      )
    })

    it('should detect duplicate categories', () => {
      const result = UserProfileService.validateProfileData({
        customImageCategories: ['Cat1', 'Cat1'],
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Duplicate custom categories are not allowed')
    })

    it('should detect conflicts with default categories', () => {
      const result = UserProfileService.validateProfileData({
        customImageCategories: ['Backgrounds'], // Default category name
      })

      expect(result.isValid).toBe(false)
      expect(result.errors[0]).toContain('Custom categories cannot use default names')
    })

    it('should validate subscription plan', () => {
      const result = UserProfileService.validateProfileData({
        subscriptionPlan: 'invalid-plan' as any,
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid subscription plan')
    })

    it('should pass validation for valid data', () => {
      const result = UserProfileService.validateProfileData({
        email: 'test@example.com',
        customImageCategories: ['Custom Cat 1', 'Custom Cat 2'],
        subscriptionPlan: 'free',
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})