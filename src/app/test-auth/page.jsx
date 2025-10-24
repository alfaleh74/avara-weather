'use client';

import { useState } from 'react';

export default function TestAuthPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-auth');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        error: true,
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔐 OpenSky Authentication Test</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <p className="mb-4">
            This page tests your OpenSky Network credentials to ensure they're valid
            and properly configured.
          </p>
          
          <button
            onClick={testAuth}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {loading ? 'Testing...' : 'Test Credentials'}
          </button>
        </div>

        {result && (
          <div className={`rounded-lg p-6 ${
            result.authenticated 
              ? 'bg-green-900/30 border border-green-500' 
              : 'bg-red-900/30 border border-red-500'
          }`}>
            <h2 className="text-xl font-bold mb-4">
              {result.authenticated ? '✅ Success' : '❌ Failed'}
            </h2>
            
            <div className="space-y-2">
              <p><strong>Message:</strong> {result.message}</p>
              
              {result.username && (
                <p><strong>Username:</strong> {result.username}</p>
              )}
              
              {result.status && (
                <p><strong>HTTP Status:</strong> {result.status}</p>
              )}
              
              {result.rateLimit && (
                <p className="text-green-400"><strong>Rate Limit:</strong> {result.rateLimit}</p>
              )}
              
              {result.possibleReasons && (
                <div className="mt-4">
                  <p className="font-semibold mb-2">Possible reasons:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {result.possibleReasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {result.help && (
                <p className="mt-4 text-yellow-400">
                  <strong>Help:</strong> {result.help}
                </p>
              )}
              
              {result.hint && (
                <p className="mt-4 text-yellow-400">
                  <strong>Hint:</strong> {result.hint}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-3">📝 How to fix authentication issues:</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Verify your account at <a href="https://opensky-network.org/" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">OpenSky Network</a></li>
            <li>Check your email for verification link</li>
            <li>Update credentials in <code className="bg-gray-700 px-2 py-1 rounded">.env.local</code></li>
            <li>Restart your Next.js development server</li>
            <li>Test again using this page</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

