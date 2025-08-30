import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import { CategoryManager } from '@/components/categories/CategoryManager'
import { useImageCategories } from '@/hooks/useImageCategories'

// Mock the hook
jest.mock('@/hooks/useImageCategories')
const mockUseImageCategories = useImageCategories as jest.MockedFunction<typeof useImageCategories>

describe('CategoryManager', () => {
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

  const defaultMockReturn = {
    categories: mockCategories,
    loading: false,
    error: null,
    stats: mockStats,
    addCustomCategory: jest.fn(),
    removeCustomCategory: jest.fn(),
    renameCustomCategory: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseImageCategories.mockReturnValue(defaultMockReturn)
  })

  it('should render loading state', () => {
    mockUseImageCategories.mockReturnValue({
      ...defaultMockReturn,
      loading: true,
    })

      const { container } = render(<CategoryManager />)

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should render categories list', () => {
    render(<CategoryManager />)

    expect(screen.getByText('Image Categories')).toBeInTheDocument()
    expect(screen.getByText('Backgrounds')).toBeInTheDocument()
    expect(screen.getByText('Logos/Branding')).toBeInTheDocument()
    expect(screen.getByText('Custom Category')).toBeInTheDocument()
    
    // Default categories should have "Default" badge
    expect(screen.getAllByText('Default')).toHaveLength(2)
  })

  it('should display category statistics', () => {
    render(<CategoryManager />)

    expect(screen.getByText('Total: 3 categories')).toBeInTheDocument()
    expect(screen.getByText('Default: 2 | Custom: 1')).toBeInTheDocument()
    expect(screen.getByText('Remaining slots: 1')).toBeInTheDocument()
  })

  it('should show add category form when user can add more', () => {
    render(<CategoryManager />)

    expect(screen.getByPlaceholderText('Enter category name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })

  it('should hide add category form when user cannot add more', () => {
    mockUseImageCategories.mockReturnValue({
      ...defaultMockReturn,
      stats: { ...mockStats, canAddMore: false, remainingSlots: 0 },
    })

    render(<CategoryManager />)

    expect(screen.queryByPlaceholderText('Enter category name')).not.toBeInTheDocument()
    expect(screen.getByText(/reached the maximum number/)).toBeInTheDocument()
  })

  it('should add new category', async () => {
    const mockAddCategory = jest.fn().mockResolvedValue(undefined)
    const mockOnCategoryChange = jest.fn()
    
    mockUseImageCategories.mockReturnValue({
      ...defaultMockReturn,
      addCustomCategory: mockAddCategory,
    })

    render(<CategoryManager onCategoryChange={mockOnCategoryChange} />)

    const input = screen.getByPlaceholderText('Enter category name')
    const addButton = screen.getByRole('button', { name: 'Add' })

    fireEvent.change(input, { target: { value: 'New Category' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(mockAddCategory).toHaveBeenCalledWith('New Category')
      expect(mockOnCategoryChange).toHaveBeenCalled()
    })

    // Input should be cleared after successful add
    expect(input).toHaveValue('')
  })

  it('should show rename functionality for custom categories', () => {
    render(<CategoryManager />)

    const customCategoryRow = screen.getByText('Custom Category').closest('div')
    expect(customCategoryRow).toBeInTheDocument()
    
    const renameButton = screen.getByRole('button', { name: 'Rename' })
    const deleteButton = screen.getByRole('button', { name: 'Delete' })
    
    expect(renameButton).toBeInTheDocument()
    expect(deleteButton).toBeInTheDocument()
  })

  it('should not show rename/delete for default categories', () => {
    render(<CategoryManager />)

    const backgroundsRow = screen.getByText('Backgrounds').closest('div')
    expect(backgroundsRow).toBeInTheDocument()
    
    // Should not have rename/delete buttons for default categories
    const renameButtons = screen.getAllByRole('button', { name: 'Rename' })
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    
    // Only custom categories should have these buttons
    expect(renameButtons).toHaveLength(1)
    expect(deleteButtons).toHaveLength(1)
  })

  it('should handle rename category', async () => {
    const mockRenameCategory = jest.fn().mockResolvedValue(undefined)
    const mockOnCategoryChange = jest.fn()
    
    mockUseImageCategories.mockReturnValue({
      ...defaultMockReturn,
      renameCustomCategory: mockRenameCategory,
    })

    render(<CategoryManager onCategoryChange={mockOnCategoryChange} />)

    const renameButton = screen.getByRole('button', { name: 'Rename' })
    fireEvent.click(renameButton)

    // Should show edit input
    const editInput = screen.getByDisplayValue('Custom Category')
    expect(editInput).toBeInTheDocument()

    // Change the name
    fireEvent.change(editInput, { target: { value: 'Renamed Category' } })
    
    const saveButton = screen.getByRole('button', { name: 'Save' })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockRenameCategory).toHaveBeenCalledWith('Custom Category', 'Renamed Category')
      expect(mockOnCategoryChange).toHaveBeenCalled()
    })
  })

  it('should handle delete category with confirmation', async () => {
    const mockRemoveCategory = jest.fn().mockResolvedValue(undefined)
    const mockOnCategoryChange = jest.fn()
    
    // Mock window.confirm
    const originalConfirm = window.confirm
    window.confirm = jest.fn(() => true)
    
    mockUseImageCategories.mockReturnValue({
      ...defaultMockReturn,
      removeCustomCategory: mockRemoveCategory,
    })

    render(<CategoryManager onCategoryChange={mockOnCategoryChange} />)

    const deleteButton = screen.getByRole('button', { name: 'Delete' })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to delete')
      )
      expect(mockRemoveCategory).toHaveBeenCalledWith('Custom Category')
      expect(mockOnCategoryChange).toHaveBeenCalled()
    })

    // Restore original confirm
    window.confirm = originalConfirm
  })

  it('should not delete category if user cancels confirmation', async () => {
    const mockRemoveCategory = jest.fn()
    
    // Mock window.confirm to return false
    const originalConfirm = window.confirm
    window.confirm = jest.fn(() => false)
    
    mockUseImageCategories.mockReturnValue({
      ...defaultMockReturn,
      removeCustomCategory: mockRemoveCategory,
    })

    render(<CategoryManager />)

    const deleteButton = screen.getByRole('button', { name: 'Delete' })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled()
      expect(mockRemoveCategory).not.toHaveBeenCalled()
    })

    // Restore original confirm
    window.confirm = originalConfirm
  })

  it('should display error message', () => {
    mockUseImageCategories.mockReturnValue({
      ...defaultMockReturn,
      error: 'Something went wrong',
    })

    render(<CategoryManager />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('should disable form when submitting', async () => {
    const mockAddCategory = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    mockUseImageCategories.mockReturnValue({
      ...defaultMockReturn,
      addCustomCategory: mockAddCategory,
    })

    render(<CategoryManager />)

    const input = screen.getByPlaceholderText('Enter category name')
    const addButton = screen.getByRole('button', { name: 'Add' })

    fireEvent.change(input, { target: { value: 'New Category' } })
    fireEvent.click(addButton)

    // Should show loading state
    expect(screen.getByRole('button', { name: 'Adding...' })).toBeInTheDocument()
    expect(input).toBeDisabled()
  })
})