import { renderHook, act } from '@testing-library/react'
import { useUserProfile } from '@/hooks/useUserProfile'
import { UserProfileService } from '@/services/userProfile'
import { createMockUser } from '../utils/test-utils'

// Mock the AuthContext
const mockUseAuth = jest.fn()
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock UserProfileService
jest.mock('@/services/userProfile')
const mockUserProfileService = UserProfileService as jest.Mocked<typeof UserProfileService>

describe('useUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with user from auth context', () => {
    const mockUser = createMockUser()
    mockUseAuth.mockReturnValue({ user: mockUser })

    const { result } = renderHook(() => useUserProfile())

    expect(result.current.profile).toEqual(mockUser)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle no user', () => {
    mockUseAuth.mockReturnValue({ user: null })

    const { result } = renderHook(() => useUserProfile())

    expect(result.current.profile).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should update profile successfully', async () => {
    const mockUser = createMockUser()
    mockUseAuth.mockReturnValue({ user: mockUser })
    mockUserProfileService.updateUserProfile.mockResolvedValue()

    const { result } = renderHook(() => useUserProfile())

    const updates = { displayName: 'Updated Name' }

    await act(async () => {
      await result.current.updateProfile(updates)
    })

    expect(mockUserProfileService.updateUserProfile).toHaveBeenCalledWith(
      mockUser.uid,
      updates
    )
    expect(result.current.profile?.displayName).toBe('Updated Name')
    expect(result.current.error).toBeNull()
  })

  it('should handle update profile error', async () => {
    const mockUser = createMockUser()
    mockUseAuth.mockReturnValue({ user: mockUser })
    mockUserProfileService.updateUserProfile.mockRejectedValue(new Error('Update failed'))

    const { result } = renderHook(() => useUserProfile())

    await act(async () => {
      try {
        await result.current.updateProfile({ displayName: 'New Name' })
      } catch (error) {
        // Expected to throw
      }
    })

    expect(result.current.error).toBe('Update failed')
  })

  it('should increment usage stats', async () => {
    const mockUser = createMockUser({
      usageStats: { contentGenerations: 5, designsCreated: 3, imagesUploaded: 10 }
    })
    mockUseAuth.mockReturnValue({ user: mockUser })
    mockUserProfileService.incrementUsageStats.mockResolvedValue()

    const { result } = renderHook(() => useUserProfile())

    await act(async () => {
      await result.current.incrementUsage('contentGenerations')
    })

    expect(mockUserProfileService.incrementUsageStats).toHaveBeenCalledWith(
      mockUser.uid,
      'contentGenerations'
    )
    expect(result.current.profile?.usageStats.contentGenerations).toBe(6)
  })

  it('should check usage limits', async () => {
    const mockUser = createMockUser()
    mockUseAuth.mockReturnValue({ user: mockUser })
    
    const mockLimits = {
      canGenerateContent: true,
      canCreateCustomTemplate: true,
      canAddCustomCategory: false,
      remainingGenerations: 45,
      customTemplatesUsed: 0,
      customCategoriesUsed: 2,
    }
    
    mockUserProfileService.checkUsageLimits.mockResolvedValue(mockLimits)

    const { result } = renderHook(() => useUserProfile())

    let limits
    await act(async () => {
      limits = await result.current.checkLimits()
    })

    expect(limits).toEqual(mockLimits)
    expect(mockUserProfileService.checkUsageLimits).toHaveBeenCalledWith(mockUser.uid)
  })

  it('should get image categories', async () => {
    const mockUser = createMockUser()
    mockUseAuth.mockReturnValue({ user: mockUser })
    
    const mockCategories = ['Backgrounds', 'Logos/Branding', 'Custom Category']
    mockUserProfileService.getUserImageCategories.mockResolvedValue(mockCategories)

    const { result } = renderHook(() => useUserProfile())

    let categories
    await act(async () => {
      categories = await result.current.getImageCategories()
    })

    expect(categories).toEqual(mockCategories)
    expect(mockUserProfileService.getUserImageCategories).toHaveBeenCalledWith(mockUser.uid)
  })

  it('should refresh profile', async () => {
    const mockUser = createMockUser()
    const updatedUser = createMockUser({ displayName: 'Updated Name' })
    
    mockUseAuth.mockReturnValue({ user: mockUser })
    mockUserProfileService.getUserProfile.mockResolvedValue(updatedUser)

    const { result } = renderHook(() => useUserProfile())

    await act(async () => {
      await result.current.refreshProfile()
    })

    expect(mockUserProfileService.getUserProfile).toHaveBeenCalledWith(mockUser.uid)
    expect(result.current.profile).toEqual(updatedUser)
  })

  it('should throw error when user not authenticated', async () => {
    mockUseAuth.mockReturnValue({ user: null })

    const { result } = renderHook(() => useUserProfile())

    await act(async () => {
      try {
        await result.current.updateProfile({ displayName: 'Test' })
      } catch (error) {
        expect(error).toEqual(new Error('User not authenticated'))
      }
    })
  })
})