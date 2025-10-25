import { NextResponse } from 'next/server';

/**
 * Detailed OAuth2 debugging endpoint
 * Shows exactly what's happening during token acquisition
 */
export async function GET() {
  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
  
  const debug = {
    step1_envCheck: {},
    step2_tokenRequest: {},
    step3_diagnosis: {}
  };

  // Step 1: Check environment variables
  debug.step1_envCheck = {
    clientIdExists: !!clientId,
    clientIdValue: clientId || 'NOT SET',
    clientIdLength: clientId?.length || 0,
    clientIdHasSpaces: clientId ? /\s/.test(clientId) : false,
    clientIdTrimmed: clientId ? clientId.trim() === clientId : false,
    
    clientSecretExists: !!clientSecret,
    clientSecretLength: clientSecret?.length || 0,
    clientSecretHasSpaces: clientSecret ? /\s/.test(clientSecret) : false,
    clientSecretTrimmed: clientSecret ? clientSecret.trim() === clientSecret : false,
    clientSecretPreview: clientSecret 
      ? clientSecret.substring(0, 8) + '...' + clientSecret.substring(clientSecret.length - 4)
      : 'NOT SET'
  };

  if (!clientId || !clientSecret) {
    return NextResponse.json({
      error: 'Environment variables not set',
      debug
    }, { status: 400 });
  }

  // Step 2: Try to get OAuth2 token with detailed logging
  try {
    const tokenUrl = 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';
    
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId.trim(),
      client_secret: clientSecret.trim()
    });

    debug.step2_tokenRequest = {
      url: tokenUrl,
      method: 'POST',
      grantType: 'client_credentials',
      clientIdSent: clientId.trim(),
      timestamp: new Date().toISOString()
    };

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Avara-Flight-Tracker/2.0'
      },
      body: params.toString(),
      cache: 'no-store'
    });

    debug.step2_tokenRequest.status = response.status;
    debug.step2_tokenRequest.statusText = response.statusText;
    debug.step2_tokenRequest.ok = response.ok;

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
      debug.step2_tokenRequest.response = responseData;
    } catch (e) {
      debug.step2_tokenRequest.responseText = responseText;
      debug.step2_tokenRequest.parseError = 'Response is not JSON';
    }

    // Step 3: Diagnosis
    if (response.ok && responseData?.access_token) {
      debug.step3_diagnosis = {
        success: true,
        message: '✅ OAuth2 is working correctly!',
        tokenReceived: true,
        tokenLength: responseData.access_token.length,
        expiresIn: responseData.expires_in,
        recommendation: 'Your credentials are valid. The issue might be intermittent or already resolved.'
      };
    } else if (response.status === 401) {
      debug.step3_diagnosis = {
        success: false,
        message: '❌ Authentication Failed - Invalid Credentials',
        reason: 'The client_id or client_secret is incorrect',
        errorDetails: responseData?.error_description || responseData?.error || 'No error details',
        recommendations: [
          '1. Go to https://opensky-network.org/my-opensky',
          '2. Verify your API client is listed and active',
          '3. If needed, regenerate your client secret',
          '4. Copy the EXACT values (no extra spaces)',
          '5. Update Vercel environment variables',
          '6. Redeploy'
        ]
      };
    } else if (response.status === 400) {
      debug.step3_diagnosis = {
        success: false,
        message: '❌ Bad Request - Invalid OAuth2 Parameters',
        reason: 'The OAuth2 request format is incorrect',
        errorDetails: responseData?.error_description || responseData?.error || 'No error details',
        recommendations: [
          'This usually means the client_id format is wrong',
          'Client ID should be in format: email@domain.com-api-client',
          'Check for extra characters or spaces'
        ]
      };
    } else {
      debug.step3_diagnosis = {
        success: false,
        message: `❌ Unexpected Error - Status ${response.status}`,
        errorDetails: responseData?.error_description || responseData?.error || responseText,
        recommendation: 'Check OpenSky Network status or try again later'
      };
    }

    return NextResponse.json(debug, {
      status: response.ok ? 200 : response.status
    });

  } catch (error) {
    debug.step2_tokenRequest.error = error.message;
    debug.step3_diagnosis = {
      success: false,
      message: '❌ Network Error',
      error: error.message,
      recommendation: 'Check network connectivity or OpenSky service status'
    };

    return NextResponse.json(debug, { status: 500 });
  }
}

