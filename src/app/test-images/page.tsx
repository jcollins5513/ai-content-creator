'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth';
import { ImageLibrary } from '@/components/image-library';

export default function TestImagesPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Image Library Test</h1>
            <p className="mt-2 text-gray-600">
              Test the image upload and management functionality.
            </p>
          </div>
          
          <ImageLibrary
            onImageSelect={(image) => {
              console.log('Selected image:', image);
            }}
            multiSelect={true}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}