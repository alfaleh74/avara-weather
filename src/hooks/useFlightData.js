/**
 * Custom hook for managing flight data fetching
 * Simplified - no caching, just background fetching without blocking UI
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { API_ENDPOINTS, PERFORMANCE_CONFIG } from '../components/map/constants.jsx';

/**
 * Hook to fetch and manage flight data - simplified for smooth performance
 * Fetching happens in background without blocking map interactions
 * @returns {Object} Flight data state and controls
 */
export const useFlightData = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dataSource, setDataSource] = useState(null);
  const abortControllerRef = useRef(null);
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);

  /**
   * Fetch flights from API - runs in background
   * Non-blocking - updates happen without interrupting UI
   */
  const fetchFlights = useCallback(async (bounds = null, showLoading = false, zoom = null) => {
    // Skip if already fetching to prevent duplicate requests
    if (isFetchingRef.current) {
      console.log('[useFlightData] Fetch already in progress, skipping');
      return;
    }
    
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    isFetchingRef.current = true;
    
    // Only show loading on initial fetch
    if (showLoading && flights.length === 0) {
      setLoading(true);
    }
    setError(null);
    
    try {
      console.log('[useFlightData] Fetching flight data...');
      
      // Fetch from API
      const response = await fetch(API_ENDPOINTS.FLIGHTS, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`[useFlightData] Fetched ${data.flights.length} flights`);
      
      if (!mountedRef.current) return;
      
      // Update state without blocking
      setFlights(data.flights);
      setLastUpdate(new Date());
      setDataSource(data.source || 'api');
      setLoading(false);
      
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[useFlightData] Request aborted');
        return;
      }
      
      console.error('[useFlightData] Error fetching flights:', err);
      
      if (mountedRef.current) {
        setError(err.message);
        setLoading(false);
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [flights.length]);

  // Initialize on mount and set up polling
  useEffect(() => {
    mountedRef.current = true;
    
    // Initial fetch
    fetchFlights(null, true, null);
    
    // Set up periodic refresh without blocking map
    const fetchInterval = setInterval(() => {
      fetchFlights(null, false, null);
    }, PERFORMANCE_CONFIG.FETCH_INTERVAL);
    
    return () => {
      mountedRef.current = false;
      clearInterval(fetchInterval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return {
    flights,
    loading,
    error,
    lastUpdate,
    dataSource,
    fetchFlights,
  };
};
