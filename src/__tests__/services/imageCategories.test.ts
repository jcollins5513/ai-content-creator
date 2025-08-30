import { ImageCategoriesService } from '@/services/imageCategories'
import { UserProfileService } from '@/services/userProfile'
import { DEFAULT_IMAGE_CATEGORIES, FREE_TIER_LIMITS } from '@/types/firestore'
import { createMockUser } from '../utils/test-utils'

// Mock UserProfileService
jest.mock('@/services/userProfile')

const mockUserProfileService = UserProfileService as jest.Mocked<typeof UserProfileService>

describe('ImageCategoriesService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserCategories', () => {
    it('should return default and custom categories', async () => {
      const mockUser = createMockUser({
        customImageCategories: ['Custom Cat 1', 'Custom Cat 2'],
      })

      mockUserProfileService.getUserProfile.mockResolvedValue(mockUser)

      const result = await ImageCategoriesService.getUserCategories('test-uid')

      expect(result).toHaveLength(DEFAULT_IMAGE_CATEGORIES.length + 2)
      
      // Check default categories
      const defaultCategories = result.filter(cat => !cat.isCustom)
      expect(defaultCategories).toHaveLength(DEFAULT_IMAGE_CATEGORIES.length)
      expect(defaultCategories.every(cat => !cat.canDelete)).toBe(true)

      // Check custom categories
      const customCategories = result.filter(cat => cat.isCustom)
      expect(customCategories).toHaveLength(2)
      expect(customCategories.every(cat => cat.canDelete)).toBe(true)
      expect(customCategories.map(cat => cat.name)).toEqual(['Custom Cat 1', 'Custom Cat 2'])
    })

    it('should throw error if user profile not found', async () => {
      mockUserProfileService.getUserProfile.mockResolvedValue(null)

      await expect(
        ImageCategoriesService.getUserCategories('test-uid')
      ).rejects.toThrow('User profile not found')
    })
  })

  describe('addCustomCategory', () => {
    it('should add custom category successfully', async () => {
      const mockUser = createMockUser({
        customImageCategories: ['Existing Category'],
        subscriptionPlan: 'free',
      })

      mockUserProfileService.getUserProfile.mockResolvedValue(mockUser)
      mockUserProfileService.updateUserProfile.mockResolvedValue()

      await ImageCategoriesService.addCustomCategory('test-uid', 'New Category')

      expect(mockUserProfileService.updateUserProfile).toHaveBeenCalledWith('test-uid', {
        customImageCategories: ['Existing Category', 'New Category'],
      })
    })

    it('should enforce free tier limits', async () => {
      const mockUser = createMockUser({
        customImageCategories: ['Cat 1', 'Cat 2'], // Already at limit
        subscriptionPlan: 'free',
      })

      mockUserProfileService.getUserProfile.mockResolvedValue(mockUser)

      await expect(
        ImageCategoriesService.addCustomCategory('test-uid', 'New Category')
      ).rejects.toThrow(/Free tier users can only create/)
    })

    it('should allow unlimited categories for premium users', async () => {
      const mockUser = createMockUser({
        customImageCategories: ['Cat 1', 'Cat 2', 'Cat 3'], // Exceeds free limit
        subscriptionPlan: 'premium',
      })

      mockUserProfileService.getUserProfile.mockResolvedValue(mockUser)
      mockUserProfileService.updateUserProfile.mockResolvedValue()

      await ImageCategoriesService.addCustomCategory('test-uid', 'New Category')

      expect(mockUserProfileService.updateUserProfile).toHaveBeenCalledWith('test-uid', {
        customImageCategories: ['Cat 1', 'Cat 2', 'Cat 3', 'New Category'],
      })
    })

    it('should validate category name', async () => {
      const mockUser = createMockUser()
      mockUserProfileService.getUserProfile.mockResolvedValue(mockUser)

      // Test empty name
      await expect(
        ImageCategoriesService.addCustomCategory('test-uid', '   ')
      ).rejects.toThrow('Category name cannot be empty')

      // Test default category name conflict
      await expect(
        ImageCategoriesService.addCustomCategory('test-uid', 'Backgrounds')
      ).rejects.toThrow(/is a default category name/)
    })
  })

  describe('removeCustomCategory', () => {
    it('should remove custom category successfully', async () => {
      const mockUser = createMockUser({
        customImageCategories: ['Cat 1', 'Cat 2', 'Cat 3'],
      })

      mockUserProfileService.getUserProfile.mockResolvedValue(mockUser)
      mockUserProfileService.updateUserProfile.mockResolvedValue()

      await ImageCategoriesService.removeCustomCategory('test-uid', 'Cat 2')

      expect(mockUserProfileService.updateUserProfile).toHaveBeenCalledWith('test-uid', {
        customImageCategories: ['Cat 1', 'Cat 3'],
      })
    })

    it('should throw error if category not found', async () => {
      const mockUser = createMockUser({
        customImageCategories: ['Cat 1'],
      })

      mockUserProfileService.getUserProfile.mockResolvedValue(mockUser)

      await expect(
        ImageCategoriesService.removeCustomCategory('test-uid', 'Non-existent')
      ).rejects.toThrow('Category not found or is not a custom category')
    })
  })

  describe('renameCustomCategory', () => {
    it('should rename custom category successfully', async () => {
      const mockUser = createMockUser({
        customImageCategories: ['Old Name', 'Other Category'],
      })

      mockUserProfileService.getUserProfile.mockResolvedValue(mockUser)
      mockUserProfileService.updateUserProfile.mockResolvedValue()

      await ImageCategoriesService.renameCustomCategory('test-uid', 'Old Name', 'New Name')

      expect(mockUserProfileService.updateUserProfile).toHaveBeenCalledWith('test-uid', {
        customImageCategories: ['New Name', 'Other Category'],
      })
    })

    it('should validate new category name', async () => {
      const mockUser = createMockUser({
        customImageCategories: ['Old Name', 'Existing Category'],
      })

      mockUserProfileService.getUserProfile.mockResolvedValue(mockUser)

      // Test duplicate name
      await expect(
        ImageCategoriesService.renameCustomCategory('test-uid', 'Old Name', 'Existing Category')
      ).rejects.toThrow('already exists')
    })
  })

  describe('canAddCustomCategory', () => {
    it('should return true for premium users', async () => {
      const mockUser = createMockUser({
        customImageCategories: ['Cat 1', 'Cat 2', 'Cat 3'], // Exceeds free limit
        subscriptionPlan: 'premium',
      })

      mockUserProfileService.getUserProfile.mockResolvedValue(mockUser)

      const result = await ImageCategoriesService.canAddCustomCategory('test-uid')

      expect(result).toEqual({
        canAdd: true,
        currentCount: 3,
        maxAllowed: -1,
      })
    })

    it('should enforce limits for free users', async () => {
      const mockUser = createMockUser({
        customImageCategories: ['Cat 1', 'Cat 2'], // At limit
        subscriptionPlan: 'free',
      })

      mockUserProfileService.getUserProfile.mockResolvedValue(mockUser)

      const result = await ImageCategoriesService.canAddCustomCategory('test-uid')

      expect(result).toEqual({
        canAdd: false,
        reason: expect.stringContaining('Free tier users can only create'),
        currentCount: 2,
        maxAllowed: FREE_TIER_LIMITS.CUSTOM_CATEGORIES,
      })
    })
  })

  describe('validateCategoryName', () => {
    it('should validate empty names', () => {
      const result = ImageCategoriesService.validateCategoryName('   ')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Category name cannot be empty')
    })

    it('should validate name length', () => {
      const longName = 'a'.repeat(51)
      const result = ImageCategoriesService.validateCategoryName(longName)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Category name cannot exceed 50 characters')
    })

    it('should validate invalid characters', () => {
      const result = ImageCategoriesService.validateCategoryName('Invalid@Name!')

        expect(result.isValid).toBe(false)
        expect(
          result.errors.some(e => /can only contain letters, numbers/.test(e))
        ).toBe(true)
    })

    it('should detect default category conflicts', () => {
      const result = ImageCategoriesService.validateCategoryName('Backgrounds')

        expect(result.isValid).toBe(false)
        expect(
          result.errors.some(e => /is a default category name/.test(e))
        ).toBe(true)
    })

    it('should detect existing custom category conflicts', () => {
      const result = ImageCategoriesService.validateCategoryName('Existing', ['Existing'])

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Category "Existing" already exists')
    })

    it('should pass validation for valid names', () => {
      const result = ImageCategoriesService.validateCategoryName('Valid Category Name')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('getCategoryStats', () => {
    it('should return correct statistics', async () => {
      const mockCategories = [
        { name: 'Backgrounds', isCustom: false, canDelete: false },
        { name: 'Logos/Branding', isCustom: false, canDelete: false },
        { name: 'Custom 1', isCustom: true, canDelete: true },
        { name: 'Custom 2', isCustom: true, canDelete: true },
      ]

      const mockCanAddInfo = {
        canAdd: false,
        maxAllowed: 2,
      }

      jest.spyOn(ImageCategoriesService, 'getUserCategories').mockResolvedValue(mockCategories)
      jest.spyOn(ImageCategoriesService, 'canAddCustomCategory').mockResolvedValue(mockCanAddInfo as any)

      const result = await ImageCategoriesService.getCategoryStats('test-uid')

      expect(result).toEqual({
        totalCategories: 4,
        defaultCategories: 2,
        customCategories: 2,
        canAddMore: false,
        remainingSlots: 0, // 2 - 2
      })
    })
  })
})