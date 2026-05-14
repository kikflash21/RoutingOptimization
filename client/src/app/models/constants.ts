import { latLng, MapOptions, tileLayer } from 'leaflet';

// ═══════════════════════════════════════════════════════════════════
//  ORS API LIMITS
// ═══════════════════════════════════════════════════════════════════

/** Max locations per ORS matrix chunk */
export const ORS_MATRIX_CHUNK_SIZE = 50;

/** Delay between ORS matrix API calls (ms) */
export const ORS_MATRIX_DELAY_MS = 4000;

/** Max retries for a failed ORS matrix chunk */
export const ORS_MATRIX_MAX_RETRIES = 4;

/** Max jobs per ORS optimization call */
export const ORS_OPTIMIZATION_MAX_JOBS = 55;

// ═══════════════════════════════════════════════════════════════════
//  MAP
// ═══════════════════════════════════════════════════════════════════

/** Default map center (Grenoble) */
const MAP_DEFAULT_CENTER = latLng(45.188529, 5.724524);

const MAP_DEFAULT_ZOOM = 12;

export const MAP_OPTIONS: MapOptions = {
  zoom: MAP_DEFAULT_ZOOM,
  center: MAP_DEFAULT_CENTER,
};

export const BASE_TILE_LAYER = tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  { maxZoom: 18 },
);

// ═══════════════════════════════════════════════════════════════════
//  COLORS
// ═══════════════════════════════════════════════════════════════════

/**
 * Consistent palette for clusters / tournées.
 * Ordered so consecutive teams get visually distinct hues (no two blues, no two greens adjacent).
 */
export const CLUSTER_COLORS: readonly string[] = [
  '#e74c3c', // red
  '#27ae60', // green
  '#2980b9', // blue
  '#ff7f0e', // orange
  '#8e44ad', // purple
  '#f1c40f', // yellow
  '#1abc9c', // turquoise
  '#e91e63', // pink
  '#795548', // brown
  '#6b7280', // gray
];

export const COLOR_DEPOT = '#ef4444';
export const COLOR_UNASSIGNED = '#f59e0b';
export const COLOR_NEUTRAL = '#94a3b8';

// ═══════════════════════════════════════════════════════════════════
//  STATS THRESHOLDS
// ═══════════════════════════════════════════════════════════════════

export const STAT_COLOR_EXCELLENT = '#22c55e';
export const STAT_COLOR_GOOD     = '#84cc16';
export const STAT_COLOR_WARNING  = '#f59e0b';
export const STAT_COLOR_DANGER   = '#ef4444';

export const STAT_THRESHOLD_EXCELLENT = 0.95;
export const STAT_THRESHOLD_GOOD      = 0.80;
export const STAT_THRESHOLD_WARNING   = 0.60;

// ═══════════════════════════════════════════════════════════════════
//  DEFAULTS
// ═══════════════════════════════════════════════════════════════════

/** Default max time per vehicle in seconds (3h) */
export const DEFAULT_MAX_TIME_SECONDS = 10800;

/** Pagination page size for commandes table */
export const COMMANDES_PAGE_SIZE = 8;
