/**
 * Altitude Legend Component
 * Displays a color-coded altitude scale for flight visualization
 * Uses OpenSky color scheme with HSL interpolation
 */

'use client';

import { memo } from 'react';
import { Z_INDEX } from './constants.jsx';

/**
 * OpenSky color configuration using HSL
 * (Hue: 0-359, Saturation: 0-100, Lightness: 0-100)
 */
const ColorByAlt = {
  // HSL for planes with unknown altitude:
  unknown: { h: 0, s: 0, l: 75 },

  // HSL for planes that are on the ground: solid red
  ground: { h: 0, s: 100, l: 45 },

  air: {
    // Altitude-to-hue mappings with linear interpolation
    h: [
      { alt: 0, val: 20 },      // orange
      { alt: 2000, val: 32.5 }, // yellow
      { alt: 4000, val: 43 },   // yellow
      { alt: 6000, val: 54 },   // yellow
      { alt: 8000, val: 72 },   // yellow
      { alt: 9000, val: 85 },   // green yellow
      { alt: 11000, val: 140 }, // light green
      { alt: 40000, val: 300 }, // magenta
      { alt: 51000, val: 360 }, // red
    ],
    s: 88,
    l: [
      { h: 0, val: 53 },
      { h: 20, val: 50 },
      { h: 32, val: 54 },
      { h: 40, val: 52 },
      { h: 46, val: 51 },
      { h: 50, val: 46 },
      { h: 60, val: 43 },
      { h: 80, val: 41 },
      { h: 100, val: 41 },
      { h: 120, val: 41 },
      { h: 140, val: 41 },
      { h: 160, val: 40 },
      { h: 180, val: 40 },
      { h: 190, val: 44 },
      { h: 198, val: 50 },
      { h: 200, val: 58 },
      { h: 220, val: 58 },
      { h: 240, val: 58 },
      { h: 255, val: 55 },
      { h: 266, val: 55 },
      { h: 270, val: 58 },
      { h: 280, val: 58 },
      { h: 290, val: 47 },
      { h: 300, val: 43 },
      { h: 310, val: 48 },
      { h: 320, val: 48 },
      { h: 340, val: 52 },
      { h: 360, val: 53 },
    ],
  },

  // Modifiers for special states
  selected: { h: 0, s: 10, l: 5 },
  stale: { h: 0, s: -35, l: 9 },
  mlat: { h: 0, s: 0, l: 0 }
};

/**
 * Calculate altitude color using OpenSky HSL interpolation
 */
function altitudeColor(altitude) {
  let h, s, l;

  if (altitude == null) {
    h = ColorByAlt.unknown.h;
    s = ColorByAlt.unknown.s;
    l = ColorByAlt.unknown.l;
  } else if (altitude === "ground") {
    h = ColorByAlt.ground.h;
    s = ColorByAlt.ground.s;
    l = ColorByAlt.ground.l;
  } else {
    // Round altitude to limit number of colors
    const altRound = (altitude < 8000) ? 50 : 500;
    altitude = altRound * Math.round(altitude / altRound);

    s = ColorByAlt.air.s;

    // Interpolate hue based on altitude
    let hpoints = ColorByAlt.air.h;
    h = hpoints[0].val;
    for (let i = hpoints.length - 1; i >= 0; --i) {
      if (altitude > hpoints[i].alt) {
        if (i == hpoints.length - 1) {
          h = hpoints[i].val;
        } else {
          h = hpoints[i].val + (hpoints[i + 1].val - hpoints[i].val) * 
              (altitude - hpoints[i].alt) / (hpoints[i + 1].alt - hpoints[i].alt);
        }
        break;
      }
    }

    // Interpolate lightness based on hue
    let lpoints = ColorByAlt.air.l;
    l = lpoints[0].val;
    for (let i = lpoints.length - 1; i >= 0; --i) {
      if (h > lpoints[i].h) {
        if (i == lpoints.length - 1) {
          l = lpoints[i].val;
        } else {
          l = lpoints[i].val + (lpoints[i + 1].val - lpoints[i].val) * 
              (h - lpoints[i].h) / (lpoints[i + 1].h - lpoints[i].h);
        }
        break;
      }
    }
  }

  // Normalize values
  if (h < 0) {
    h = (h % 360) + 360;
  } else if (h >= 360) {
    h = h % 360;
  }

  if (s < 0) s = 0;
  else if (s > 95) s = 95;

  if (l < 0) l = 0;
  else if (l > 95) l = 95;

  return [h, s, l];
}

/**
 * Convert HSL array to CSS string
 */
