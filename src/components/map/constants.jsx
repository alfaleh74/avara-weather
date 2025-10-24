/**
 * Map Configuration Constants
 */

// Map tile configuration
export const MAP_CONFIG = {
  TILE_URL: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  INITIAL_CENTER: [20, 0],
  INITIAL_ZOOM: 3,
  PREFER_CANVAS: true,
};

// Icon configuration
export const ICON_CONFIG = {
  SIZE: 20,
  ROTATION_SNAP: 15, // Round rotation to nearest X degrees for caching
  CLASS_NAME: 'plane-icon',
};

// Performance configuration
export const PERFORMANCE_CONFIG = {
  FETCH_INTERVAL: 10000, // 10 seconds
  POSITION_CHANGE_THRESHOLD: 0.01, // degrees
  HEADING_CHANGE_THRESHOLD: 15, // degrees
  MAX_VISIBLE_MARKERS: 500, // Maximum markers to render at once
  CLUSTER_DISTANCE: 30, // Minimum pixel distance for clustering
  THROTTLE_DELAY: 100, // ms for throttling map events
};

// Z-index layers
export const Z_INDEX = {
  MAP: 0,
  MARKERS: 400,
  INFO_PANEL: 1000,
  OVERLAY: 1000,
};

// API endpoints
export const API_ENDPOINTS = {
  FLIGHTS: '/api/flights',
};

