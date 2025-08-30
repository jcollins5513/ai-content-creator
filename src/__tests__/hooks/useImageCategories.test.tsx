import { renderHook, act } from '@testing-library/react'
import { useImageCategories } from '@/hooks/useImageCategories'
import { ImageCategoriesService } from '@/services/imageCategories'
import { createMockUser } from '../utils/test-utils'

// Mock the AuthContext
const mockUseAuth = jest.fn()
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock ImageCategoriesService
jest.mock('@/services/imageCategories')
const mockImageCategoriesService = ImageCategoriesService as jest.Mocked<typeof ImageCategoriesService>

describe('useImageCategories', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockCategories = [
    { name: 'Backgrounds', isCustom: false, canDelete: false },
    { name: 'Logos/Branding', isCustom: false, canDelete: false },
    { name: 'Custom Category', isCustom: true, canDelete: true },
  ]

  const mockStats = {
    totalCategories: 3,
    defaultCategories: 2,
    customCategories: 1,
    canAddMore: true,
    remainingSlots: 1,
  }

  it('should load categories and stats on mount', async () => {
    const mockUser = createMockUser()
    mockUseAuth.mockReturnValue({ user: mockUser })
    
    mockImageCategoriesService.getUserCategories.mockResolvedValue(mockCategories)
    mockImageCategoriesService.getCategoryStats.mockResolvedValue(mockStats)

    const { result } = renderHook(() => useImageCategories())

    // Initially loading
    expect(result.current.loading).toBe(true)

    // Wait for data to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.categories).toEqual(mockCategories)
    expect(result.current.stats).toEqual(mockStats)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle no user', async () => {
    mockUseAuth.mockReturnValue({ user: null })

    const { result } = renderHook(() => useImageCategories())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.categories).toEqual([])
    expect(result.current.stats).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('should handle loading error', async () => {
    const mockUser = createMockUser()
    mockUseAuth.mockReturnValue({ user: mockUser })
    
    mockImageCategoriesService.getUserCategories.mockRejectedValue(new Error('Load failed'))

    const { result } = renderHook(() => useImageCategories())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.error).toBe('Load failed')
    expect(result.current.loading).toBe(false)
  })

  it('should add custom category', async () => {
    const mockUser = createMockUser()
    mockUseAuth.mockReturnValue({ user: mockUser })
    
    mockImageCategoriesService.getUserCategories.mockResolvedValue(mockCategories)
    mockImageCategoriesService.getCategoryStats.mockResolvedValue(mockStats)
    mockImageCategoriesService.addCustomCategory.mockResolvedValue()

    const { result } = renderHook(() => useImageCategories())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    await act(async () => {
      await result.current.addCustomCategory('New Category')
    })

    expect(mockImageCategoriesService.addCustomCategory).toHaveBeenCalledWith(
      mockUser.uid,
      'New Category'
    )
    // Should reload categories after adding
    expect(mockImageCategoriesService.getUserCategories).toHaveBeenCalledTimes(2)
  })

  it('should remove custom category', async () => {
    const mockUser = createMockUser()
    mockUseAuth.mockReturnValue({ user: mockUser })
    
    mockImageCategoriesService.getUserCategories.mockResolvedValue(mockCategories)
    mockImageCategoriesService.getCategoryStats.mockResolvedValue(mockStats)
    mockImageCategoriesService.removeCustomCategory.mockResolvedValue()

    const { result } = renderHook(() => useImageCategories())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    await act(async () => {
      await result.current.removeCustomCategory('Custom Category')
    })

    expect(mockImageCategoriesService.removeCustomCategory).toHaveBeenCalledWith(
      mockUser.uid,
      'Custom Category'
    )
    // Should reload categories after removing
    expect(mockImageCategoriesService.getUserCategories).toHaveBeenCalledTimes(2)
  })

  it('should rename custom category', async () => {
    const mockUser = createMockUser()
    mockUseAuth.mockReturnValue({ user: mockUser })
    
    mockImageCategoriesService.getUserCategories.mockResolvedValue(mockCategories)
    mockImageCategoriesService.getCategoryStats.mockResolvedValue(mockStats)
    mockImageCategoriesService.renameCustomCategory.mockResolvedValue()

    const { result } = renderHook(() => useImageCategories())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    await act(async () => {
      await result.current.renameCustomCategory('Old Name', 'New Name')
    })

    expect(mockImageCategoriesService.renameCustomCategory).toHaveBeenCalledWith(
      mockUser.uid,
      'Old Name',
      'New Name'
    )
    // Should reload categories after renaming
    expect(mockImageCategoriesService.getUserCategories).toHaveBeenCalledTimes(2)
  })

  it('should check if user can add more categories', async () => {
    const mockUser = createMockUser()
    mockUseAuth.mockReturnValue({ user: mockUser })
    
    mockImageCategoriesService.getUserCategories.mockResolvedValue(mockCategories)
    mockImageCategoriesService.getCategoryStats.mockResolvedValue(mockStats)
    mockImageCategoriesService.canAddCustomCategory.mockResolvedValue({ canAdd: true } as any)

    const { result } = renderHook(() => useImageCategories())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    let canAdd
    await act(async () => {
      canAdd = await result.current.canAddMore()
    })

    expect(canAdd).toBe(true)
    expect(mockImageCategoriesService.canAddCustomCategory).toHaveBeenCalledWith(mockUser.uid)
  })

  it('should refresh categories', async () => {
    const mockUser = createMockUser()
    mockUseAuth.mockReturnValue({ user: mockUser })
    
    mockImageCategoriesService.getUserCategories.mockResolvedValue(mockCategories)
    mockImageCategoriesService.getCategoryStats.mockResolvedValue(mockStats)

    const { result } = renderHook(() => useImageCategories())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    await act(async () => {
      await result.current.refreshCategories()
    })

    // Should call getUserCategories twice (initial load + refresh)
    expect(mockImageCategoriesService.getUserCategories).toHaveBeenCalledTimes(2)
    expect(mockImageCategoriesService.getCategoryStats).toHaveBeenCalledTimes(2)
  })

  it('should handle errors in category operations', async () => {
    const mockUser = createMockUser()
    mockUseAuth.mockReturnValue({ user: mockUser })
    
    mockImageCategoriesService.getUserCategories.mockResolvedValue(mockCategories)
    mockImageCategoriesService.getCategoryStats.mockResolvedValue(mockStats)
    mockImageCategoriesService.addCustomCategory.mockRejectedValue(new Error('Add failed'))

    const { result } = renderHook(() => useImageCategories())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    await act(async () => {
      try {
        await result.current.addCustomCategory('New Category')
      } catch (error) {
        expect(error).toEqual(new Error('Add failed'))
      }
    })

    expect(result.current.error).toBe('Add failed')
  })

  it('should throw error when user not authenticated', async () => {
    mockUseAuth.mockReturnValue({ user: null })

    const { result } = renderHook(() => useImageCategories())

    await act(async () => {
      try {
        await result.current.addCustomCategory('Test Category')
      } catch (error) {
        expect(error).toEqual(new Error('User not authenticated'))
      }
    })
  })
})