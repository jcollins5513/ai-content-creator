// Simple test to verify Jest setup
describe('Jest Setup', () => {
  it('should run tests', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have access to global test utilities', () => {
    expect(global.mockUser).toBeDefined()
    expect(global.mockFirestoreDoc).toBeDefined()
    expect(global.mockFirestoreCollection).toBeDefined()
  })
})