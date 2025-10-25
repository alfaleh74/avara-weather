import { NextResponse } from 'next/server';
import { getAuthHeaders, getAccessToken } from '@/lib/opensky-oauth';

/**
 * Test endpoint to verify OpenSky OAuth2 credentials
 * This endpoint tests the authentication without affecting rate limits
 * Now uses OAuth2 Client Credentials Flow instead of Basic Auth
 */

// Force Node.js runtime for better external API compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const clientId = process.env.OPENSKY_CLIENT_ID;
    const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({
        authenticated: false,
        authType: 'OAuth2',
        message: 'No OpenSky OAuth2 credentials found in environment variables',
        hint: 'Add OPENSKY_CLIENT_ID and OPENSKY_CLIENT_SECRET to .env.local',
        setup: {
          clientIdFormat: 'your-email@example.com-api-client',
          getCredentials: 'Visit https://opensky-network.org/my-opensky to get your API client credentials'
        }
      });
    }
    
    console.log('[Auth Test] Testing OAuth2 credentials for client:', clientId);
    
    // First, test token acquisition
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      return NextResponse.json({
        authenticated: false,
        authType: 'OAuth2',
        clientId: clientId,
        message: '❌ Failed to obtain OAuth2 access token',
        possibleReasons: [
          'Invalid client ID or client secret',
          'API client not activated in OpenSky Network',
          'Network connectivity issues',
          'OpenSky OAuth2 service unavailable'
        ],
        help: 'Please verify your API client credentials at https://opensky-network.org/my-opensky'
      }, { status: 401 });
    }
    
    console.log('[Auth Test] Successfully obtained access token, testing API access...');
    
    // Test the token with a real API call
    // Use the /states/own endpoint which requires authentication
    const testUrl = 'https://opensky-network.org/api/states/own';
    const headers = await getAuthHeaders();
    
    const response = await fetch(testUrl, {
      headers,
      cache: 'no-store'
    });
    
    console.log('[Auth Test] API Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        authenticated: true,
        authType: 'OAuth2',
        clientId: clientId,
        status: response.status,
        message: '✅ OAuth2 authentication successful!',
        rateLimit: 'You have access to 400+ requests/day as an authenticated user.',
        statesReceived: data.states?.length || 0,
        info: 'Using OAuth2 Client Credentials Flow (recommended)'
      });
    } else if (response.status === 401) {
      return NextResponse.json({
        authenticated: false,
        authType: 'OAuth2',
        clientId: clientId,
        status: response.status,
        message: '❌ OAuth2 token was rejected by API',
        possibleReasons: [
          'Token expired (automatic retry should work)',
          'API client permissions insufficient',
          'Client credentials changed or revoked'
        ],
        help: 'Please verify your API client status at https://opensky-network.org/my-opensky'
      }, { status: 401 });
    } else {
      const errorText = await response.text();
      return NextResponse.json({
        authenticated: false,
        authType: 'OAuth2',
        clientId: clientId,
        status: response.status,
        message: `OpenSky API returned status ${response.status}`,
        details: errorText
      }, { status: response.status });
    }
    
  } catch (error) {
    console.error('[Auth Test] Error:', error);
    return NextResponse.json({
      error: 'Test failed',
      message: error.message,
      authType: 'OAuth2'
    }, { status: 500 });
  }
}

