/**
 * Map overlay components (info panel, controls)
 */

'use client';

import { memo } from 'react';
import { Z_INDEX } from './constants.jsx';

/**
 * Status icon components
 */
const CachedIcon = () => (
  <svg className="h-4 w-4 inline-block" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
  </svg>
);

const InterpolatedIcon = () => (
  <svg className="h-4 w-4 inline-block" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.415 1.414 5 5 0 010-7.07 1 1 0 011.415 0zm4.242 0a1 1 0 011.415 0 5 5 0 010 7.072 1 1 0 01-1.415-1.415 3 3 0 000-4.242 1 1 0 010-1.415zM10 9a1 1 0 011 1v.01a1 1 0 11-2 0V10a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

const LiveIcon = () => (
  <svg className="h-4 w-4 inline-block" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const LoadingIcon = () => (
  <svg className="h-4 w-4 inline-block animate-spin" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
  </svg>
);

/**
 * Info overlay showing flight statistics
 */
export const MapInfoOverlay = memo(({ totalFlights, lastUpdate, dataSource }) => {
  // Get data source badge info with proper icon components
  const getSourceBadge = (source) => {
    if (!source) return { 
      icon: <LoadingIcon />, 
      text: 'Loading', 
      color: 'text-gray-400' 
    };
    
    // Check for authenticated OpenSky access
    if (source.includes('authenticated')) {
      return { 
        icon: <LiveIcon />, 
        text: 'Live (Authenticated)', 
        color: 'text-green-400' 
      };
    }
    
    // Check for anonymous OpenSky access
    if (source.includes('anonymous')) {
      return { 
        icon: <LiveIcon />, 
        text: 'Live (Anonymous)', 
        color: 'text-blue-400' 
      };
    }
    
    // Check for cached data
    if (source.includes('cache')) {
      return { 
        icon: <CachedIcon />, 
        text: 'Cached', 
        color: 'text-yellow-400' 
      };
    }
    
    // Check for interpolated data
    if (source.includes('interpolated')) {
      return { 
        icon: <InterpolatedIcon />, 
        text: 'Interpolated', 
        color: 'text-purple-400' 
      };
    }
    
    // Default fallback
    return { 
      icon: <LiveIcon />, 
      text: source, 
      color: 'text-blue-400' 
    };
  };
  
  const sourceBadge = getSourceBadge(dataSource);
  
  return (
    <div 
      className="absolute top-4 left-4 bg-zinc-900/90 backdrop-blur-sm text-white px-6 py-4 rounded-lg shadow-xl border border-zinc-700"
      style={{ zIndex: Z_INDEX.OVERLAY }}
    >
      <h2 className="text-xl font-bold mb-2">Avara Flight Tracker</h2>
      <h2 className="text-xl font-bold mb-2">Version 11/26/25</h2>
      <div className="space-y-1 text-sm">
        <p>
          <span className="text-zinc-400">Total Flights:</span>{' '}
          <span className="font-semibold text-blue-400">{totalFlights.toLocaleString()}</span>
        </p>
        <p>
          <span className="text-zinc-400">Last Update:</span>{' '}
          <span className="font-semibold">{lastUpdate?.toLocaleTimeString()}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <span className="text-zinc-400">Status:</span>{' '}
          <span className={`font-semibold ${sourceBadge.color} flex items-center gap-1.5`}>
            {sourceBadge.icon}
            {sourceBadge.text}
          </span>
        </p>
      </div>
    </div>
  );
});

MapInfoOverlay.displayName = 'MapInfoOverlay';

/**
 * Refresh button component
 */
export const RefreshButton = memo(({ onRefresh }) => (
  <button
    onClick={onRefresh}
    className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-xl transition-colors flex items-center gap-2"
    style={{ zIndex: Z_INDEX.OVERLAY }}
    aria-label="Refresh flight data"
  >
    <RefreshIcon />
    Refresh
  </button>
));

RefreshButton.displayName = 'RefreshButton';

/**
 * Refresh icon SVG
 */
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
  </svg>
);

