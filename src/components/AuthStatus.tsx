'use client';

import { useAuth } from '@/hooks/useAuth';

export function AuthStatus() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700">
          Welcome, {user.displayName || user.email}
        </span>
        <button
          type="button"
          onClick={signOut}
          className="text-sm text-red-600 hover:text-red-800 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-600">
      Not signed in
    </div>
  );
}