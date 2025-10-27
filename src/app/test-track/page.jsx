'use client';

import { useState } from 'react';

export default function TestTrack() {
  const [icao24, setIcao24] = useState('');
  const [trackData, setTrackData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTrack = async () => {
    if (!icao24) {
      alert('Please enter an ICAO24 code');
      return;
    }

    setLoading(true);
    setError(null);
    setTrackData(null);

    try {
      const response = await fetch(`/api/tracks?icao24=${icao24.toLowerCase()}&time=0`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to fetch track');
      }

      setTrackData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Flight Track API Test</h1>
        
        <div className="bg-slate-800 p-6 rounded-lg mb-6">
          <label className="block mb-2 text-sm font-medium">
            Enter ICAO24 (e.g., a0b1c2, 3c6444)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={icao24}
              onChange={(e) => setIcao24(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
              placeholder="Enter ICAO24 code"
              onKeyPress={(e) => e.key === 'Enter' && fetchTrack()}
            />
            <button
              onClick={fetchTrack}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Loading...' : 'Fetch Track'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 p-4 rounded-lg mb-6">
            <h3 className="font-bold mb-1">Error:</h3>
            <p>{error}</p>
          </div>
        )}

        {trackData && (
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Track Data</h2>
            
            <div className="space-y-3 mb-6">
              <div>
                <span className="text-slate-400">ICAO24:</span>
                <span className="ml-2 font-mono">{trackData.track?.icao24 || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400">Callsign:</span>
                <span className="ml-2 font-mono">{trackData.track?.callsign || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400">Start Time:</span>
                <span className="ml-2">{trackData.track?.startTime ? new Date(trackData.track.startTime * 1000).toLocaleString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400">End Time:</span>
                <span className="ml-2">{trackData.track?.endTime ? new Date(trackData.track.endTime * 1000).toLocaleString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400">Waypoints:</span>
                <span className="ml-2 font-bold text-blue-400">{trackData.track?.path?.length || 0}</span>
              </div>
            </div>

            {trackData.track?.path && trackData.track.path.length > 0 ? (
              <div>
                <h3 className="font-bold mb-2">Sample Waypoints (first 5):</h3>
                <div className="bg-slate-900 p-4 rounded overflow-x-auto">
                  <pre className="text-xs">
                    {JSON.stringify(trackData.track.path.slice(0, 5), null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-yellow-400">
                ⚠️ No waypoints in track data
              </div>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                View Full Response
              </summary>
              <div className="bg-slate-900 p-4 rounded overflow-x-auto mt-2">
                <pre className="text-xs">
                  {JSON.stringify(trackData, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}

        <div className="mt-8 text-sm text-slate-400">
          <p className="mb-2"><strong>Tips:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Click on a plane in the main map to get its ICAO24</li>
            <li>Not all flights have track data available</li>
            <li>Track data is only available for recent flights</li>
            <li>Try aircraft that have been flying for a while (not just departed)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}




