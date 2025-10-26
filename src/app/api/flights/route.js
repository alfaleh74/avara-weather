import { NextResponse } from 'next/server';
import { getAuthHeaders } from '@/lib/opensky-oauth';

/**
 * OpenSky Network API endpoint - simplified
 * Fetches all current flight states from the OpenSky Network
 * Returns all data in single JSON response
 * 
 * API Documentation: https://openskynetwork.github.io/opensky-api/rest.html
 * Authentication: Uses OAuth2 Client Credentials Flow
 * 
 * Query parameters:
 * - lamin: minimum latitude (optional)
 * - lomin: minimum longitude (optional)
 * - lamax: maximum latitude (optional)
 * - lomax: maximum longitude (optional)
 */

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get bounding box parameters if provided
    const lamin = searchParams.get('lamin');
    const lomin = searchParams.get('lomin');
    const lamax = searchParams.get('lamax');
    const lomax = searchParams.get('lomax');
    
    // Build the API URL
    let apiUrl = 'https://opensky-network.org/api/states/all';
    
    // Add bounding box parameters if all are provided
    if (lamin && lomin && lamax && lomax) {
      apiUrl += `?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
    }
    
    // Get headers with OAuth2 authentication
    const headers = await getAuthHeaders();
    
    const hasAuth = headers.Authorization !== undefined;
    if (hasAuth) {
      console.log('[Flight API] Using OAuth2 authenticated access');
    } else {
      console.log('[Flight API] Using anonymous OpenSky access (rate limited to 100 requests/day)');
    }
    
    // Fetch data from OpenSky Network API (no caching)
    console.log('[Flight API] Fetching from OpenSky:', apiUrl);
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    let response;
    try {
      response = await fetch(apiUrl, {
        headers,
        cache: 'no-store', // Disable Next.js caching
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('[Flight API] Request timed out after 30 seconds');
        throw new Error('OpenSky API request timed out. The service may be slow or unavailable.');
      }
      throw fetchError;
    }

    // If unauthorized and we attempted OAuth2, try once to refresh token and retry
    if (response.status === 401 && hasAuth) {
      console.warn('[Flight API] Received 401, attempting token refresh and retry');
      // Lazy import to avoid circular; clear cache and retry via helper
      const { clearTokenCache, getAuthHeaders: getHeaders } = await import('@/lib/opensky-oauth');
      clearTokenCache();
      const retryHeaders = await getHeaders();
      const retryController = new AbortController();
      const retryTimeoutId = setTimeout(() => retryController.abort(), 30000);
      const retryResponse = await fetch(apiUrl, {
        headers: retryHeaders,
        cache: 'no-store',
        signal: retryController.signal
      });
      clearTimeout(retryTimeoutId);
      response = retryResponse;
    }
    
    if (!response.ok) {
      const statusText = response.statusText || 'Unknown error';
      console.error(`[Flight API] OpenSky API error: ${response.status} ${statusText}`);
      
      // Provide specific error messages for common issues
      let errorMessage = `OpenSky API returned ${response.status}`;
      if (response.status === 429) {
        errorMessage = hasAuth
          ? 'Rate limit exceeded. You may have hit your authenticated quota; try later.'
          : 'Rate limit exceeded. Anonymous users are limited to 100 requests/day. Configure OPENSKY_CLIENT_ID/OPENSKY_CLIENT_SECRET.';
      } else if (response.status === 401) {
        errorMessage = 'Authentication failed with OAuth2. Verify OPENSKY_CLIENT_ID and OPENSKY_CLIENT_SECRET.';
      } else if (response.status === 503) {
        errorMessage = 'OpenSky Network service is temporarily unavailable. Please try again later.';
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log(`[Flight API] Successfully fetched ${data.states?.length || 0} flights from OpenSky`);
    
    // Transform the response to a more usable format
    const flights = data.states ? data.states.map(state => ({
      icao24: state[0],
      callsign: state[1]?.trim(),
      origin_country: state[2],
      time_position: state[3],
      last_contact: state[4],
      longitude: state[5],
      latitude: state[6],
      baro_altitude: state[7],
      on_ground: state[8],
      velocity: state[9],
      true_track: state[10],
      vertical_rate: state[11],
      sensors: state[12],
      geo_altitude: state[13],
      squawk: state[14],
      spi: state[15],
      position_source: state[16]
    })).filter(flight => 
      flight.longitude !== null && 
      flight.latitude !== null
    ) : [];
    
    // Return simple JSON response
    return NextResponse.json(
      {
        flights,
        time: data.time,
        count: flights.length,
        source: hasAuth ? 'opensky-authenticated' : 'opensky-anonymous'
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      }
    );
    
  } catch (error) {
    console.error('Error fetching flight data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flight data', details: error.message },
      { status: 500 }
    );
  }
}