function hslToCss(hsl) {
  return `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;
}

/**
 * Convert HSL array to hex color
 */
function hslToHex(hsl) {
  const [h, s, l] = hsl;
  const hDecimal = h / 360;
  const sDecimal = s / 100;
  const lDecimal = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = lDecimal;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = lDecimal < 0.5 ? lDecimal * (1 + sDecimal) : lDecimal + sDecimal - lDecimal * sDecimal;
    const p = 2 * lDecimal - q;

    r = hue2rgb(p, q, hDecimal + 1 / 3);
    g = hue2rgb(p, q, hDecimal);
    b = hue2rgb(p, q, hDecimal - 1 / 3);
  }

  const toHex = (x) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Get color for a specific altitude (returns hex color)
 */
export const getAltitudeColor = (altitude) => {
  const hsl = altitudeColor(altitude);
  return hslToHex(hsl);
};

/**
 * Altitude ranges for legend display
 */
const ALTITUDE_RANGES = [
  0, 2000, 4000, 6000, 8000, 9000, 11000, 20000, 30000, 40000, 51000
];

/**
 * Generate altitude colors for legend
 */
const ALTITUDE_COLORS = ALTITUDE_RANGES.map(altitude => ({
  altitude,
  color: getAltitudeColor(altitude)
}));

/**
 * OpenSky non-linear altitude-to-position mapping
 * Gives more visual space to lower altitudes where most aircraft operate
 * [position_percentage, altitude_in_feet]
 */
const ALTITUDE_TO_POSITION_MAP = [
  [0, 0],
  [0.033, 500],
  [0.066, 1000],
  [0.126, 2000],
  [0.19, 4000],
  [0.253, 6000],
  [0.316, 8000],
  [0.38, 10000],
  [0.59, 20000],
  [0.79, 30000],
  [1.0, 40000]
];

/**
 * Format altitude label for display
 */
const formatAltitude = (altitude) => {
  if (altitude === 0) return '0';
  if (altitude >= 1000) {
    const k = altitude / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return altitude.toString();
};

/**
 * Generate gradient stops using OpenSky's non-linear mapping
 * This matches the exact visual appearance of OpenSky's altitude bar
 */
const generateGradientStops = () => {
  return ALTITUDE_TO_POSITION_MAP.map(([offset, altitude]) => {
    const hsl = altitudeColor(altitude);
    const percentage = offset * 100;
    return `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%) ${percentage.toFixed(1)}%`;
  }).join(', ');
};

/**
 * Key altitude markers to display on the legend
 * Uses OpenSky's non-linear positioning
 */
const LEGEND_MARKERS = [
  { altitude: 0, offset: 0, label: '0' },
  { altitude: 2000, offset: 0.126, label: '2k' },
  { altitude: 4000, offset: 0.19, label: '4k' },
  { altitude: 6000, offset: 0.253, label: '6k' },
  { altitude: 8000, offset: 0.316, label: '8k' },
  { altitude: 10000, offset: 0.38, label: '10k' },
  { altitude: 20000, offset: 0.59, label: '20k' },
  { altitude: 30000, offset: 0.79, label: '30k' },
  { altitude: 40000, offset: 1.0, label: '40k+' },
];

/**
 * Altitude Legend Component
 */
export const AltitudeLegend = memo(() => {
  // Generate smooth gradient for the bar
  const gradientStops = generateGradientStops();

  return (
    <div 
      className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-zinc-900/95 backdrop-blur-sm text-white px-4 pt-2 pb-4 rounded-lg shadow-xl border border-zinc-700"
      style={{ zIndex: Z_INDEX.OVERLAY }}
    >
      <div className="flex items-center gap-4">
        {/* Label */}
        <div className="text-xs font-semibold text-zinc-300 whitespace-nowrap">
          ALTITUDE (ft)
        </div>
        
        {/* Gradient bar */}
        <div className="relative h-4 w-[540px]">
          {/* Background gradient */}
          <div 
            className="absolute inset-0 rounded"
            style={{
              background: `linear-gradient(to right, ${gradientStops})`,
            }}
          />
          
          {/* Altitude markers */}
          <div className="absolute inset-0">
            {LEGEND_MARKERS.map((marker) => {
              const position = marker.offset * 100;
              
              return (
                <div 
                  key={marker.altitude}
                  className="absolute"
                  style={{ 
                    left: `${position}%`,
                    transform: 'translateX(-50%)',
                    bottom: 0,
                  }}
                >
                  {/* Tick mark */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-px h-2 bg-white/90" />
                  
                  {/* Label */}
                  <div 
                    className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-[10px] font-medium text-zinc-300 whitespace-nowrap"
                  >
                    {marker.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

AltitudeLegend.displayName = 'AltitudeLegend';

export default AltitudeLegend;

