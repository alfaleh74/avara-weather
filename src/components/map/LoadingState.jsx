/**
 * Loading and error state components
 */

'use client';

import { memo } from 'react';

/**
 * Loading spinner component
 */
export const LoadingState = memo(() => (
  <div className="flex items-center justify-center h-screen bg-zinc-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-white text-lg">Loading flight data...</p>
    </div>
  </div>
));

LoadingState.displayName = 'LoadingState';

/**
 * Error state component
 */
export const ErrorState = memo(({ error, onRetry }) => (
  <div className="flex items-center justify-center h-screen bg-zinc-900">
    <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 max-w-md">
      <p className="text-red-500 text-lg font-semibold mb-2">Error loading flights</p>
      <p className="text-red-400">{error}</p>
      <button 
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
      >
        Retry
      </button>
    </div>
  </div>
));

ErrorState.displayName = 'ErrorState';

