/**
 * MapLibre GL JS Map Container - Native WebGL GPU-accelerated rendering
 * Uses MapLibre native layers for maximum performance
 */

'use client';

import { useRef, useCallback, useEffect, useState, memo, useMemo } from 'react';
import Map, { Source, Layer, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_CONFIG, API_ENDPOINTS } from './constants.jsx';
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
  const [flightTrack, setFlightTrack] = useState(null);
  const [loadingTrack, setLoadingTrack] = useState(false);
  const [popupAnchor, setPopupAnchor] = useState('bottom');
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
  const [theme, setTheme] = useState('dark'); // 'dark' or 'light'

  // Toggle projection between globe and 2D
  const toggleProjection = useCallback(() => {
    setProjection(prev => prev === 'globe' ? 'mercator' : 'globe');
  }, []);

  // Toggle theme between light and dark
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    // Hide planes temporarily while new theme loads (shows loading indicator)
    setIconReady(false);
    // Reset map ready so we treat it like a fresh load
    setMapReady(false);
  }, []);

  // Handle icon size change
  const handleIconSizeChange = useCallback((e) => {
    setIconSizeMultiplier(parseFloat(e.target.value));
  }, []);

  // Calculate best popup anchor position to avoid trail intersection
  const calculatePopupAnchor = useCallback((flight, track) => {
    if (!flight || !track || !track.path || track.path.length < 2) {
      return 'bottom'; // Default position when no track
    }

    const flightLng = flight.longitude;
    const flightLat = flight.latitude;

    // Count weighted waypoints in each quadrant relative to the plane
    // Closer waypoints get more weight (more likely to visually intersect)
    const quadrants = { top: 0, bottom: 0, left: 0, right: 0 };
    
    track.path.forEach(point => {
      const deltaLng = point.longitude - flightLng;
      const deltaLat = point.latitude - flightLat;
      
      // Calculate distance from plane (simple Euclidean distance)
      const distance = Math.sqrt(deltaLng * deltaLng + deltaLat * deltaLat);
      
      // Weight: closer points matter more (inverse distance, capped)
      // Points very close get high weight, distant points get low weight
      const weight = distance < 0.001 ? 10 : 1 / Math.max(distance * 50, 0.1);
      
      // Classify waypoint by quadrant
      if (Math.abs(deltaLat) > Math.abs(deltaLng)) {
        // More vertical displacement
        if (deltaLat > 0) quadrants.top += weight;
        else quadrants.bottom += weight;
      } else {
        // More horizontal displacement
        if (deltaLng > 0) quadrants.right += weight;
        else quadrants.left += weight;
      }
    });

    console.log('[MapLibre] Trail quadrant distribution (weighted):', quadrants);

    // Find the quadrant with the LEAST weighted waypoints (best position for popup)
    const positions = [
      { anchor: 'bottom', count: quadrants.top, opposite: 'top' },
      { anchor: 'top', count: quadrants.bottom, opposite: 'bottom' },
      { anchor: 'left', count: quadrants.right, opposite: 'right' },
      { anchor: 'right', count: quadrants.left, opposite: 'left' }
    ];

    // Sort by count (ascending) - position with least trail intersection
    positions.sort((a, b) => a.count - b.count);

    // Choose the position with the least trail
    const bestPosition = positions[0].anchor;
    console.log('[MapLibre] Best popup anchor:', bestPosition, 'with weight:', positions[0].count.toFixed(2));

    return bestPosition;
  }, []);

  // Fetch flight track data from API
  const fetchFlightTrack = useCallback(async (icao24) => {
    if (!icao24) {
      console.warn('[MapLibre] No ICAO24 provided for track fetch');
      return;
    }
    
    setLoadingTrack(true);
    console.log('[MapLibre] Fetching track for', icao24);
    
    try {
      const url = `${API_ENDPOINTS.TRACKS}?icao24=${icao24}&time=0`;
      console.log('[MapLibre] Track API URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[MapLibre] Track API error:', response.status, errorText);
        throw new Error(`Failed to fetch track: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[MapLibre] Track API response:', data);
      
      if (data.track && data.track.path && data.track.path.length > 0) {
        console.log('[MapLibre] ✓ Received track with', data.track.path.length, 'waypoints');
        console.log('[MapLibre] First waypoint:', data.track.path[0]);
        console.log('[MapLibre] Last waypoint:', data.track.path[data.track.path.length - 1]);
        setFlightTrack(data.track);
        
        // Calculate best popup position based on track
        const flight = flights.find(f => f.icao24 === icao24);
        if (flight) {
          const anchor = calculatePopupAnchor(flight, data.track);
          setPopupAnchor(anchor);
        }
      } else {
        console.warn('[MapLibre] ⚠ No track data available for', icao24);
        console.log('[MapLibre] Response data:', data);
        setFlightTrack(null);
        setPopupAnchor('bottom'); // Reset to default
      }
    } catch (error) {
      console.error('[MapLibre] ✗ Error fetching track:', error);
      setFlightTrack(null);
    } finally {
      setLoadingTrack(false);
    }
  }, [flights, calculatePopupAnchor]);

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

  // Helper function to get color based on altitude (matching plane icon colors)
  // Returns RGB array for smooth interpolation
  const getAltitudeColor = useCallback((altitudeMeters) => {
    if (!altitudeMeters || altitudeMeters < 0) {
      return { hex: '#ef4444', rgb: [239, 68, 68] }; // Red for ground/unknown
    }
    
    const altitudeFeet = altitudeMeters * 3.28084;
    
    // Color scheme matching the plane icons with RGB values for interpolation
    const colorStops = [
      { alt: 0,     hex: '#ef4444', rgb: [239, 68, 68] },   // Red
      { alt: 5000,  hex: '#f97316', rgb: [249, 115, 22] },  // Orange
      { alt: 10000, hex: '#eab308', rgb: [234, 179, 8] },   // Yellow
      { alt: 15000, hex: '#84cc16', rgb: [132, 204, 22] },  // Light green
      { alt: 20000, hex: '#22c55e', rgb: [34, 197, 94] },   // Green
      { alt: 25000, hex: '#14b8a6', rgb: [20, 184, 166] },  // Teal
      { alt: 30000, hex: '#06b6d4', rgb: [6, 182, 212] },   // Cyan
      { alt: 35000, hex: '#3b82f6', rgb: [59, 130, 246] },  // Blue
      { alt: 40000, hex: '#6366f1', rgb: [99, 102, 241] },  // Indigo
      { alt: 45000, hex: '#8b5cf6', rgb: [139, 92, 246] }   // Purple
    ];
    
    // Find the two color stops to interpolate between
    for (let i = 0; i < colorStops.length - 1; i++) {
      if (altitudeFeet >= colorStops[i].alt && altitudeFeet < colorStops[i + 1].alt) {
        // Linear interpolation between two colors
        const t = (altitudeFeet - colorStops[i].alt) / (colorStops[i + 1].alt - colorStops[i].alt);
        const rgb = [
          Math.round(colorStops[i].rgb[0] + (colorStops[i + 1].rgb[0] - colorStops[i].rgb[0]) * t),
          Math.round(colorStops[i].rgb[1] + (colorStops[i + 1].rgb[1] - colorStops[i].rgb[1]) * t),
          Math.round(colorStops[i].rgb[2] + (colorStops[i + 1].rgb[2] - colorStops[i].rgb[2]) * t)
        ];
        return {
          hex: `#${rgb[0].toString(16).padStart(2, '0')}${rgb[1].toString(16).padStart(2, '0')}${rgb[2].toString(16).padStart(2, '0')}`,
          rgb: rgb
        };
      }
    }
    
    // If above all stops, return the highest color
    return { hex: '#8b5cf6', rgb: [139, 92, 246] }; // Purple
  }, []);

  // Convert flight track to a single LineString with many points for smooth gradient
  const trackGeojsonData = useMemo(() => {
    if (!flightTrack || !flightTrack.path || flightTrack.path.length < 2) {
      return null;
    }

    const coordinates = [];
    const pointColors = [];
    const INTERPOLATION_STEPS = 5; // per segment

    for (let i = 0; i < flightTrack.path.length - 1; i++) {
      const currentPoint = flightTrack.path[i];
      const nextPoint = flightTrack.path[i + 1];

      // Include step = 0 only on first segment to avoid duplicate vertices
      for (let step = (i === 0 ? 0 : 1); step <= INTERPOLATION_STEPS; step++) {
        const t = step / INTERPOLATION_STEPS;
        const lng = currentPoint.longitude + (nextPoint.longitude - currentPoint.longitude) * t;
        const lat = currentPoint.latitude + (nextPoint.latitude - currentPoint.latitude) * t;
        const alt = (currentPoint.baro_altitude || 0) + ((nextPoint.baro_altitude || 0) - (currentPoint.baro_altitude || 0)) * t;
        const colorData = getAltitudeColor(alt);
        coordinates.push([lng, lat]);
        pointColors.push(colorData.hex);
      }
    }

    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates
          },
          properties: {
            icao24: flightTrack.icao24,
            callsign: flightTrack.callsign,
            // Store colors for debugging/reference (not used by style spec)
            _pointColors: pointColors
          }
        }
      ]
    };
  }, [flightTrack, getAltitudeColor]);

  // Build a line-gradient expression tied to line-progress using per-vertex colors
  const trackGradientExpression = useMemo(() => {
    if (!trackGeojsonData) return null;
    const feature = trackGeojsonData.features?.[0];
    const coords = feature?.geometry?.coordinates || [];
    const pointColors = feature?.properties?._pointColors || [];
    if (coords.length === 0 || pointColors.length === 0) return null;

    const totalPoints = coords.length;
    const maxStops = 200; // cap to keep expression manageable
    const stride = Math.max(1, Math.floor(totalPoints / maxStops));

    const expr = ['interpolate', ['linear'], ['line-progress']];
    const stops = [];
    
    // Collect stops with progress values
    for (let i = 0; i < totalPoints; i += stride) {
      const t = totalPoints === 1 ? 0 : i / (totalPoints - 1);
      stops.push({ t, color: pointColors[i] });
    }
    
    // Always include the final point if not already included
    const lastT = 1;
    if (stops.length === 0 || stops[stops.length - 1].t < lastT) {
      stops.push({ t: lastT, color: pointColors[totalPoints - 1] });
    }
    
    // Push stops in order (already guaranteed ascending)
    for (const stop of stops) {
      expr.push(stop.t, stop.color);
    }
    
    return expr;
  }, [trackGeojsonData]);

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
      
      // Find the full flight object from the flights array
      const fullFlight = flights.find(f => f.icao24 === props.icao24);
      
      if (fullFlight) {
        console.log('[MapLibre] Selected flight:', fullFlight.icao24, fullFlight.callsign);
        setSelectedFlight(fullFlight);
        setPopupAnchor('bottom'); // Start with default, will update if track found
        if (onFlightSelect) {
          onFlightSelect(fullFlight);
        }
        
        // Fetch the flight track for the selected aircraft
        console.log('[MapLibre] Fetching track for:', fullFlight.icao24);
        fetchFlightTrack(fullFlight.icao24);
      }
    } else {
      // Clicked on map (not on a plane) - close all flight details and clear track
      setSelectedFlight(null);
      setFlightTrack(null);
      setPopupAnchor('bottom'); // Reset to default
      if (onFlightSelect) {
        onFlightSelect(null);
      }
    }
  }, [iconReady, onFlightSelect, fetchFlightTrack, flights]);

  // Handle popup close
  const handlePopupClose = useCallback(() => {
    setSelectedFlight(null);
    setFlightTrack(null);
    setPopupAnchor('bottom'); // Reset to default
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
        setIconReady(true); // Set to true anyway to prevent infinite loading
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

    // Initial load or when icons are re-enabled
    if (!iconReady) {
      tryAddIcons();
    }

    const handleStyleData = () => {
      // When style changes (theme switch), wait for it to load then re-add icons
      setTimeout(() => {
        if (map.isStyleLoaded()) {
          const hasIcons = map.hasImage('plane-0');
          if (!hasIcons) {
            console.log('[MapLibre] Style changed (theme switch), re-adding plane icons');
            addColoredIcons();
            configureMapAppearance();
          }
        }
      }, 150);
    };

    map.on('styledata', handleStyleData);
    return () => {
      map.off('styledata', handleStyleData);
    };
  }, [mapReady, iconsReady, iconReady]);


  // Log when track data changes
  useEffect(() => {
    if (trackGeojsonData) {
      const coords = trackGeojsonData.features?.[0]?.geometry?.coordinates || [];
      console.log('[MapLibre] 🌈 Smooth gradient trail ready');
      console.log(`[MapLibre]   - ${coords.length} line points after interpolation`);

      // Log altitude range for debugging
      const altitudes = (flightTrack?.path || [])
        .map(p => p.baro_altitude)
        .filter(a => Number.isFinite(a));
      if (altitudes.length > 0) {
        const minAlt = Math.min(...altitudes);
        const maxAlt = Math.max(...altitudes);
        const minAltFt = Math.round(minAlt * 3.28084);
        const maxAltFt = Math.round(maxAlt * 3.28084);
        console.log(`[MapLibre]   - Altitude range: ${Math.round(minAlt)}m - ${Math.round(maxAlt)}m (${minAltFt.toLocaleString()}ft - ${maxAltFt.toLocaleString()}ft)`);
      }
    } else {
      console.log('[MapLibre] No track GeoJSON data');
    }
  }, [trackGeojsonData, flightTrack]);

  // Log stats for debugging
  useEffect(() => {
    console.log(`[MapLibre] GPU Rendering ${flights.length} flights | Zoom: ${viewState.zoom.toFixed(1)}`);
  }, [flights.length, viewState.zoom]);

  return (
    <div className={`w-full h-full relative overflow-hidden ${
      theme === 'dark' ? 'bg-black' : 'bg-gray-100'
    }`}>
      {/* Loading indicator while plane icon loads */}
      {!iconReady && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className={`${
            theme === 'dark' ? 'bg-black/80 border-white/20' : 'bg-white/90 border-gray-300'
          } backdrop-blur-sm px-6 py-4 rounded-lg border`}>
            <div className="flex items-center gap-3">
              <div className={`animate-spin rounded-full h-5 w-5 border-b-2 ${
                theme === 'dark' ? 'border-white' : 'border-gray-800'
              }`}></div>
              <span className={`${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              } text-sm font-medium`}>Loading plane icons...</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator while flight track loads */}
      {loadingTrack && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
          <div className={`${
            theme === 'dark' ? 'bg-black/80 border-blue-500/50' : 'bg-white/90 border-blue-400'
          } backdrop-blur-sm px-4 py-2 rounded-lg border`}>
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span className={`${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              } text-sm font-medium`}>Loading flight trail...</span>
            </div>
          </div>
        </div>
      )}
      
      {/* MapLibre Map Container */}
      <div className="absolute inset-0">
        <Map
          key={theme}
          ref={mapRef}
          {...viewState}
          onMove={handleMove}
          onClick={handleMapClick}
          onLoad={() => setMapReady(true)}
          mapStyle={
            theme === 'dark' 
              ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
              : "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
          }
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
          projection={projection}
          minZoom={0}
          maxZoom={20}
          minPitch={0}
          maxPitch={85}
          dragRotate={false}
          dragPan={true}
          scrollZoom={true}
          touchZoomRotate={true}
          touchPitch={true}
          keyboard={true}
          doubleClickZoom={true}
          antialias={true}
          interactiveLayerIds={['flights-layer']}
        >
         {/* Flight track/trail line - render first so it appears below planes */}
         {trackGeojsonData && (
           <Source
             id="track-source"
             type="geojson"
             data={trackGeojsonData}
             lineMetrics={true}
           >
             {/* Main line layer with smooth altitude-based gradient colors */}
             <Layer
               id="track-line-layer"
               type="line"
               paint={{
                // Fallback color; overridden by line-gradient when supported
                'line-color': '#60a5fa',
                 'line-width': [
                   'interpolate',
                   ['linear'],
                   ['zoom'],
                   0, 5,
                   1, 5,
                   2, 5,
                   3, 5,
                   4, 5,
                   6, 5.5,
                   8, 6,
                   10, 6.5,
                   14, 7
                 ],
                'line-opacity': 1,
                ...(trackGradientExpression ? { 'line-gradient': trackGradientExpression } : {})
               }}
               layout={{
                 'line-join': 'round',
                 'line-cap': 'round'
               }}
             />
           </Source>
         )}

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
            anchor={popupAnchor}
            onClose={handlePopupClose}
            closeButton={true}
            closeOnClick={false}
            offset={popupAnchor === 'bottom' ? [0, -40] : popupAnchor === 'top' ? [0, 40] : popupAnchor === 'left' ? [40, 0] : [-40, 0]}
            maxWidth="200px"
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

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className={`absolute right-3 bottom-36 z-20 px-4 py-2 rounded-lg ${
          theme === 'dark' 
            ? 'bg-black/70 hover:bg-black/90 border-white/20 hover:border-white/40 text-white' 
            : 'bg-white/90 hover:bg-white border-gray-300 hover:border-gray-400 text-gray-800'
        } border text-sm font-medium transition-all duration-200 select-none shadow-lg`}
        title="Toggle between Light and Dark theme"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
        </div>
      </button>

      {/* Projection Toggle Button */}
      <button
        onClick={toggleProjection}
        className={`absolute right-3 bottom-20 z-20 px-4 py-2 rounded-lg ${
          theme === 'dark' 
            ? 'bg-black/70 hover:bg-black/90 border-white/20 hover:border-white/40 text-white' 
            : 'bg-white/90 hover:bg-white border-gray-300 hover:border-gray-400 text-gray-800'
        } border text-sm font-medium transition-all duration-200 select-none shadow-lg`}
        title="Toggle between 2D and Globe view"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🌍</span>
          <span>{projection === 'globe' ? '2D View' : 'Globe View'}</span>
        </div>
      </button>

      {/* Icon Size Slider */}
      <div className={`absolute right-3 bottom-3 z-20 px-4 py-3 rounded-lg ${
        theme === 'dark' 
          ? 'bg-black/70 border-white/20 text-white' 
          : 'bg-white/90 border-gray-300 text-gray-800'
      } border text-sm select-none shadow-lg`}>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium whitespace-nowrap">✈️ Icon Size:</span>
          <input
            type="range"
            min="3"
            max="5"
            step="0.2"
            value={iconSizeMultiplier}
            onChange={handleIconSizeChange}
            className={`w-32 h-2 ${
              theme === 'dark' ? 'bg-white/20' : 'bg-gray-300'
            } rounded-lg appearance-none cursor-pointer slider`}
            style={{
              accentColor: '#60A5FA'
            }}
          />
          <span className={`text-xs font-mono w-8 ${
            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
          }`}>{iconSizeMultiplier.toFixed(1)}x</span>
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
    className="text-xs" 
    style={{ 
      width: '100%', 
      maxWidth: '200px',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.9), 0 0 10px rgba(59, 130, 246, 0.15)',
      border: '1px solid rgba(75, 85, 99, 0.5)'
    }}
  >
    {/* Header with callsign */}
    <div className="px-2.5 py-2" style={{ 
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      borderBottom: '1px solid rgba(59, 130, 246, 0.2)'
    }}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base">✈️</span>
        <h3 className="font-bold text-base tracking-wide" style={{ color: '#e0e7ff' }}>
          {flight.callsign || 'Unknown'}
        </h3>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ 
          backgroundColor: flight.on_ground ? 'rgba(251, 146, 60, 0.2)' : 'rgba(52, 211, 153, 0.2)',
          color: flight.on_ground ? '#fb923c' : '#34d399',
          border: `1px solid ${flight.on_ground ? 'rgba(251, 146, 60, 0.4)' : 'rgba(52, 211, 153, 0.4)'}`
        }}>
          {flight.on_ground ? 'On Ground' : 'In Flight'}
        </span>
      </div>
    </div>

    {/* Content */}
    <div className="px-2.5 py-2 space-y-2" style={{ 
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
      height: '1px',
      background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.4), rgba(139, 92, 246, 0.4), rgba(236, 72, 153, 0.4))'
    }} />
  </div>
));

FlightPopupContent.displayName = 'FlightPopupContent';

/**
 * Info item component for popup
 */
const InfoItem = memo(({ icon, label, value, subvalue, highlight }) => (
  <div className="flex items-start justify-between gap-1.5">
    <div className="flex items-center gap-1 shrink-0">
      <span className="text-xs">{icon}</span>
      <span className="text-xs font-medium" style={{ color: '#6b7280' }}>
        {label}
      </span>
    </div>
    <div className="text-right">
      <div 
        className="text-xs font-semibold" 
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

