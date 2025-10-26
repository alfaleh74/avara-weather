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
    0: 'ADS-B (Automatic Dependent Surveillance-Broadcast)',
    1: 'ASTERIX (All Purpose Structured Eurocontrol Surveillance)',
    2: 'MLAT (Multilateration)',
    3: 'FLARM (Flight Alarm)'
  };
  return sources[source] || `Unknown (${source})`;
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
      lastContact: flight.last_contact ? new Date(flight.last_contact * 1000).toLocaleString() : 'N/A',
      lastContactUnix: flight.last_contact || 'N/A',
      positionTime: flight.time_position ? new Date(flight.time_position * 1000).toLocaleString() : null,
      positionTimeUnix: flight.time_position || 'N/A',
      positionSource: getPositionSource(flight.position_source),
      latitude: flight.latitude != null ? flight.latitude.toFixed(4) + '°' : 'N/A',
      latitudeRaw: flight.latitude != null ? flight.latitude.toFixed(6) : 'N/A',
      longitude: flight.longitude != null ? flight.longitude.toFixed(4) + '°' : 'N/A',
      longitudeRaw: flight.longitude != null ? flight.longitude.toFixed(6) : 'N/A',
      sensors: flight.sensors ? (Array.isArray(flight.sensors) ? flight.sensors.join(', ') : String(flight.sensors)) : 'N/A',
      spi: flight.spi !== null && flight.spi !== undefined ? (flight.spi ? 'Yes (Ident Active)' : 'No') : 'N/A',
      velocityRaw: flight.velocity != null ? `${flight.velocity.toFixed(2)} m/s` : 'N/A',
      trueTrackRaw: flight.true_track != null ? `${flight.true_track.toFixed(2)}°` : 'N/A',
      verticalRateRaw: flight.vertical_rate != null ? `${flight.vertical_rate.toFixed(2)} m/s` : 'N/A'
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
          <InfoRow label="ICAO 24-bit Address" value={flight.icao24?.toUpperCase() || 'N/A'} />
          <InfoRow label="Origin Country" value={flight.origin_country || 'N/A'} />
          <InfoRow label="Squawk Code" value={flight.squawk || 'N/A'} />
          <InfoRow label="SPI" value={formattedValues.spi} />
          <InfoRow label="On Ground Status" value={flight.on_ground ? 'Yes' : 'No'} />
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
            <InfoRow 
              label="Geometric Altitude" 
              value={formattedValues.geoAltitude} 
            />
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
            <InfoRow 
              label="Last Contact (Unix)" 
              value={formattedValues.lastContactUnix} 
            />
            <InfoRow 
              label="Position Time" 
              value={formattedValues.positionTime || 'N/A'} 
            />
            <InfoRow 
              label="Position Time (Unix)" 
              value={formattedValues.positionTimeUnix} 
            />
            <InfoRow 
              label="Position Source" 
              value={formattedValues.positionSource} 
            />
            <InfoRow 
              label="Sensor(s)" 
              value={formattedValues.sensors} 
            />
          </div>
        </div>

        {/* Raw Data Values */}
        <div className="pt-3 border-t border-zinc-700">
          <h4 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wide">Raw Data</h4>
          <div className="space-y-3">
            <InfoRow 
              label="Latitude (Precise)" 
              value={formattedValues.latitudeRaw} 
            />
            <InfoRow 
              label="Longitude (Precise)" 
              value={formattedValues.longitudeRaw} 
            />
            <InfoRow 
              label="Velocity (m/s)" 
              value={formattedValues.velocityRaw} 
            />
            <InfoRow 
              label="True Track (degrees)" 
              value={formattedValues.trueTrackRaw} 
            />
            <InfoRow 
              label="Vertical Rate (m/s)" 
              value={formattedValues.verticalRateRaw} 
            />
            <InfoRow 
              label="Baro Altitude (m)" 
              value={flight.baro_altitude != null ? `${flight.baro_altitude.toFixed(2)} m` : 'N/A'} 
            />
            <InfoRow 
              label="Geo Altitude (m)" 
              value={flight.geo_altitude != null ? `${flight.geo_altitude.toFixed(2)} m` : 'N/A'} 
            />
          </div>
        </div>
      </div>
    </div>
  );
});

FlightInfoPanel.displayName = 'FlightInfoPanel';

export default FlightInfoPanel;

