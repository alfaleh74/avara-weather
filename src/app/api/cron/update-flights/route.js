import { NextResponse } from 'next/server';
import { getAuthHeaders } from '@/lib/opensky-oauth';
import { setCachedFlights } from '@/lib/flight-cache';

/**
 * Background cron job endpoint to fetch and cache flight data
 * This endpoint is called periodically by Vercel Cron Jobs
 * 
 * Security: Vercel cron jobs include an Authorization header that you can verify
 * The header format is: Authorization: Bearer <CRON_SECRET>
 */

export const runtime = 'edge'; // Use edge runtime for faster cold starts
export const maxDuration = 30; // Maximum execution time in seconds

export async function GET(request) {
  const startTime = Date.now();
  
  try {
    // Verify the request is from Vercel Cron (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // If CRON_SECRET is set, verify it
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Cron] Unauthorized cron job request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting background flight data fetch...');

    // Build the OpenSky API URL (fetch all flights, no bounding box)
    const apiUrl = 'https://opensky-network.org/api/states/all';
    
    // Get headers with OAuth2 authentication
    const headers = await getAuthHeaders();
    const hasAuth = headers.Authorization !== undefined;
    
    console.log(`[Cron] Fetching from OpenSky API (${hasAuth ? 'authenticated' : 'anonymous'})...`);
    
    // Fetch data from OpenSky Network API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
    
    let response;
    try {
      response = await fetch(apiUrl, {
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('[Cron] Request timed out after 25 seconds');
        throw new Error('OpenSky API request timed out');
      }
      throw fetchError;
    }

    // Handle 401 with token refresh retry
    if (response.status === 401 && hasAuth) {
      console.warn('[Cron] Received 401, attempting token refresh and retry');
      const { clearTokenCache, getAuthHeaders: getHeaders } = await import('@/lib/opensky-oauth');
      clearTokenCache();
      const retryHeaders = await getHeaders();
      const retryController = new AbortController();
      const retryTimeoutId = setTimeout(() => retryController.abort(), 25000);
      
      try {
        response = await fetch(apiUrl, {
          headers: retryHeaders,
          signal: retryController.signal
        });
        clearTimeout(retryTimeoutId);
      } catch (retryError) {
        clearTimeout(retryTimeoutId);
        throw retryError;
      }
    }
    
    if (!response.ok) {
      console.error(`[Cron] OpenSky API error: ${response.status} ${response.statusText}`);
      throw new Error(`OpenSky API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform the response
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
    
    // Cache the flight data
    const cacheData = {
      flights,
      time: data.time,
      count: flights.length,
      source: hasAuth ? 'opensky-authenticated' : 'opensky-anonymous'
    };
    
    setCachedFlights(cacheData);
    
    const duration = Date.now() - startTime;
    console.log(`[Cron] Successfully cached ${flights.length} flights in ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      flightCount: flights.length,
      duration: duration,
      timestamp: new Date().toISOString(),
      source: hasAuth ? 'opensky-authenticated' : 'opensky-anonymous'
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Cron] Error updating flight cache:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update flight cache', 
        details: error.message,
        duration: duration
      },
      { status: 500 }
    );
  }
}

