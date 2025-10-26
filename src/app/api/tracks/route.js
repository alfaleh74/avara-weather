import { NextResponse } from 'next/server';
import { getAuthHeaders } from '@/lib/opensky-oauth';

/**
 * OpenSky Network Flight Track API endpoint
 * Fetches the historical track/path of a specific aircraft
 * 
 * API Documentation: https://openskynetwork.github.io/opensky-api/rest.html#track-by-aircraft
 * 
 * Query parameters:
 * - icao24: ICAO24 address of the aircraft (required)
 * - time: Unix timestamp to get track from (optional, defaults to most recent)
 */

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get ICAO24 parameter (required)
    const icao24 = searchParams.get('icao24');
    
    if (!icao24) {
      return NextResponse.json(
        { error: 'icao24 parameter is required' },
        { status: 400 }
      );
    }
    
    // Get time parameter (optional, 0 means most recent)
    const time = searchParams.get('time') || '0';
    
    // Build the API URL
    const apiUrl = `https://opensky-network.org/api/tracks/all?icao24=${icao24}&time=${time}`;
    
    // Get headers with OAuth2 authentication
    const headers = await getAuthHeaders();
    
    const hasAuth = headers.Authorization !== undefined;
    console.log(`[Track API] Fetching track for ${icao24} (${hasAuth ? 'authenticated' : 'anonymous'})`);
    
    // Fetch data from OpenSky Network API
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
        console.error('[Track API] Request timed out after 30 seconds');
        throw new Error('OpenSky API request timed out');
      }
      throw fetchError;
    }

    // Handle 401 with token refresh retry
    if (response.status === 401 && hasAuth) {
      console.warn('[Track API] Received 401, attempting token refresh and retry');
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
      console.error(`[Track API] OpenSky API error: ${response.status} ${response.statusText}`);
      
      let errorMessage = `OpenSky API returned ${response.status}`;
      if (response.status === 404) {
        errorMessage = 'No track data available for this aircraft';
      } else if (response.status === 429) {
        errorMessage = hasAuth
          ? 'Rate limit exceeded. Try again later.'
          : 'Rate limit exceeded. Configure authentication for higher limits.';
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log(`[Track API] Successfully fetched track with ${data.path?.length || 0} waypoints`);
    
    // Transform the track data to a more usable format
    // Track path is an array of [time, latitude, longitude, baro_altitude, true_track, on_ground]
    const track = {
      icao24: data.icao24,
      callsign: data.callsign,
      startTime: data.startTime,
      endTime: data.endTime,
      path: data.path ? data.path.map(point => ({
        time: point[0],
        latitude: point[1],
        longitude: point[2],
        baro_altitude: point[3],
        true_track: point[4],
        on_ground: point[5]
      })).filter(point => 
        point.latitude !== null && 
        point.longitude !== null
      ) : []
    };
    
    return NextResponse.json(
      {
        track,
        source: hasAuth ? 'opensky-authenticated' : 'opensky-anonymous'
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300', // Cache tracks for 5 minutes
        }
      }
    );
    
  } catch (error) {
    console.error('[Track API] Error fetching track data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch track data', details: error.message },
      { status: 500 }
    );
  }
}

