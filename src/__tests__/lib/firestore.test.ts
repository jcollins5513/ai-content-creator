import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  getUserDesigns,
  saveDesign,
  incrementUsageStats,
} from '@/lib/firestore'
import { doc, getDoc, setDoc, updateDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore'

// Mock Firebase functions
jest.mock('firebase/firestore')
jest.mock('@/lib/firebase', () => ({
  db: {},
}))

const mockDoc = doc as jest.MockedFunction<typeof doc>
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>
const mockQuery = query as jest.MockedFunction<typeof query>
const mockWhere = where as jest.MockedFunction<typeof where>
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>

describe('Firestore utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createUserProfile', () => {
    it('should create user profile with correct data structure', async () => {
      const mockDocRef = { id: 'test-uid' }
      mockDoc.mockReturnValue(mockDocRef as any)
      mockSetDoc.mockResolvedValue(undefined)

      await createUserProfile('test-uid', 'test@example.com', 'Test User')

      expect(mockSetDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          customImageCategories: [],
          subscriptionPlan: 'free',
          createdAt: expect.any(Object), // Timestamp
          lastLoginAt: expect.any(Object), // Timestamp
          usageStats: {
            contentGenerations: 0,
            designsCreated: 0,
            imagesUploaded: 0,
          },
        })
      )
    })
  })

  describe('getUserProfile', () => {
    it('should return user profile when document exists', async () => {
      const mockUserData = {
        email: 'test@example.com',
        displayName: 'Test User',
        customImageCategories: ['Custom Cat'],
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

      const result = await getUserProfile('test-uid')

      expect(result).toEqual({
        id: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        customImageCategories: ['Custom Cat'],
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

    it('should return null when document does not exist', async () => {
      mockDoc.mockReturnValue({ id: 'test-uid' } as any)
      mockGetDoc.mockResolvedValue({ exists: () => false } as any)

      const result = await getUserProfile('test-uid')

      expect(result).toBeNull()
    })
  })

  describe('updateUserProfile', () => {
    it('should update user profile with provided data', async () => {
      const mockDocRef = { id: 'test-uid' }
      mockDoc.mockReturnValue(mockDocRef as any)
      mockUpdateDoc.mockResolvedValue(undefined)

      const updates = {
        displayName: 'Updated Name',
        customImageCategories: ['New Category'],
      }

      await updateUserProfile('test-uid', updates)

      expect(mockUpdateDoc).toHaveBeenCalledWith(mockDocRef, updates)
    })
  })

  describe('getUserDesigns', () => {
    it('should return user designs with proper query', async () => {
      const mockDesigns = [
        {
          id: 'design1',
          userId: 'test-uid',
          name: 'Design 1',
          canvasSettings: { width: 800, height: 600 },
          elements: [],
          metadata: {
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
            version: 1,
          },
        },
      ]

      const mockQuerySnapshot = {
        docs: mockDesigns.map(design => ({
          id: design.id,
          data: () => design,
        })),
      }

      mockQuery.mockReturnValue({} as any)
      mockWhere.mockReturnValue({} as any)
      mockOrderBy.mockReturnValue({} as any)
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any)

      const result = await getUserDesigns('test-uid')

      expect(mockQuery).toHaveBeenCalled()
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'test-uid')
      expect(mockOrderBy).toHaveBeenCalledWith('metadata.updatedAt', 'desc')
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'design1',
        userId: 'test-uid',
        name: 'Design 1',
        canvasSettings: { width: 800, height: 600 },
        elements: [],
        metadata: {
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          version: 1,
        },
      })
    })
  })

  describe('saveDesign', () => {
    it('should save design with proper metadata', async () => {
      const mockDocRef = { id: 'new-design-id' }
      mockDoc.mockReturnValue(mockDocRef as any)
      mockSetDoc.mockResolvedValue(undefined)

      const designData = {
        name: 'Test Design',
        canvasSettings: { width: 800, height: 600 },
        elements: [],
      }

      const result = await saveDesign('test-uid', designData)

      expect(mockSetDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          ...designData,
          userId: 'test-uid',
          metadata: {
            createdAt: expect.any(Object), // Timestamp
            updatedAt: expect.any(Object), // Timestamp
            version: 1,
          },
        })
      )
      expect(result).toBe('new-design-id')
    })
  })

  describe('incrementUsageStats', () => {
    it('should increment usage statistics', async () => {
      const mockDocRef = { id: 'test-uid' }
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          usageStats: {
            contentGenerations: 5,
            designsCreated: 3,
            imagesUploaded: 10,
          },
        }),
      }

      mockDoc.mockReturnValue(mockDocRef as any)
      mockGetDoc.mockResolvedValue(mockUserDoc as any)
      mockUpdateDoc.mockResolvedValue(undefined)

      await incrementUsageStats('test-uid', 'contentGenerations')

      expect(mockUpdateDoc).toHaveBeenCalledWith(mockDocRef, {
        'usageStats.contentGenerations': 6,
      })
    })

    it('should handle missing user document gracefully', async () => {
      const mockDocRef = { id: 'test-uid' }
      const mockUserDoc = {
        exists: () => false,
      }

      mockDoc.mockReturnValue(mockDocRef as any)
      mockGetDoc.mockResolvedValue(mockUserDoc as any)

      // Should not throw error
      await incrementUsageStats('test-uid', 'contentGenerations')

      // Should not call updateDoc
      expect(mockUpdateDoc).not.toHaveBeenCalled()
    })
  })
})