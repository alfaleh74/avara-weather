/**
 * Map overlay components (info panel, controls)
 */

'use client';

import { memo } from 'react';
import { Z_INDEX } from './constants.jsx';

/**
 * Info overlay showing flight statistics
 */
export const MapInfoOverlay = memo(({ totalFlights, lastUpdate, dataSource }) => {
  // Get data source badge info
  const getSourceBadge = (source) => {
    if (!source) return { text: 'Loading', color: 'text-gray-400' };
    
    if (source.includes('cache')) {
      return { text: '⚡ Cached', color: 'text-yellow-400' };
    } else if (source.includes('interpolated')) {
      return { text: '🎯 Interpolated', color: 'text-purple-400' };
    } else if (source.includes('api')) {
      return { text: '🔴 Live', color: 'text-green-400' };
    }
    return { text: source, color: 'text-blue-400' };
  };
  
  const sourceBadge = getSourceBadge(dataSource);
  
  return (
    <div 
      className="absolute top-4 left-4 bg-zinc-900/90 backdrop-blur-sm text-white px-6 py-4 rounded-lg shadow-xl border border-zinc-700"
      style={{ zIndex: Z_INDEX.OVERLAY }}
    >
      <h2 className="text-xl font-bold mb-2">BETA - Avara Flight Tracker</h2>
      <h2 className="text-xl font-bold mb-2">Version 11/24/25</h2>
      <div className="space-y-1 text-sm">
        <p>
          <span className="text-zinc-400">Total Flights:</span>{' '}
          <span className="font-semibold text-blue-400">{totalFlights.toLocaleString()}</span>
        </p>
        <p>
          <span className="text-zinc-400">Last Update:</span>{' '}
          <span className="font-semibold">{lastUpdate?.toLocaleTimeString()}</span>
        </p>
        <p>
          <span className="text-zinc-400">Status:</span>{' '}
          <span className={`font-semibold ${sourceBadge.color}`}>{sourceBadge.text}</span>
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

