'use client';

import { memo, useMemo } from 'react';

// Memoize formatting functions
const formatSpeed = (speedMs) => {
  if (speedMs === null) return 'N/A';
  const kmh = Math.round(speedMs * 3.6);
  const knots = Math.round(speedMs * 1.94384);
  return `${kmh} km/h (${knots} knots)`;
};

const formatAltitude = (altitudeM) => {
  if (altitudeM === null) return 'N/A';
  const meters = Math.round(altitudeM);
  const feet = Math.round(altitudeM * 3.28084);
  return `${meters} m (${feet.toLocaleString()} ft)`;
};

const formatVerticalRate = (rateMs) => {
  if (rateMs === null) return 'N/A';
  const direction = rateMs > 0 ? '↑' : rateMs < 0 ? '↓' : '→';
  const fpm = Math.round(Math.abs(rateMs) * 196.85);
  return `${direction} ${fpm} ft/min`;
};

const formatHeading = (heading) => {
  if (heading === null) return 'N/A';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(heading / 22.5) % 16;
  return `${Math.round(heading)}° (${directions[index]})`;
};

const getPositionSource = (source) => {
  const sources = {
    0: 'ADS-B',
    1: 'ASTERIX',
    2: 'MLAT',
    3: 'FLARM'
  };
  return sources[source] || 'Unknown';
};

// Memoized InfoRow component
const InfoRow = memo(({ label, value }) => (
  <div className="flex justify-between items-start">
    <span className="text-sm text-zinc-400">{label}:</span>
    <span className="text-sm font-semibold text-white text-right ml-2">{value}</span>
  </div>
));

InfoRow.displayName = 'InfoRow';

const FlightInfoPanel = memo(function FlightInfoPanel({ flight, onClose }) {
  // Memoize formatted values to prevent recalculation on every render
  const formattedValues = useMemo(() => {
    if (!flight) return null;
    
    return {
      speed: formatSpeed(flight.velocity),
      baroAltitude: formatAltitude(flight.baro_altitude),
      geoAltitude: formatAltitude(flight.geo_altitude),
      heading: formatHeading(flight.true_track),
      verticalRate: formatVerticalRate(flight.vertical_rate),
      lastContact: new Date(flight.last_contact * 1000).toLocaleTimeString(),
      positionTime: flight.time_position ? new Date(flight.time_position * 1000).toLocaleTimeString() : null,
      positionSource: getPositionSource(flight.position_source),
      latitude: flight.latitude?.toFixed(4) + '°',
      longitude: flight.longitude?.toFixed(4) + '°'
    };
  }, [flight]);

  if (!flight || !formattedValues) return null;

  return (
    <div className="absolute bottom-4 right-4 z-1000 bg-zinc-900/95 backdrop-blur-sm text-white rounded-lg shadow-2xl border border-zinc-700 w-80 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-800 px-4 py-3 rounded-t-lg border-b border-zinc-700 flex justify-between items-center">
        <h3 className="text-lg font-bold">Flight Details</h3>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Callsign */}
        <div className="text-center pb-4 border-b border-zinc-700">
          <p className="text-3xl font-bold text-blue-400">
            {flight.callsign || 'Unknown'}
          </p>
          <p className="text-sm text-zinc-400 mt-1">
            {flight.on_ground ? '🛬 On Ground' : '✈️ In Flight'}
          </p>
        </div>

        {/* Basic Info */}
        <div className="space-y-3">
          <InfoRow label="ICAO 24-bit Address" value={flight.icao24?.toUpperCase()} />
          <InfoRow label="Origin Country" value={flight.origin_country} />
          {flight.squawk && <InfoRow label="Squawk" value={flight.squawk} />}
        </div>

        {/* Position Info */}
        <div className="pt-3 border-t border-zinc-700">
          <h4 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wide">Position</h4>
          <div className="space-y-3">
            <InfoRow 
              label="Latitude" 
              value={formattedValues.latitude || 'N/A'} 
            />
            <InfoRow 
              label="Longitude" 
              value={formattedValues.longitude || 'N/A'} 
            />
            <InfoRow 
              label="Barometric Altitude" 
              value={formattedValues.baroAltitude} 
            />
            {flight.geo_altitude !== null && flight.geo_altitude !== flight.baro_altitude && (
              <InfoRow 
                label="Geometric Altitude" 
                value={formattedValues.geoAltitude} 
              />
            )}
          </div>
        </div>

        {/* Movement Info */}
        <div className="pt-3 border-t border-zinc-700">
          <h4 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wide">Movement</h4>
          <div className="space-y-3">
            <InfoRow 
              label="Ground Speed" 
              value={formattedValues.speed} 
            />
            <InfoRow 
              label="Heading" 
              value={formattedValues.heading} 
            />
            <InfoRow 
              label="Vertical Rate" 
              value={formattedValues.verticalRate} 
            />
          </div>
        </div>

        {/* Technical Info */}
        <div className="pt-3 border-t border-zinc-700">
          <h4 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wide">Technical</h4>
          <div className="space-y-3">
            <InfoRow 
              label="Last Contact" 
              value={formattedValues.lastContact} 
            />
            {formattedValues.positionTime && (
              <InfoRow 
                label="Position Time" 
                value={formattedValues.positionTime} 
              />
            )}
            <InfoRow 
              label="Position Source" 
              value={formattedValues.positionSource} 
            />
          </div>
        </div>
      </div>
    </div>
  );
});

FlightInfoPanel.displayName = 'FlightInfoPanel';

export default FlightInfoPanel;

