/**
 * Shared domain types for FIFA 26 SmartArena.
 *
 * All interfaces and union types used across components and services are
 * defined here so that imports are consistent and there is a single source
 * of truth for each domain model.
 */

// ---------------------------------------------------------------------------
// Incident Domain
// ---------------------------------------------------------------------------

/** Supported incident categories recognised by the AI dispatcher. */
export type IncidentCategory =
  | 'Medical'
  | 'Safety'
  | 'Facilities'
  | 'Crowd'
  | 'Sustainability'
  | 'Other';

/** Supported severity levels for dispatched incidents. */
export type IncidentPriority = 'Critical' | 'High' | 'Medium' | 'Low';

/** A structured incident record produced by the AI or the offline simulator. */
export interface ParsedIncident {
  id: string; // Unique stable ID for React key reconciliation
  category: IncidentCategory;
  priority: IncidentPriority;
  location: string;
  description: string;
  remediationSteps: string[];
}

// ---------------------------------------------------------------------------
// Chat Domain
// ---------------------------------------------------------------------------

/** A chat message record in the ArenaMind message log. */
export interface ChatMessage {
  id: string; // Unique stable ID for React key reconciliation
  sender: 'user' | 'ai';
  text: string;
}

// ---------------------------------------------------------------------------
// Wayfinding Domain
// ---------------------------------------------------------------------------

/** A navigational route through the stadium produced by the AI or simulator. */
export interface RouteDetail {
  /** Ordered list of node names (e.g. ['Gate A', 'Concession B', 'Section 104']). */
  path: string[];
  accessibilityFriendly: boolean;
  warnings: string[];
  directions: string[];
  estimatedTimeMin: number;
}

// ---------------------------------------------------------------------------
// Crowd Domain
// ---------------------------------------------------------------------------

/** Map of section name → occupancy percentage (0–100). */
export type CrowdDensities = Record<string, number>;

// ---------------------------------------------------------------------------
// Sustainability Domain
// ---------------------------------------------------------------------------

/** Travel methods supported by the carbon calculator. */
export type TravelMethod = 'metro' | 'bus' | 'rideshare' | 'walking';

// ---------------------------------------------------------------------------
// View Domain
// ---------------------------------------------------------------------------

/** Named views in the main application workspace. */
export type AppView = 'fan' | 'staff' | 'settings';
