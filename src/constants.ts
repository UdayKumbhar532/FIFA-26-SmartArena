/**
 * Application-wide constants for FIFA 26 SmartArena.
 *
 * Centralising magic numbers and configuration objects here means components
 * can import what they need without recreating data on every render and
 * without scattering literal values throughout JSX.
 */

import type { CrowdDensities, TravelMethod, AppView } from './types';

// ---------------------------------------------------------------------------
// Crowd Densities
// ---------------------------------------------------------------------------

/** Initial crowd occupancy percentages used on application load. */
export const DEFAULT_CROWD_DENSITIES: CrowdDensities = {
  'Section 102': 35,
  'Section 106': 18,
  'Section 108': 42,
  'Section 112': 78,
} as const;

// ---------------------------------------------------------------------------
// Carbon / Sustainability
// ---------------------------------------------------------------------------

/**
 * CO₂ emission factors in kg per passenger-kilometre.
 * Source: averaged regional transport authority data for FIFA 2026 host cities.
 */
export const CO2_EMISSION_FACTORS: Record<TravelMethod, number> = {
  walking:   0.000, // Zero-carbon
  metro:     0.035, // Electric rail
  bus:       0.100, // Diesel/hybrid shuttle
  rideshare: 0.170, // Shared car
} as const;

/**
 * Baseline single-occupancy car emission factor (kg CO₂ / km).
 * Used to compute the offset relative to the chosen travel method.
 */
export const BASELINE_CAR_EMISSION_FACTOR = 0.220;

// ---------------------------------------------------------------------------
// Stadium Map — Node Coordinates
// ---------------------------------------------------------------------------

/**
 * Approximate SVG pixel coordinates for each named stadium node.
 * Stored here as a module-level constant so `StadiumMap` does not recreate
 * this map on every render.
 */
export const STADIUM_NODE_COORDINATES: Readonly<Record<string, { x: number; y: number }>> = {
  'gate a':                    { x: 120, y: 80  },
  'gate b':                    { x: 680, y: 80  },
  'gate c':                    { x: 680, y: 420 },
  'gate d':                    { x: 120, y: 420 },
  'section 102':               { x: 400, y: 85  },
  'section 104':               { x: 310, y: 85  },
  'section 104 ada deck':      { x: 300, y: 85  },
  'section 104 entrance':      { x: 320, y: 85  },
  'section 106':               { x: 615, y: 250 },
  'section 108':               { x: 400, y: 415 },
  'section 112':               { x: 185, y: 250 },
  'greenbites vegan food':     { x: 237, y: 250 },
  'main concession row':       { x: 563, y: 250 },
  'medical hub':               { x: 400, y: 375 },
  'eco-bin a':                 { x: 160, y: 110 },
  'eco-bin c':                 { x: 640, y: 390 },
  'stairs corridor a':         { x: 280, y: 110 },
  'level 1 concourse':         { x: 400, y: 120 },
  'accessible ramp a':         { x: 250, y: 120 },
  'south concourse elevator':  { x: 300, y: 380 },
  'level 1 corridor (flat)':   { x: 400, y: 380 },
  'flat west concourse':       { x: 230, y: 300 },
  'west stairs':               { x: 210, y: 200 },
  'west concourse escalators': { x: 180, y: 150 },
  'concave ramp west':         { x: 220, y: 120 },
} as const;

// ---------------------------------------------------------------------------
// Navigation Menu Items
// ---------------------------------------------------------------------------

/** Navigation targets surfaced in the slide-out drawer. */
export interface MenuItem {
  id: string;
  label: string;
  view: AppView;
  description: string;
}

export const MENU_ITEMS: readonly MenuItem[] = [
  {
    id: 'incident-queue',
    label: 'Incidents',
    view: 'staff',
    description: 'Active dispatch queue',
  },
  {
    id: 'ai-support',
    label: 'AI Support',
    view: 'fan',
    description: 'Fan companion & chat',
  },
  {
    id: 'crowd-heatmap',
    label: 'Crowd Heat Map',
    view: 'staff',
    description: 'Live density monitor',
  },
  {
    id: 'analytics-section',
    label: 'Analytics',
    view: 'staff',
    description: 'Eco & operations data',
  },
] as const;

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

/** Crowd density percentage above which a section is considered congested. */
export const CROWD_CRITICAL_THRESHOLD = 75;

/** Crowd density percentage above which a section is considered high-density. */
export const CROWD_HIGH_THRESHOLD = 70;

/** Eco-bin fill percentage above which an overflow alert is shown. */
export const BIN_ALERT_THRESHOLD = 80;

/** Eco-bin fill percentage above which a moderate warning is shown. */
export const BIN_WARNING_THRESHOLD = 50;

/** Maximum characters allowed in the raw incident dispatch textarea. */
export const MAX_INCIDENT_REPORT_LENGTH = 1000;
