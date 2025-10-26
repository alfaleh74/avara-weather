/**
 * Colored Plane Icon Processor
 * Creates altitude-colored versions of plane icons using canvas tinting
 */

'use client';

import { memo, useEffect, useRef } from 'react';
import { getAltitudeColor } from '../map/AltitudeLegend.jsx';

/**
 * Pre-defined altitude ranges for icon generation
 * Aligned with OpenSky color transition points
 * 'ground' is a special key for grounded aircraft (solid red)
 */
const ALTITUDE_RANGES = [
  'ground', 0, 2000, 4000, 6000, 8000, 9000, 11000, 20000, 30000, 40000, 51000
];

/**
 * Tint an image with a color using canvas
 */
const tintImage = (imageBitmap, color) => {
  const canvas = document.createElement('canvas');
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;
  const ctx = canvas.getContext('2d');
  
  // Draw the original image
  ctx.drawImage(imageBitmap, 0, 0);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Parse color
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  // Apply color tint to non-transparent pixels
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha > 0) {
      // Blend the color with the original pixel
      const factor = 0.7; // Tint strength
      data[i] = Math.min(255, data[i] * (1 - factor) + r * factor);     // Red
      data[i + 1] = Math.min(255, data[i + 1] * (1 - factor) + g * factor); // Green
      data[i + 2] = Math.min(255, data[i + 2] * (1 - factor) + b * factor); // Blue
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  return canvas;
};

/**
 * ColoredPlaneIconProcessor
 * Loads plane icon and creates colored versions for different altitudes
 */
const ColoredPlaneIconProcessor = memo(function ColoredPlaneIconProcessor({ 
  src = '/planes-icon.png', 
  onReady 
}) {
  const hasLoadedRef = useRef(false);
  const onReadyRef = useRef(onReady);
  const deliveredRef = useRef(false);
  
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    hasLoadedRef.current = false;
    deliveredRef.current = false;
  }, [src]);

  useEffect(() => {
    let timeoutId;

    const loadAndTintIcons = async () => {
      try {
        console.log('[ColoredPlaneIcon] Starting to load and tint plane icons from:', src);

        timeoutId = setTimeout(() => {
          console.error('[ColoredPlaneIcon] ⚠️ Icon loading timed out after 10 seconds');
        }, 10000);

        // Fetch the base image
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const baseBitmap = await createImageBitmap(blob, {
          premultiplyAlpha: 'none',
          colorSpaceConversion: 'none',
          imageOrientation: 'none'
        });

        console.log('[ColoredPlaneIcon] Base image loaded:', baseBitmap.width, 'x', baseBitmap.height);

        // Create tinted versions for each altitude range
        const coloredIcons = {};
        
        for (const altitude of ALTITUDE_RANGES) {
          const color = getAltitudeColor(altitude);
          const tintedCanvas = tintImage(baseBitmap, color);
          
          // Convert canvas to ImageBitmap
          const tintedBitmap = await createImageBitmap(tintedCanvas);
          coloredIcons[altitude] = tintedBitmap;
        }

        console.log('[ColoredPlaneIcon] ✓ Created', Object.keys(coloredIcons).length, 'colored plane icons');

        clearTimeout(timeoutId);

        if (!deliveredRef.current) {
          deliveredRef.current = true;
          hasLoadedRef.current = true;
          if (onReadyRef.current) {
            console.log('[ColoredPlaneIcon] ✓ Calling onReady callback with colored icons');
            onReadyRef.current(coloredIcons);
          }
        }
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        console.error('[ColoredPlaneIcon] ❌ Failed to create colored plane icons:', error);
      }
    };

    loadAndTintIcons();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [src]);

  return null;
});

export default ColoredPlaneIconProcessor;

/**
 * Get the appropriate icon key for an altitude
 * @param {number|string} altitudeFeet - Altitude in feet, or 'ground' for grounded aircraft
 */
export const getIconKeyForAltitude = (altitudeFeet) => {
  // Special case for grounded aircraft
  if (altitudeFeet === 'ground') return 'ground';
  
  if (!altitudeFeet || altitudeFeet < 0) return 0;
  if (altitudeFeet >= 51000) return 51000;
  
  // Find closest altitude range (skip 'ground' at index 0)
  for (let i = ALTITUDE_RANGES.length - 1; i >= 1; i--) {
    if (altitudeFeet >= ALTITUDE_RANGES[i]) {
      return ALTITUDE_RANGES[i];
    }
  }
  return 0;
};

