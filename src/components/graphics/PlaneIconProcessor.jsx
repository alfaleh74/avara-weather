'use client';

import { memo, useEffect, useRef } from 'react';

/**
 * Optimized plane icon processor using native browser APIs
 * Loads and converts image to ImageBitmap for MapLibre
 */
const PlaneIconProcessor = memo(function PlaneIconProcessor({ src = '/plane-icon.png', onReady }) {
  const hasLoadedRef = useRef(false);
  const onReadyRef = useRef(onReady);
  const deliveredRef = useRef(false);
  
  // Keep the ref updated with the latest callback
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  // Reset delivery flags when src changes
  useEffect(() => {
    hasLoadedRef.current = false;
    deliveredRef.current = false;
  }, [src]);

  useEffect(() => {
    let timeoutId;

    const loadIcon = async () => {
      try {
        console.log('[PlaneIcon] Starting to load plane icon from:', src);

        // Set a timeout as a fallback
        timeoutId = setTimeout(() => {
          console.error('[PlaneIcon] ⚠️ Icon loading timed out after 10 seconds');
        }, 10000);

        // Fetch the image
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('[PlaneIcon] Image fetched, creating bitmap...');

        const blob = await response.blob();
        console.log('[PlaneIcon] Blob created, size:', blob.size, 'type:', blob.type);

        // Convert to ImageBitmap (GPU-optimized format)
        const bitmap = await createImageBitmap(blob, {
          premultiplyAlpha: 'none',
          colorSpaceConversion: 'none',
          imageOrientation: 'none'
        });

        console.log('[PlaneIcon] ImageBitmap created:', bitmap.width, 'x', bitmap.height);

        clearTimeout(timeoutId);

        // Deliver exactly once across Strict Mode mounts
        if (!deliveredRef.current) {
          deliveredRef.current = true;
          hasLoadedRef.current = true;
          if (onReadyRef.current) {
            console.log('[PlaneIcon] ✓ Calling onReady callback');
            onReadyRef.current(bitmap);
          } else {
            console.warn('[PlaneIcon] ⚠️ No onReady callback provided!');
          }
        } else {
          console.log('[PlaneIcon] Delivery already completed; skipping callback');
        }
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        console.error('[PlaneIcon] ❌ Failed to load plane icon:', error);
        console.error('[PlaneIcon] Error details:', error.message, error.stack);
      }
    };

    loadIcon();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [src]);

  return null;
});

export default PlaneIconProcessor;


