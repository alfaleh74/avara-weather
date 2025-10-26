'use client';

import { memo, useMemo } from 'react';

// Icon components
const PlaneIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
  </svg>
);

const SpeedIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z"/>
  </svg>
);

const AltitudeIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
  </svg>
);

const LocationIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
  </svg>
);

const CountryIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
  </svg>
);

const IcaoIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>
);

// Memoize formatting functions
const formatSpeed = (speedMs) => {
  if (speedMs === null) return 'N/A';
  const kmh = Math.round(speedMs * 3.6);
  return `${kmh} km/h`;
};

const formatSpeedDetailed = (speedMs) => {
  if (speedMs === null) return 'N/A';
  const kmh = Math.round(speedMs * 3.6);
  const knots = Math.round(speedMs * 1.94384);
  return `${kmh} km/h (${knots} knots)`;
};

const formatAltitude = (altitudeM) => {
  if (altitudeM === null) return 'N/A';
  const meters = Math.round(altitudeM);
  const feet = Math.round(altitudeM * 3.28084);
  return `${meters.toLocaleString()} m`;
};

const formatAltitudeDetailed = (altitudeM) => {
  if (altitudeM === null) return 'N/A';
  const meters = Math.round(altitudeM);
  const feet = Math.round(altitudeM * 3.28084);
  return `${meters} m (${feet.toLocaleString()} ft)`;
};

const formatAltitudeFeet = (altitudeM) => {
  if (altitudeM === null) return 'N/A';
  const feet = Math.round(altitudeM * 3.28084);
  return `${feet.toLocaleString()} ft`;
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

// Memoized InfoRow component with icon
const InfoRowWithIcon = memo(({ icon, label, value, iconColor = "text-blue-400" }) => (
  <div className="flex items-start gap-3">
    <div className={`${iconColor} shrink-0 mt-0.5`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="text-sm font-semibold text-white wrap-break-word">{value}</div>
    </div>
  </div>
));

InfoRowWithIcon.displayName = 'InfoRowWithIcon';

// Memoized InfoRow component (for detailed sections)
const InfoRow = memo(({ label, value }) => (
  <div className="flex justify-between items-start gap-4">
    <span className="text-sm text-zinc-400 shrink-0">{label}:</span>
    <span className="text-sm font-semibold text-white text-right">{value}</span>
  </div>
));

InfoRow.displayName = 'InfoRow';

const FlightInfoPanel = memo(function FlightInfoPanel({ flight, onClose }) {
  // Memoize formatted values to prevent recalculation on every render
  const formattedValues = useMemo(() => {
    if (!flight) return null;
    
    return {
      speed: formatSpeed(flight.velocity),
      speedDetailed: formatSpeedDetailed(flight.velocity),
      baroAltitude: formatAltitude(flight.baro_altitude),
      baroAltitudeFeet: formatAltitudeFeet(flight.baro_altitude),
      baroAltitudeDetailed: formatAltitudeDetailed(flight.baro_altitude),
      geoAltitude: formatAltitude(flight.geo_altitude),
      geoAltitudeDetailed: formatAltitudeDetailed(flight.geo_altitude),
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
    <div className="absolute bottom-4 left-4 z-1000 bg-slate-800/95 backdrop-blur-sm text-white rounded-xl shadow-2xl border border-slate-600/50 w-80 max-h-[80vh] overflow-y-auto">
      {/* Header with Flight Number */}
      <div className="sticky top-0 bg-slate-700/90 backdrop-blur-sm px-4 py-3 rounded-t-xl border-b border-slate-600/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <PlaneIcon />
          <h3 className="text-xl font-bold">{flight.callsign?.trim() || 'Unknown'}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-300 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Status Badge */}
        <div className="flex justify-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
            flight.on_ground 
              ? 'bg-gray-500/20 text-gray-300' 
              : 'bg-green-500/20 text-green-300'
          }`}>
            {flight.on_ground ? 'On Ground' : 'In Flight'}
          </span>
        </div>

        {/* Key Info with Icons */}
        <div className="space-y-3">
          <InfoRowWithIcon 
            icon={<IcaoIcon />}
            label="ICAO24"
            value={flight.icao24?.toUpperCase() || 'N/A'}
            iconColor="text-pink-400"
          />
          <InfoRowWithIcon 
            icon={<CountryIcon />}
            label="Country"
            value={flight.origin_country || 'N/A'}
            iconColor="text-blue-400"
          />
          <InfoRowWithIcon 
            icon={<SpeedIcon />}
            label="Speed"
            value={formattedValues.speed}
            iconColor="text-orange-400"
          />
          <InfoRowWithIcon 
            icon={<AltitudeIcon />}
            label="Altitude"
            value={formattedValues.baroAltitudeFeet}
            iconColor="text-slate-300"
          />
        </div>

        {/* Detailed Info - Collapsible sections */}
        <details className="pt-3 border-t border-slate-600/50">
          <summary className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide cursor-pointer hover:text-white transition-colors">
            Position Details
          </summary>
          <div className="space-y-2 mt-3 pl-2">
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
              value={formattedValues.baroAltitudeDetailed} 
            />
            <InfoRow 
              label="Geometric Altitude" 
              value={formattedValues.geoAltitudeDetailed} 
            />
          </div>
        </details>

        {/* Movement Info */}
        <details className="pt-3 border-t border-slate-600/50">
          <summary className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide cursor-pointer hover:text-white transition-colors">
            Movement Details
          </summary>
          <div className="space-y-2 mt-3 pl-2">
            <InfoRow 
              label="Ground Speed" 
              value={formattedValues.speedDetailed} 
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
        </details>

        {/* Additional Info */}
        <details className="pt-3 border-t border-slate-600/50">
          <summary className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide cursor-pointer hover:text-white transition-colors">
            Additional Info
          </summary>
          <div className="space-y-2 mt-3 pl-2">
            <InfoRow label="Squawk Code" value={flight.squawk || 'N/A'} />
            <InfoRow label="SPI" value={formattedValues.spi} />
            <InfoRow label="On Ground Status" value={flight.on_ground ? 'Yes' : 'No'} />
          </div>
        </details>

        {/* Technical Info */}
        <details className="pt-3 border-t border-slate-600/50">
          <summary className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide cursor-pointer hover:text-white transition-colors">
            Technical Data
          </summary>
          <div className="space-y-2 mt-3 pl-2">
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
        </details>

        {/* Raw Data Values */}
        <details className="pt-3 border-t border-slate-600/50">
          <summary className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide cursor-pointer hover:text-white transition-colors">
            Raw Data
          </summary>
          <div className="space-y-2 mt-3 pl-2">
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
        </details>
      </div>
    </div>
  );
});

FlightInfoPanel.displayName = 'FlightInfoPanel';

export default FlightInfoPanel;

