/**
 * MapLibre GL JS Map Container - Native WebGL GPU-accelerated rendering
 * Uses MapLibre native layers for maximum performance
 */

'use client';

import { useRef, useCallback, useEffect, useState, memo, useMemo } from 'react';
import Map, { Source, Layer, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_CONFIG } from './constants.jsx';
import ColoredPlaneIconProcessor, { getIconKeyForAltitude } from '../graphics/ColoredPlaneIconProcessor.jsx';

/**
 * Main MapLibre map container with GPU-accelerated rendering
 * Uses native MapLibre layers for WebGL rendering (no DOM elements)
 */
const MapLibreContainer = memo(({ 
  flights, 
  onFlightSelect 
}) => {
  const mapRef = useRef(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [iconReady, setIconReady] = useState(false);
  const coloredIconsRef = useRef(null);
  const [iconsReady, setIconsReady] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: MAP_CONFIG.INITIAL_CENTER[1],
    latitude: MAP_CONFIG.INITIAL_CENTER[0],
    zoom: MAP_CONFIG.INITIAL_ZOOM,
    // Fallbacks in case pitch/bearing are not configured
    pitch: Number.isFinite(MAP_CONFIG.INITIAL_PITCH) ? MAP_CONFIG.INITIAL_PITCH : 0,
    bearing: Number.isFinite(MAP_CONFIG.INITIAL_BEARING) ? MAP_CONFIG.INITIAL_BEARING : 0
  });

  // Stable callback for when colored plane icons are ready
  const handleColoredIconsReady = useCallback((coloredIcons) => {
    console.log('[MapLibre] handleColoredIconsReady called with', Object.keys(coloredIcons).length, 'icons');
    coloredIconsRef.current = coloredIcons;
    setIconsReady(true);
  }, []);

  const [projection, setProjection] = useState('globe');
  const [iconSizeMultiplier, setIconSizeMultiplier] = useState(3.6);

  // Toggle projection between globe and 2D
  const toggleProjection = useCallback(() => {
    setProjection(prev => prev === 'globe' ? 'mercator' : 'globe');
  }, []);

  // Handle icon size change
  const handleIconSizeChange = useCallback((e) => {
    setIconSizeMultiplier(parseFloat(e.target.value));
  }, []);

  // Update viewport state
  const handleMove = useCallback((evt) => {
    setViewState(evt.viewState);
  }, []);

  // Convert flights to GeoJSON for GPU rendering (filter invalid coords)
  const geojsonData = useMemo(() => ({
    type: 'FeatureCollection',
    features: flights
      .filter((flight) => Number.isFinite(flight.longitude) && Number.isFinite(flight.latitude))
      .map(flight => {
        // Calculate altitude in feet and get appropriate icon key
        // Grounded planes get special 'ground' key (solid red)
        let altitudeFeet;
        if (flight.on_ground) {
          altitudeFeet = 'ground';
        } else {
          altitudeFeet = flight.baro_altitude ? Math.round(flight.baro_altitude * 3.28084) : 0;
        }
        
        const iconKey = getIconKeyForAltitude(altitudeFeet);
        
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [flight.longitude, flight.latitude]
          },
          properties: {
            icao24: flight.icao24,
            callsign: flight.callsign || 'Unknown',
            origin_country: flight.origin_country,
            velocity: flight.velocity,
            baro_altitude: flight.baro_altitude,
            on_ground: flight.on_ground,
            rotation: flight.true_track || 0,
            iconKey: `plane-${iconKey}`
          }
        };
      })
  }), [flights]);

  // Handle map click to select flights
  const handleMapClick = useCallback((event) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Only query if the layer exists (i.e., icon is ready)
    if (!iconReady || !map.getLayer('flights-layer')) return;

    const features = map.queryRenderedFeatures(event.point, {
      layers: ['flights-layer']
    });

    if (features.length > 0) {
      const props = features[0].properties;
      const coords = features[0].geometry.coordinates;
      
      const flight = {
        icao24: props.icao24,
        callsign: props.callsign,
        origin_country: props.origin_country,
        velocity: props.velocity,
        baro_altitude: props.baro_altitude,
        on_ground: props.on_ground,
        longitude: coords[0],
        latitude: coords[1]
      };
      
      setSelectedFlight(flight);
      if (onFlightSelect) {
        onFlightSelect(flight);
      }
    } else {
      // Clicked on map (not on a plane) - close all flight details
      setSelectedFlight(null);
      if (onFlightSelect) {
        onFlightSelect(null);
      }
    }
  }, [iconReady, onFlightSelect]);

  // Handle popup close
  const handlePopupClose = useCallback(() => {
    setSelectedFlight(null);
    if (onFlightSelect) {
      onFlightSelect(null);
    }
  }, [onFlightSelect]);

  // Add colored plane icons and configure map appearance
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !mapReady || !iconsReady || !coloredIconsRef.current) {
      console.log('[MapLibre] Waiting... map:', !!map, 'mapReady:', mapReady, 'iconsReady:', iconsReady, 'icons:', !!coloredIconsRef.current);
      return;
    }

    const addColoredIcons = () => {
      try {
        const icons = coloredIconsRef.current;
        let addedCount = 0;
        
        // Add each colored icon to the map
        for (const [altitude, bitmap] of Object.entries(icons)) {
          const iconName = `plane-${altitude}`;
          if (!map.hasImage(iconName)) {
            map.addImage(iconName, bitmap, { pixelRatio: 2, sdf: false });
            addedCount++;
          }
        }
        
        console.log('[MapLibre] ✓ Added', addedCount, 'colored plane icons to map');
        setIconReady(true);
      } catch (error) {
        console.error('[MapLibre] Failed to add colored plane icons:', error);
      }
    };

    const configureMapAppearance = () => {
      // Remove any sky layer if present
      try {
        const style = map.getStyle();
        const skyLayer = style?.layers?.find(l => l.type === 'sky' || l.id === 'sky');
        if (skyLayer && map.getLayer(skyLayer.id)) {
          map.removeLayer(skyLayer.id);
        }
      } catch {}
    };

    const tryAddIcons = () => {
      if (map.isStyleLoaded()) {
        addColoredIcons();
        configureMapAppearance();
      } else {
        console.log('[MapLibre] Waiting for style to load...');
        map.once('style.load', () => {
          console.log('[MapLibre] Style loaded, adding icons now');
          addColoredIcons();
          configureMapAppearance();
        });
      }
    };

    tryAddIcons();

    const handleStyleData = () => {
      if (map.isStyleLoaded() && !map.hasImage('plane-0')) {
        console.log('[MapLibre] Style changed, re-adding plane icons');
        addColoredIcons();
        configureMapAppearance();
      }
    };

    map.on('styledata', handleStyleData);
    return () => {
      map.off('styledata', handleStyleData);
    };
  }, [mapReady, iconsReady]);


  // Log stats for debugging
  useEffect(() => {
    console.log(`[MapLibre] GPU Rendering ${flights.length} flights | Zoom: ${viewState.zoom.toFixed(1)}`);
  }, [flights.length, viewState.zoom]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      {/* Loading indicator while plane icon loads */}
      {!iconReady && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-sm px-6 py-4 rounded-lg border border-white/20">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span className="text-white text-sm font-medium">Loading plane icons...</span>
            </div>
          </div>
        </div>
      )}
      
      {/* MapLibre Map Container */}
      <div className="absolute inset-0">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={handleMove}
          onClick={handleMapClick}
          onLoad={() => setMapReady(true)}
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
          projection={projection}
          minZoom={0}
          maxZoom={20}
          minPitch={0}
          maxPitch={85}
          dragRotate={true}
          dragPan={true}
          scrollZoom={true}
          touchZoomRotate={true}
          touchPitch={true}
          keyboard={true}
          doubleClickZoom={true}
          antialias={true}
          interactiveLayerIds={['flights-layer']}
        >
        {/* GPU-accelerated GeoJSON layer - only render when plane icons are ready */}
        {iconReady && (
          <Source
            id="flights-source"
            type="geojson"
            data={geojsonData}
          >
            {/* Symbol layer with altitude-colored plane icons */}
            <Layer
              id="flights-layer"
              type="symbol"
              layout={{
                'icon-image': ['get', 'iconKey'],
                'icon-size': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  2, 0.02 * iconSizeMultiplier,
                  4, 0.05 * iconSizeMultiplier,
                  6, 0.08 * iconSizeMultiplier,
                  10, 0.1 * iconSizeMultiplier,
                  12, 0.15 * iconSizeMultiplier
                ],
                'icon-rotate': ['get', 'rotation'],
                'icon-rotation-alignment': 'map',
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
                'icon-pitch-alignment': 'map'
              }}
              paint={{
                'icon-opacity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  2, 0.8,
                  7, 0.95,
                  12, 1
                ]
              }}
            />
          </Source>
        )}

        {/* Popup for selected flight */}
        {selectedFlight && (
          <Popup
            longitude={selectedFlight.longitude}
            latitude={selectedFlight.latitude}
            anchor="bottom"
            onClose={handlePopupClose}
            closeButton={true}
            closeOnClick={false}
            offset={[0, -20]}
            maxWidth="260px"
            className="flight-popup"
          >
            <FlightPopupContent flight={selectedFlight} />
          </Popup>
        )}
        </Map>
      </div>

      {/* Process colored plane icon bitmaps (outside Map so it persists) */}
      <ColoredPlaneIconProcessor
        src="/planes-icon.png"
        onReady={handleColoredIconsReady}
      />

      {/* Projection Toggle Button */}
      <button
        onClick={toggleProjection}
        className="absolute right-3 bottom-20 z-20 px-4 py-2 rounded-lg bg-black/70 hover:bg-black/90 border border-white/20 hover:border-white/40 text-white text-sm font-medium transition-all duration-200 select-none shadow-lg"
        title="Toggle between 2D and Globe view"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🌍</span>
          <span>{projection === 'globe' ? '2D View' : 'Globe View'}</span>
        </div>
      </button>

      {/* Icon Size Slider */}
      <div className="absolute right-3 bottom-3 z-20 px-4 py-3 rounded-lg bg-black/70 border border-white/20 text-white text-sm select-none shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium whitespace-nowrap">✈️ Icon Size:</span>
          <input
            type="range"
            min="3"
            max="5"
            step="0.2"
            value={iconSizeMultiplier}
            onChange={handleIconSizeChange}
            className="w-32 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            style={{
              accentColor: '#60A5FA'
            }}
          />
          <span className="text-xs font-mono text-blue-400 w-8">{iconSizeMultiplier.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  );
});

