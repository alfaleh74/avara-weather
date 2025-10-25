/**
 * OpenSky Network OAuth2 Client Credentials Flow
 * Documentation: https://openskynetwork.github.io/opensky-api/rest.html#oauth2-client-credentials-flow
 */

// In-memory token cache
let cachedToken = null;
let tokenExpiry = null;

/**
 * Get a valid access token using OAuth2 Client Credentials Flow
 * Implements token caching to minimize token requests
 */
export async function getAccessToken() {
  // Return cached token if still valid (with 5 minute buffer)
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry - 5 * 60 * 1000) {
    console.log('[OpenSky OAuth2] Using cached access token');
    return cachedToken;
  }

  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('[OpenSky OAuth2] No OAuth2 credentials found. Add OPENSKY_CLIENT_ID and OPENSKY_CLIENT_SECRET to .env.local');
    return null;
  }

  try {
    console.log('[OpenSky OAuth2] Requesting new access token for client:', clientId);

    // OAuth2 token endpoint (OpenID Connect)
    // OpenSky Network uses Keycloak for authentication
    const tokenUrl = 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';

    // Prepare request body for client credentials grant
    // Client ID and secret are passed as form data, not in Authorization header
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId.trim(),
      client_secret: clientSecret.trim()
    });

    // Add timeout and retry logic for Vercel serverless environment
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    let response;
    try {
      response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Avara-Flight-Tracker/2.0',
          'Accept': 'application/json'
        },
        body: params.toString(),
        cache: 'no-store',
        signal: controller.signal,
        // Additional options for better compatibility
        keepalive: true
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('[OpenSky OAuth2] Fetch failed:', fetchError.message);
      console.error('[OpenSky OAuth2] Error details:', {
        name: fetchError.name,
        code: fetchError.code,
        cause: fetchError.cause
      });
      throw new Error(`Network request failed: ${fetchError.message}. This may be a temporary connectivity issue.`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenSky OAuth2] Token request failed:', response.status, errorText);
      throw new Error(`OAuth2 token request failed: ${response.status} ${errorText}`);
    }

    const tokenData = await response.json();
    
    if (!tokenData.access_token) {
      throw new Error('No access_token in OAuth2 response');
    }

    // Cache the token
    cachedToken = tokenData.access_token;
    
    // Calculate expiry time (default to 1 hour if not provided)
    const expiresIn = tokenData.expires_in || 3600; // seconds
    tokenExpiry = Date.now() + (expiresIn * 1000);

    console.log('[OpenSky OAuth2] Successfully obtained access token (expires in', expiresIn, 'seconds)');
    
    return cachedToken;

  } catch (error) {
    console.error('[OpenSky OAuth2] Error obtaining access token:', error.message);
    // Clear cache on error
    cachedToken = null;
    tokenExpiry = null;
    return null;
  }
}

/**
 * Get headers for authenticated OpenSky API requests
 * Automatically handles OAuth2 token retrieval
 */
export async function getAuthHeaders() {
  const baseHeaders = {
    'Accept': 'application/json',
    'User-Agent': 'Avara-Flight-Tracker/2.0'
  };

  const accessToken = await getAccessToken();
  
  if (accessToken) {
    console.log('[OpenSky OAuth2] Using OAuth2 Bearer token authentication');
    return {
      ...baseHeaders,
      'Authorization': `Bearer ${accessToken}`
    };
  }

  console.log('[OpenSky OAuth2] No authentication available (anonymous access)');
  return baseHeaders;
}

/**
 * Clear the cached token (useful for testing or error recovery)
 */
export function clearTokenCache() {
  console.log('[OpenSky OAuth2] Clearing token cache');
  cachedToken = null;
  tokenExpiry = null;
}

