import { isValidImageFile, isValidFileSize, generateUniqueFilename, SUPPORTED_IMAGE_TYPES, FILE_SIZE_LIMITS } from '@/lib/storage';

describe('storage utility functions', () => {
  test('isValidImageFile returns true for supported types', () => {
    SUPPORTED_IMAGE_TYPES.forEach(type => {
      const file = new File([], 'test.' + type.split('/')[1], { type });
      expect(isValidImageFile(file)).toBe(true);
    });
  });

  test('isValidImageFile returns false for unsupported types', () => {
    const file = new File([], 'test.txt', { type: 'text/plain' });
    expect(isValidImageFile(file)).toBe(false);
  });

  test('isValidFileSize respects limit', () => {
    const smallFile = new File([new Uint8Array(FILE_SIZE_LIMITS.IMAGE - 1)], 'small.png', { type: 'image/png' });
    const largeFile = new File([new Uint8Array(FILE_SIZE_LIMITS.IMAGE + 1)], 'large.png', { type: 'image/png' });
    expect(isValidFileSize(smallFile, FILE_SIZE_LIMITS.IMAGE)).toBe(true);
    expect(isValidFileSize(largeFile, FILE_SIZE_LIMITS.IMAGE)).toBe(false);
  });

  test('generateUniqueFilename preserves extension and uniqueness', () => {
    const name = 'photo.png';
    const generated1 = generateUniqueFilename(name);
    const generated2 = generateUniqueFilename(name);
    expect(generated1).not.toEqual(generated2);
    expect(generated1.endsWith('.png')).toBe(true);
    expect(generated2.endsWith('.png')).toBe(true);
  });
});
