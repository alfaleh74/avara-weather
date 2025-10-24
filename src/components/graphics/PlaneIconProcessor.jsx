'use client';

import { memo, useCallback } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { ImageBitmapLoader } from 'three';

function BitmapLoaderBridge({ src, onReady, options }) {
  const bitmap = useLoader(ImageBitmapLoader, src, (loader) => {
    if (options?.premultiplyAlpha) {
      loader.setOptions({ premultiplyAlpha: options.premultiplyAlpha });
    }
    if (options?.imageOrientation) {
      loader.setOptions({ ...(loader.options || {}), imageOrientation: options.imageOrientation });
    }
  });

  const notify = useCallback(() => {
    if (bitmap && onReady) onReady(bitmap);
  }, [bitmap, onReady]);

  // The Canvas render loop will call this component; notify parent when bitmap is available
  notify();
  return null;
}

const PlaneIconProcessor = memo(function PlaneIconProcessor({ src = '/plane-icon.png', onReady }) {
  return (
    <Canvas
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      gl={{ alpha: true, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: false }}
      dpr={1}
    >
      <BitmapLoaderBridge src={src} onReady={onReady} options={{ premultiplyAlpha: 'none', imageOrientation: 'none' }} />
    </Canvas>
  );
});

export default PlaneIconProcessor;


