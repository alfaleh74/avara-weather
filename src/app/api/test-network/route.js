import { NextResponse } from 'next/server';

/**
 * Network diagnostic endpoint
 * Tests connectivity to OpenSky auth server
 */

// Force Node.js runtime for better external API compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    vercelRegion: process.env.VERCEL_REGION || 'unknown',
    tests: []
  };

  // Test 1: DNS resolution
  try {
    const dnsTest = await fetch('https://auth.opensky-network.org', {
      method: 'HEAD',
      cache: 'no-store'
    });
    results.tests.push({
      name: 'DNS Resolution',
      passed: true,
      status: dnsTest.status,
      statusText: dnsTest.statusText
    });
  } catch (error) {
    results.tests.push({
      name: 'DNS Resolution',
      passed: false,
      error: error.message,
      code: error.code,
      cause: error.cause?.toString()
    });
  }

  // Test 2: Full OAuth URL
  try {
    const tokenUrl = 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';
    const oauthTest = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&client_id=test&client_secret=test',
      cache: 'no-store'
    });
    const responseText = await oauthTest.text();
    results.tests.push({
      name: 'OAuth Endpoint',
      passed: true,
      reachable: true,
      status: oauthTest.status,
      response: responseText.substring(0, 200)
    });
  } catch (error) {
    results.tests.push({
      name: 'OAuth Endpoint',
      passed: false,
      error: error.message,
      code: error.code,
      type: error.constructor.name,
      cause: error.cause?.toString()
    });
  }

  // Test 3: OpenSky API
  try {
    const apiTest = await fetch('https://opensky-network.org/api/states/all', {
      method: 'HEAD',
      cache: 'no-store'
    });
    results.tests.push({
      name: 'OpenSky API',
      passed: true,
      status: apiTest.status
    });
  } catch (error) {
    results.tests.push({
      name: 'OpenSky API',
      passed: false,
      error: error.message
    });
  }

  return NextResponse.json(results);
}

