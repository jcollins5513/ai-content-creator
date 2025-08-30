'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function UserProfile() {
  const { user, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = (email: string, displayName?: string) => {
    if (displayName) {
      return displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {getInitials(user.email, user.displayName)}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900">
            {user.displayName || 'User'}
          </p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-4 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">
                {user.displayName || 'User'}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
              <div className="mt-2 flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  user.subscriptionPlan === 'premium' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.subscriptionPlan === 'premium' ? 'Premium' : 'Free'}
                </span>
              </div>
            </div>
            
            <div className="p-2">
              <div className="px-3 py-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
                Usage Stats
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between px-3 py-1">
                  <span>Content Generated:</span>
                  <span>{user.usageStats.contentGenerations}</span>
                </div>
                <div className="flex justify-between px-3 py-1">
                  <span>Designs Created:</span>
                  <span>{user.usageStats.designsCreated}</span>
                </div>
                <div className="flex justify-between px-3 py-1">
                  <span>Images Uploaded:</span>
                  <span>{user.usageStats.imagesUploaded}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 p-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}