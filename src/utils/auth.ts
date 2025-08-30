/**
 * Authentication utility functions
 */

/**
 * Clear any cached user data from localStorage/sessionStorage
 * This ensures complete session cleanup on logout
 */
export const clearUserSession = (): void => {
  // Clear any cached user data
  if (typeof window !== 'undefined') {
    // Clear localStorage items related to user session
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith('firebase:') || 
      key.startsWith('user:') ||
      key.startsWith('auth:')
    );
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear sessionStorage items related to user session
    const sessionKeysToRemove = Object.keys(sessionStorage).filter(key => 
      key.startsWith('firebase:') || 
      key.startsWith('user:') ||
      key.startsWith('auth:')
    );
    
    sessionKeysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
    });
  }
};

/**
 * Check if a route requires authentication
 */
export const isProtectedRoute = (pathname: string): boolean => {
  const protectedRoutes = [
    '/dashboard',
    '/editor',
    '/images',
    '/templates',
    '/designs',
    '/profile'
  ];
  
  return protectedRoutes.some(route => pathname.startsWith(route));
};

/**
 * Check if a route should redirect authenticated users
 */
export const isPublicRoute = (pathname: string): boolean => {
  const publicRoutes = [
    '/auth',
    '/login',
    '/signup'
  ];
  
  return publicRoutes.some(route => pathname.startsWith(route));
};