MapLibreContainer.displayName = 'MapLibreContainer';

// Prevent re-renders when flights array reference changes but content is same
export default MapLibreContainer;

/**
 * Flight popup content component with enhanced styling
 */
const FlightPopupContent = memo(({ flight }) => (
  <div 
    className="text-sm" 
    style={{ 
      width: '100%', 
      maxWidth: '260px',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.9), 0 0 20px rgba(59, 130, 246, 0.15)',
      border: '1px solid rgba(75, 85, 99, 0.5)'
    }}
  >
    {/* Header with callsign */}
    <div className="px-3 py-2.5" style={{ 
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      borderBottom: '1px solid rgba(59, 130, 246, 0.2)'
    }}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-xl">✈️</span>
        <h3 className="font-bold text-lg tracking-wide" style={{ color: '#e0e7ff' }}>
          {flight.callsign || 'Unknown'}
        </h3>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ 
          backgroundColor: flight.on_ground ? 'rgba(251, 146, 60, 0.2)' : 'rgba(52, 211, 153, 0.2)',
          color: flight.on_ground ? '#fb923c' : '#34d399',
          border: `1px solid ${flight.on_ground ? 'rgba(251, 146, 60, 0.4)' : 'rgba(52, 211, 153, 0.4)'}`
        }}>
          {flight.on_ground ? '🛬 On Ground' : '🛫 In Flight'}
        </span>
      </div>
    </div>

    {/* Content */}
    <div className="px-3 py-2.5 space-y-2.5" style={{ 
      backgroundColor: '#111827',
      color: '#e5e7eb'
    }}>
      {/* ICAO & Country Section */}
      <div className="space-y-1.5">
        <InfoItem 
          icon="🔖" 
          label="ICAO24" 
          value={flight.icao24?.toUpperCase() || 'N/A'} 
        />
        <InfoItem 
          icon="🌍" 
          label="Country" 
          value={flight.origin_country || 'Unknown'} 
        />
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(75, 85, 99, 0.3)' }} />

      {/* Flight Data Section */}
      <div className="space-y-1.5">
        {flight.velocity !== null && (
          <InfoItem 
            icon="⚡" 
            label="Speed" 
            value={`${Math.round(flight.velocity * 3.6)} km/h`}
            subvalue={`${Math.round(flight.velocity * 2.23694)} mph`}
            highlight={true}
          />
        )}
        {flight.baro_altitude !== null && (
          <InfoItem 
            icon="📏" 
            label="Altitude" 
            value={`${Math.round(flight.baro_altitude).toLocaleString()} m`}
            subvalue={`${Math.round(flight.baro_altitude * 3.28084).toLocaleString()} ft`}
            highlight={true}
          />
        )}
      </div>
    </div>

    {/* Footer gradient */}
    <div style={{ 
      height: '2px',
      background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.4), rgba(139, 92, 246, 0.4), rgba(236, 72, 153, 0.4))'
    }} />
  </div>
));

FlightPopupContent.displayName = 'FlightPopupContent';

/**
 * Info item component for popup
 */
const InfoItem = memo(({ icon, label, value, subvalue, highlight }) => (
  <div className="flex items-start justify-between gap-2">
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="text-sm">{icon}</span>
      <span className="text-xs font-medium" style={{ color: '#6b7280' }}>
        {label}
      </span>
    </div>
    <div className="text-right">
      <div 
        className="text-sm font-semibold" 
        style={{ 
          color: highlight ? '#93c5fd' : '#e5e7eb',
          fontVariantNumeric: 'tabular-nums'
        }}
      >
        {value}
      </div>
      {subvalue && (
        <div className="text-xs leading-tight" style={{ color: '#6b7280' }}>
          {subvalue}
        </div>
      )}
    </div>
  </div>
));

InfoItem.displayName = 'InfoItem';

