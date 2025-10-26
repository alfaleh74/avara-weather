/**
 * In-memory flight data cache for serverless environments
 * This cache stores flight data fetched by the background cron job
 * and serves it to client requests for better performance and stability
 */

// In-memory cache
let cachedFlightData = null;
let lastUpdateTime = null;

// Cache configuration
const CACHE_DURATION_MS = 10000; // 10 seconds - how long cache is considered fresh
const MAX_CACHE_AGE_MS = 60000; // 60 seconds - maximum age before cache is considered stale

/**
 * Store flight data in cache
 * @param {Object} data - Flight data to cache
 */
export function setCachedFlights(data) {
  cachedFlightData = {
    flights: data.flights,
    time: data.time,
    count: data.count,
    source: data.source,
    cachedAt: Date.now()
  };
  lastUpdateTime = Date.now();
  console.log(`[Flight Cache] Cached ${data.count} flights at ${new Date(lastUpdateTime).toISOString()}`);
}

/**
 * Get cached flight data
 * @returns {Object|null} Cached flight data or null if no cache exists
 */
export function getCachedFlights() {
  if (!cachedFlightData) {
    console.log('[Flight Cache] No cached data available');
    return null;
  }

  const age = Date.now() - lastUpdateTime;
  const ageSeconds = Math.round(age / 1000);
  
  console.log(`[Flight Cache] Serving cached data (age: ${ageSeconds}s, ${cachedFlightData.count} flights)`);
  
  return {
    ...cachedFlightData,
    cacheAge: age,
    cacheAgeSeconds: ageSeconds,
    isFresh: age < CACHE_DURATION_MS,
    isStale: age > MAX_CACHE_AGE_MS
  };
}

/**
 * Check if cache exists and is not too old
 * @returns {boolean}
 */
export function hasFreshCache() {
  if (!cachedFlightData || !lastUpdateTime) {
    return false;
  }
  
  const age = Date.now() - lastUpdateTime;
  return age < MAX_CACHE_AGE_MS;
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
  return {
    hasCachedData: cachedFlightData !== null,
    lastUpdateTime: lastUpdateTime,
    lastUpdateISO: lastUpdateTime ? new Date(lastUpdateTime).toISOString() : null,
    cacheAge: lastUpdateTime ? Date.now() - lastUpdateTime : null,
    flightCount: cachedFlightData?.count || 0,
    isFresh: hasFreshCache()
  };
}

/**
 * Clear the cache (useful for testing or maintenance)
 */
export function clearCache() {
  console.log('[Flight Cache] Clearing cache');
  cachedFlightData = null;
  lastUpdateTime = null;
}

