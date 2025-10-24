'use client';

/**
 * Main FlightMap component
 * Orchestrates all map functionality with optimized sub-components
 * Map interactions now decoupled from flight data for better performance
 */

import { useCallback } from 'react';
import { useFlightData } from '../hooks/useFlightData.js';
import { LoadingState, ErrorState } from './map/LoadingState.jsx';
import { MapInfoOverlay, RefreshButton } from './map/MapOverlay.jsx';
import MapLibreContainer from './map/MapLibreContainer.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';

/**
 * FlightMap - Main component for rendering flight tracking map
 * @param {Object} props
 * @param {Function} props.onFlightSelect - Callback when a flight is selected
 */
export default function FlightMap({ onFlightSelect }) {
  // Polling-based flight data (decoupled from map state)
  const { flights, loading, error, lastUpdate, dataSource, fetchFlights } = useFlightData();

  // Handle manual refresh (without showing loading screen)
  const handleRefresh = useCallback(() => {
    fetchFlights(null, false, null);
  }, [fetchFlights]);

  // Show loading state (only on initial load)
  if (loading && flights.length === 0) {
    return <LoadingState />;
  }

  // Show error state
  if (error) {
    return <ErrorState error={error} onRetry={fetchFlights} />;
  }

  // Render main map view with error boundary
  // MapLibre uses canvas rendering for optimal performance with many markers
  return (
    <ErrorBoundary>
      <div className="relative w-full h-screen">
        <MapInfoOverlay 
          totalFlights={flights.length}
          lastUpdate={lastUpdate}
          dataSource={dataSource}
        />
        
        <RefreshButton onRefresh={handleRefresh} />
        
        <MapLibreContainer
          flights={flights}
          onFlightSelect={onFlightSelect}
        />
      </div>
    </ErrorBoundary>
  );
}
