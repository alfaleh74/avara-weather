import { NextResponse } from 'next/server';

/**
 * Complete credential verification endpoint
 * Tests everything step-by-step
 */
export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'local',
    checks: []
  };

  // Check 1: Environment variables exist
  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
  
  results.checks.push({
    step: 1,
    name: 'Environment Variables',
    passed: !!(clientId && clientSecret),
    details: {
      clientId: clientId || '❌ NOT SET',
      clientIdLength: clientId?.length || 0,
      clientSecretLength: clientSecret?.length || 0,
      clientSecretPreview: clientSecret 
        ? `${clientSecret.substring(0, 6)}...${clientSecret.substring(clientSecret.length - 4)}`
        : '❌ NOT SET'
    }
  });

  if (!clientId || !clientSecret) {
    results.overallStatus = '❌ FAILED - Environment variables not set';
    return NextResponse.json(results, { status: 500 });
  }

  // Check 2: No extra whitespace
  const hasWhitespace = clientId !== clientId.trim() || clientSecret !== clientSecret.trim();
  results.checks.push({
    step: 2,
    name: 'Whitespace Check',
    passed: !hasWhitespace,
    details: {
      clientIdTrimmed: clientId === clientId.trim(),
      clientSecretTrimmed: clientSecret === clientSecret.trim(),
      warning: hasWhitespace ? '⚠️ Extra spaces detected! This will cause authentication to fail.' : '✅ No extra spaces'
    }
  });

  // Check 3: OAuth2 Token Request
  try {
    const tokenUrl = 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';
    
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId.trim(),
      client_secret: clientSecret.trim()
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Avara-Flight-Tracker/2.0'
      },
      body: params.toString(),
      cache: 'no-store'
    });

    const tokenText = await tokenResponse.text();
    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch (e) {
      tokenData = { raw: tokenText };
    }

    const tokenCheckPassed = tokenResponse.ok && tokenData.access_token;
    
    results.checks.push({
      step: 3,
      name: 'OAuth2 Token Request',
      passed: tokenCheckPassed,
      details: {
        httpStatus: tokenResponse.status,
        statusText: tokenResponse.statusText,
        tokenReceived: !!tokenData.access_token,
        expiresIn: tokenData.expires_in,
        error: tokenData.error,
        errorDescription: tokenData.error_description,
        fullResponse: tokenData
      }
    });

    if (!tokenCheckPassed) {
      results.overallStatus = '❌ FAILED - Cannot obtain OAuth2 token';
      results.actionRequired = [
        '1. Go to https://opensky-network.org/my-opensky',
        '2. Verify your API client exists and is ACTIVE',
        '3. If needed, regenerate your credentials',
        '4. Copy the EXACT values (watch for spaces!)',
        '5. Update Vercel environment variables',
        '6. Wait 30 seconds, then redeploy'
      ];
      return NextResponse.json(results, { status: 401 });
    }

    // Check 4: Test API Access
    const apiResponse = await fetch('https://opensky-network.org/api/states/all', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json',
        'User-Agent': 'Avara-Flight-Tracker/2.0'
      },
      cache: 'no-store'
    });

    const apiCheckPassed = apiResponse.ok;
    
    results.checks.push({
      step: 4,
      name: 'OpenSky API Access',
      passed: apiCheckPassed,
      details: {
        httpStatus: apiResponse.status,
        statusText: apiResponse.statusText,
        authenticated: apiResponse.ok,
        rateLimit: apiResponse.ok ? '✅ 400+ requests/day available' : '❌ Access denied'
      }
    });

    if (apiCheckPassed) {
      results.overallStatus = '✅ SUCCESS - Everything is working!';
      results.message = 'Your OAuth2 authentication is configured correctly and working.';
    } else {
      results.overallStatus = '⚠️ PARTIAL - Token obtained but API access denied';
      results.actionRequired = [
        'Token was obtained successfully, but API access was denied.',
        'This is unusual. Possible causes:',
        '- API client permissions issue',
        '- OpenSky Network service issue',
        'Try again in a few minutes or contact OpenSky support.'
      ];
    }

    return NextResponse.json(results, {
      status: apiCheckPassed ? 200 : 403
    });

  } catch (error) {
    results.checks.push({
      step: 3,
      name: 'OAuth2 Token Request',
      passed: false,
      details: {
        error: error.message,
        type: error.name
      }
    });

    results.overallStatus = '❌ FAILED - Network or server error';
    results.actionRequired = [
      'Network error occurred. Possible causes:',
      '- OpenSky authentication server is down',
      '- Network connectivity issue on Vercel',
      '- Firewall or DNS issue',
      'Try again in a few minutes.'
    ];

    return NextResponse.json(results, { status: 500 });
  }
}

