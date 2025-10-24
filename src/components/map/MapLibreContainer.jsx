/**
 * MapLibre GL JS Map Container - Native WebGL GPU-accelerated rendering
 * Uses MapLibre native layers for maximum performance
 */

'use client';

import { useRef, useCallback, useEffect, useState, memo, useMemo } from 'react';
import Map, { Source, Layer, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_CONFIG } from './constants.jsx';
import PlaneIconProcessor from '../graphics/PlaneIconProcessor.jsx';
import SpaceBackground from './SpaceBackground.jsx';

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
  const planeBitmapRef = useRef(null);
  const [bitmapReady, setBitmapReady] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: MAP_CONFIG.INITIAL_CENTER[1],
    latitude: MAP_CONFIG.INITIAL_CENTER[0],
    zoom: MAP_CONFIG.INITIAL_ZOOM,
    // Fallbacks in case pitch/bearing are not configured
    pitch: Number.isFinite(MAP_CONFIG.INITIAL_PITCH) ? MAP_CONFIG.INITIAL_PITCH : 0,
    bearing: Number.isFinite(MAP_CONFIG.INITIAL_BEARING) ? MAP_CONFIG.INITIAL_BEARING : 0
  });

  const [freeCameraEnabled, setFreeCameraEnabled] = useState(false);

  // Update viewport state
  const handleMove = useCallback((evt) => {
    setViewState(evt.viewState);
  }, []);

  // Convert flights to GeoJSON for GPU rendering (filter invalid coords)
  const geojsonData = useMemo(() => ({
    type: 'FeatureCollection',
    features: flights
      .filter((flight) => Number.isFinite(flight.longitude) && Number.isFinite(flight.latitude))
      .map(flight => ({
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
          rotation: flight.true_track || 0
        }
      }))
  }), [flights]);

  // Handle map click to select flights
  const handleMapClick = useCallback((event) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

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
    }
  }, [onFlightSelect]);

  // Handle popup close
  const handlePopupClose = useCallback(() => {
    setSelectedFlight(null);
  }, []);

  // Add custom plane icon and apply transparent background for starfield
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const addIconFromBitmap = () => {
      if (!planeBitmapRef.current) return;
      if (!map.hasImage('plane-icon')) {
        map.addImage('plane-icon', planeBitmapRef.current, { pixelRatio: 2, sdf: false });
        console.log('[MapLibre] ✓ Plane ImageBitmap added to map');
      }
      setIconReady(true);
    };

    const applySpaceBackground = () => {
      if (map.isStyleLoaded()) {
        // Transparent map background so Three.js space shows through
        try {
          map.setPaintProperty('background', 'background-color', 'rgba(0, 0, 0, 0)');
        } catch {}
        // Remove any sky layer if present to avoid built-in atmosphere
        try {
          const style = map.getStyle();
          const skyLayer = style?.layers?.find(l => l.type === 'sky' || l.id === 'sky');
          if (skyLayer && map.getLayer(skyLayer.id)) {
            map.removeLayer(skyLayer.id);
          }
        } catch {}
        console.log('[MapLibre] ✓ Transparent background + no sky');
      }
    };

    if (map.isStyleLoaded()) {
      if (bitmapReady && planeBitmapRef.current) addIconFromBitmap();
      applySpaceBackground();
    } else {
      map.once('style.load', () => {
        if (bitmapReady && planeBitmapRef.current) addIconFromBitmap();
        applySpaceBackground();
      });
    }

    const handleStyleData = () => {
      if (map.isStyleLoaded()) {
        if ((bitmapReady && planeBitmapRef.current) && !map.hasImage('plane-icon')) {
          console.log('[MapLibre] Style changed, re-adding plane icon');
          addIconFromBitmap();
        }
        applySpaceBackground();
      }
    };

    map.on('styledata', handleStyleData);
    return () => {
      map.off('styledata', handleStyleData);
    };
  }, [bitmapReady]);

  // Keyboard toggle for free camera (F)
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'KeyF') {
        setFreeCameraEnabled((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Log stats for debugging
  useEffect(() => {
    console.log(`[MapLibre] GPU Rendering ${flights.length} flights | Zoom: ${viewState.zoom.toFixed(1)}`);
  }, [flights.length, viewState.zoom]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      {/* Three.js Space Background */}
      <SpaceBackground freeCameraEnabled={freeCameraEnabled} />

      {/* MapLibre Globe layered above Three.js; pointer events disabled in free-cam */}
      <div className="absolute inset-0 z-10">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={handleMove}
          onClick={handleMapClick}
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          style={{ width: '100%', height: '100%', pointerEvents: freeCameraEnabled ? 'none' : 'auto' }}
          attributionControl={false}
          projection="globe"
          minZoom={0}
          maxZoom={20}
          minPitch={0}
          maxPitch={85}
          dragRotate={!freeCameraEnabled}
          dragPan={!freeCameraEnabled}
          scrollZoom={!freeCameraEnabled}
          touchZoomRotate={!freeCameraEnabled}
          touchPitch={!freeCameraEnabled}
          keyboard={!freeCameraEnabled}
          doubleClickZoom={!freeCameraEnabled}
          antialias={true}
          interactiveLayerIds={['flights-layer']}
        >
        {/* GPU-accelerated GeoJSON layer - renders ALL flights efficiently */}
        <Source
          id="flights-source"
          type="geojson"
          data={geojsonData}
        >
          {/* Fallback circle layer while icon is loading */}
          {!iconReady && (
            <Layer
              id="flights-fallback"
              type="circle"
              paint={{
                'circle-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  2, 1.5,
                  7, 2.5,
                  12, 3.5
                ],
                'circle-color': '#60A5FA',
                'circle-opacity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  2, 0.7,
                  7, 0.9,
                  12, 1
                ]
              }}
            />
          )}

          {/* Symbol layer once image is ready */}
          {iconReady && (
            <Layer
              id="flights-layer"
              type="symbol"
              layout={{
                'icon-image': 'plane-icon',
                'icon-size': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  2, 0.02,
                  4, 0.05,
                  6, 0.08,
                  10, 0.1,
                  12, 0.15
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
          )}
        </Source>

        {/* Popup for selected flight */}
        {selectedFlight && (
          <Popup
            longitude={selectedFlight.longitude}
            latitude={selectedFlight.latitude}
            anchor="bottom"
            onClose={handlePopupClose}
            closeButton={true}
            closeOnClick={false}
            offset={[0, -15]}
          >
            <FlightPopupContent flight={selectedFlight} />
          </Popup>
        )}
        </Map>
      </div>

      {/* Process plane icon bitmap (outside Map so it persists) */}
      <PlaneIconProcessor
        src="/plane-icon.png"
        onReady={(bitmap) => {
          planeBitmapRef.current = bitmap;
          setBitmapReady(true);
        }}
      />

      {/* HUD */}
      <div className="absolute left-3 bottom-3 z-20 text-xs text-white/90 select-none">
        <div className="px-2 py-1 rounded bg-black/50 border border-white/10">
          {freeCameraEnabled ? 'Free Camera: ON (press F to return to map)' : 'Press F for Free Camera'}
        </div>
      </div>
    </div>
  );
});

MapLibreContainer.displayName = 'MapLibreContainer';

// Prevent re-renders when flights array reference changes but content is same
export default MapLibreContainer;

/**
 * Flight popup content component
 */
const FlightPopupContent = memo(({ flight }) => (
  <div className="text-sm p-2" style={{ minWidth: '200px' }}>
    <p className="font-bold text-base mb-2" style={{ color: '#fff' }}>
      {flight.callsign || 'Unknown'}
    </p>
    <div className="space-y-1" style={{ color: '#ccc' }}>
      <p><span className="font-semibold">ICAO24:</span> {flight.icao24}</p>
      <p><span className="font-semibold">Country:</span> {flight.origin_country}</p>
      {flight.velocity !== null && (
        <p><span className="font-semibold">Speed:</span> {Math.round(flight.velocity * 3.6)} km/h</p>
      )}
      {flight.baro_altitude !== null && (
        <p><span className="font-semibold">Altitude:</span> {Math.round(flight.baro_altitude)} m</p>
      )}
      <p><span className="font-semibold">Status:</span> {flight.on_ground ? '🛬 On Ground' : '✈️ In Flight'}</p>
    </div>
  </div>
));

FlightPopupContent.displayName = 'FlightPopupContent';

