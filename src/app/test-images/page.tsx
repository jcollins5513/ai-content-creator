'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth';
import { ImageLibrary } from '@/components/image-library';
import Link from 'next/link';

export default function TestImagesPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <Link href="/dashboard" className="text-xl font-semibold text-gray-900">
                  AI Content Creator
                </Link>
                <nav className="hidden md:flex space-x-6">
                  <Link 
                    href="/dashboard" 
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/template-generator" 
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Template Generator
                  </Link>
                  <span className="text-blue-600 font-medium">Image Library</span>
                </nav>
              </div>
            </div>
          </div>
        </header>

        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Image Library</h1>
              <p className="mt-2 text-gray-600">
                Upload, organize, and manage your image collection.
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
      </div>
    </ProtectedRoute>
  );
}