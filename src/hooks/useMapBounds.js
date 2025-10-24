/**
 * Custom hook for managing map bounds
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { throttle } from '../lib/performance.js';

/**
 * Hook to manage map viewport bounds and zoom level
 * @returns {Object} Bounds state, zoom level, and handlers
 */
export const useMapBounds = () => {
  const [mapBounds, setMapBounds] = useState(null);
  const [mapZoom, setMapZoom] = useState(null);
  
  const throttledSetBoundsAndZoom = useRef(
    throttle((bounds, zoom) => {
      setMapBounds(bounds);
      setMapZoom(zoom);
    }, 100)
  ).current;

  /**
   * Handle bounds and zoom change from map events with throttling
   */
  const handleBoundsChange = useCallback((bounds, zoom) => {
    throttledSetBoundsAndZoom(bounds, zoom);
  }, [throttledSetBoundsAndZoom]);

  return {
    mapBounds,
    mapZoom,
    handleBoundsChange,
  };
};

/**
 * Hook to filter flights by viewport bounds with expansion
 * @param {Array} flights - All flights
 * @param {Object|null} mapBounds - Current map bounds
 * @returns {Array} Flights visible in viewport
 */
export const useVisibleFlights = (flights, mapBounds) => {
  return useMemo(() => {
    if (!mapBounds || flights.length === 0) return flights;
    
    // Expand bounds slightly to include markers just outside viewport
    // This prevents flickering during panning
    const south = mapBounds.getSouth();
    const north = mapBounds.getNorth();
    const west = mapBounds.getWest();
    const east = mapBounds.getEast();
    
    const latPadding = (north - south) * 0.1; // 10% padding
    const lngPadding = (east - west) * 0.1;
    
    return flights.filter(flight => {
      const lat = flight.latitude;
      const lng = flight.longitude;
      return (
        lat >= south - latPadding &&
        lat <= north + latPadding &&
        lng >= west - lngPadding &&
        lng <= east + lngPadding
      );
    });
  }, [flights, mapBounds]);
};

