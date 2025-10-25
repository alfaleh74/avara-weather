import { NextResponse } from 'next/server';

/**
 * Debug endpoint to check environment variables
 * This helps diagnose why auth works locally but not on Vercel
 */

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
  
  // Check if variables exist and show partial values for security
  const maskSecret = (value) => {
    if (!value) return 'NOT SET';
    if (value.length <= 8) return '***';
    return value.substring(0, 4) + '***' + value.substring(value.length - 4);
  };

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    vercel: process.env.VERCEL ? 'YES - Running on Vercel' : 'NO - Running locally',
    vercelEnv: process.env.VERCEL_ENV || 'Not on Vercel',
    envVariables: {
      OPENSKY_CLIENT_ID: {
        exists: !!clientId,
        value: clientId || 'NOT SET',
        length: clientId?.length || 0,
        hasSpaces: clientId ? /\s/.test(clientId) : false,
      },
      OPENSKY_CLIENT_SECRET: {
        exists: !!clientSecret,
        value: maskSecret(clientSecret),
        length: clientSecret?.length || 0,
        hasSpaces: clientSecret ? /\s/.test(clientSecret) : false,
      }
    },
    diagnosis: {
      bothSet: !!(clientId && clientSecret),
      recommendation: !clientId || !clientSecret 
        ? '❌ Environment variables are NOT set. Go to Vercel Dashboard → Settings → Environment Variables and add them.'
        : '✅ Environment variables are detected. If auth still fails, check the test-auth endpoint.'
    },
    nextSteps: [
      '1. Visit your Vercel Dashboard',
      '2. Go to Settings → Environment Variables',
      '3. Add OPENSKY_CLIENT_ID and OPENSKY_CLIENT_SECRET',
      '4. Make sure to select Production, Preview, and Development',
      '5. Redeploy your application after adding variables',
      '6. Visit /api/test-auth to verify authentication'
    ]
  });
}

