import React, { memo, useCallback } from 'react';
import type { CrowdDensities } from '../types';
import { STADIUM_NODE_COORDINATES } from '../constants';

interface StadiumMapProps {
  selectedNode: string | null;
  onSelectNode: (node: string) => void;
  /** Occupancy percentages per section (0–100). */
  crowdDensities: CrowdDensities;
  highlightedPath: string[];
}

/**
 * Interactive SVG stadium layout.
 *
 * Each seating section and gate is keyboard-accessible:
 * - `role="button"` and `tabIndex={0}` allow Tab navigation.
 * - `onKeyDown` activates on Enter or Space (matching native button behaviour).
 * - `aria-label` announces the node name and current crowd density to screen
 *   readers (WCAG 2.1 SC 4.1.2).
 * - `aria-pressed` conveys selection state (WCAG SC 4.1.2).
 */
export const StadiumMap: React.FC<StadiumMapProps> = memo(({
  selectedNode,
  onSelectNode,
  crowdDensities,
  highlightedPath,
}) => {

  /** Converts crowd density to a traffic-light fill colour. */
  const getDensityColor = useCallback((density: number): string => {
    if (density > 80) return 'rgba(239, 68, 68, 0.7)';   // Red — congested
    if (density > 50) return 'rgba(249, 115, 22, 0.7)';  // Orange — moderate
    return 'rgba(16, 185, 129, 0.7)';                     // Green — clear
  }, []);

  /** Returns a human-readable density label for accessibility announcements. */
  const getDensityLabel = useCallback((density: number): string => {
    if (density > 80) return 'congested';
    if (density > 50) return 'moderate';
    return 'low density';
  }, []);

  /** Returns true when `nodeName` appears anywhere in the active wayfinding path. */
  const isNodeInPath = useCallback((nodeName: string): boolean => {
    return highlightedPath.some((p) => p.toLowerCase().includes(nodeName.toLowerCase()));
  }, [highlightedPath]);

  /** Returns true when `nodeName` is the currently selected map node. */
  const isNodeSelected = useCallback((nodeName: string): boolean => {
    return selectedNode?.toLowerCase() === nodeName.toLowerCase();
  }, [selectedNode]);

  /**
   * Keyboard handler for SVG interactive elements.
   * Activates on Enter or Space to match the keyboard contract of `role="button"`.
   */
  const handleKeyActivate = useCallback((nodeName: string) => {
    return (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelectNode(nodeName);
      }
    };
  }, [onSelectNode]);

  // ── Wayfinding Path Polyline ─────────────────────────────────────────────
  const wayfindingPolyline = (() => {
    if (highlightedPath.length <= 1) return null;

    const points: string[] = [];
    for (const node of highlightedPath) {
      const key = node.toLowerCase();
      let coord = STADIUM_NODE_COORDINATES[key];
      if (!coord) {
        const foundKey = Object.keys(STADIUM_NODE_COORDINATES).find(
          (k) => key.includes(k) || k.includes(key),
        );
        if (foundKey) coord = STADIUM_NODE_COORDINATES[foundKey];
      }
      if (coord) points.push(`${coord.x},${coord.y}`);
    }

    if (points.length < 2) return null;
    return (
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="8 6"
        style={{ animation: 'dash 30s linear infinite' }}
      />
    );
  })();

  // ── Shared helper: stroke props for sections ──────────────────────────────
  const sectionStrokeProps = (name: string) => ({
    stroke: isNodeSelected(name)
      ? 'var(--color-accent)'
      : isNodeInPath(name)
      ? 'var(--color-primary)'
      : 'rgba(255,255,255,0.15)',
    strokeWidth: isNodeSelected(name) || isNodeInPath(name) ? 3 : 1,
  });

  // ── Shared helper: gate fill ──────────────────────────────────────────────
  const gateFill = (name: string) =>
    isNodeSelected(name) ? 'var(--color-accent)' : isNodeInPath(name) ? 'var(--color-primary)' : '#1e1b4b';

  const gateTextFill = (name: string) => (isNodeSelected(name) ? '#000' : '#fff');

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {/* Header row */}
      <div className="map-legend-container">
        <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Interactive Stadium Layout</h3>
        {/* Density legend */}
        <div className="map-legend-list" aria-label="Crowd density legend">
          <span className="map-legend-item">
            <span className="map-legend-marker" style={{ backgroundColor: 'var(--color-success)' }} aria-hidden="true" />
            Low Density
          </span>
          <span className="map-legend-item">
            <span className="map-legend-marker" style={{ backgroundColor: 'var(--color-warning)' }} aria-hidden="true" />
            Moderate
          </span>
          <span className="map-legend-item">
            <span className="map-legend-marker" style={{ backgroundColor: 'var(--color-danger)' }} aria-hidden="true" />
            Congested
          </span>
        </div>
      </div>

      {/* SVG Map */}
      <div className="map-svg-outer-wrapper">
        <svg
          viewBox="0 0 800 500"
          width="100%"
          height="100%"
          style={{ display: 'block' }}
          aria-label="Stadium interactive map"
          role="img"
        >
          {/* Defs */}
          <defs>
            <radialGradient id="pitchGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0"   />
            </radialGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background */}
          <rect width="800" height="500" fill="transparent" />

          {/* Pitch */}
          <rect x="250" y="150" width="300" height="200" fill="#042f1a" rx="10" stroke="#10b981" strokeWidth="2" />
          <rect x="250" y="150" width="300" height="200" fill="url(#pitchGlow)" rx="10" />
          <line x1="400" y1="150" x2="400" y2="350" stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="400" cy="250" r="40" fill="none" stroke="#10b981" strokeWidth="1" />
          <rect x="250" y="210" width="30" height="80" fill="none" stroke="#10b981" strokeWidth="1" />
          <rect x="520" y="210" width="30" height="80" fill="none" stroke="#10b981" strokeWidth="1" />

          {/* Inner concourse ring */}
          <rect x="210" y="110" width="380" height="280" rx="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />

          {/* ── SEATING SECTIONS ── */}

          {/* North — Section 102 */}
          <path
            d="M 200,90 Q 400,60 600,90 L 580,120 Q 400,90 220,120 Z"
            fill={getDensityColor(crowdDensities['Section 102'] || 30)}
            {...sectionStrokeProps('Section 102')}
            onClick={() => onSelectNode('Section 102')}
            onKeyDown={handleKeyActivate('Section 102')}
            tabIndex={0}
            role="button"
            className="map-node"
            aria-label={`Section 102 — ${getDensityLabel(crowdDensities['Section 102'] || 30)}, ${crowdDensities['Section 102'] || 30}% capacity`}
            aria-pressed={isNodeSelected('Section 102')}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <title>Section 102</title>
          </path>
          <text x="400" y="100" fill="#fff" fontSize="12" fontWeight="700" textAnchor="middle" pointerEvents="none">SEC 102</text>

          {/* South — Section 108 */}
          <path
            d="M 200,410 Q 400,440 600,410 L 580,380 Q 400,410 220,380 Z"
            fill={getDensityColor(crowdDensities['Section 108'] || 45)}
            {...sectionStrokeProps('Section 108')}
            onClick={() => onSelectNode('Section 108')}
            onKeyDown={handleKeyActivate('Section 108')}
            tabIndex={0}
            role="button"
            className="map-node"
            aria-label={`Section 108 — ${getDensityLabel(crowdDensities['Section 108'] || 45)}, ${crowdDensities['Section 108'] || 45}% capacity`}
            aria-pressed={isNodeSelected('Section 108')}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <title>Section 108</title>
          </path>
          <text x="400" y="405" fill="#fff" fontSize="12" fontWeight="700" textAnchor="middle" pointerEvents="none">SEC 108</text>

          {/* West — Section 112 */}
          <path
            d="M 190,100 L 210,130 Q 150,250 210,370 L 190,400 Q 120,250 190,100 Z"
            fill={getDensityColor(crowdDensities['Section 112'] || 75)}
            {...sectionStrokeProps('Section 112')}
            onClick={() => onSelectNode('Section 112')}
            onKeyDown={handleKeyActivate('Section 112')}
            tabIndex={0}
            role="button"
            className="map-node"
            aria-label={`Section 112 — ${getDensityLabel(crowdDensities['Section 112'] || 75)}, ${crowdDensities['Section 112'] || 75}% capacity`}
            aria-pressed={isNodeSelected('Section 112')}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <title>Section 112</title>
          </path>
          <text x="165" y="255" fill="#fff" fontSize="12" fontWeight="700" textAnchor="middle" transform="rotate(-90, 165, 255)" pointerEvents="none">SEC 112</text>

          {/* East — Section 106 */}
          <path
            d="M 610,100 L 590,130 Q 650,250 590,370 L 610,400 Q 680,250 610,100 Z"
            fill={getDensityColor(crowdDensities['Section 106'] || 20)}
            {...sectionStrokeProps('Section 106')}
            onClick={() => onSelectNode('Section 106')}
            onKeyDown={handleKeyActivate('Section 106')}
            tabIndex={0}
            role="button"
            className="map-node"
            aria-label={`Section 106 — ${getDensityLabel(crowdDensities['Section 106'] || 20)}, ${crowdDensities['Section 106'] || 20}% capacity`}
            aria-pressed={isNodeSelected('Section 106')}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <title>Section 106</title>
          </path>
          <text x="635" y="255" fill="#fff" fontSize="12" fontWeight="700" textAnchor="middle" transform="rotate(90, 635, 255)" pointerEvents="none">SEC 106</text>

          {/* ── GATES ── */}

          {/* Gate A — Top Left */}
          <g
            onClick={() => onSelectNode('Gate A')}
            onKeyDown={handleKeyActivate('Gate A')}
            tabIndex={0}
            role="button"
            className="map-node"
            aria-label="Gate A — Top Left entrance"
            aria-pressed={isNodeSelected('Gate A')}
            style={{ cursor: 'pointer' }}
          >
            <circle cx="120" cy="80" r="22" fill={gateFill('Gate A')} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <text x="120" y="84" fill={gateTextFill('Gate A')} fontSize="11" fontWeight="800" textAnchor="middle">G-A</text>
          </g>

          {/* Gate B — Top Right */}
          <g
            onClick={() => onSelectNode('Gate B')}
            onKeyDown={handleKeyActivate('Gate B')}
            tabIndex={0}
            role="button"
            className="map-node"
            aria-label="Gate B — Top Right entrance"
            aria-pressed={isNodeSelected('Gate B')}
            style={{ cursor: 'pointer' }}
          >
            <circle cx="680" cy="80" r="22" fill={gateFill('Gate B')} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <text x="680" y="84" fill={gateTextFill('Gate B')} fontSize="11" fontWeight="800" textAnchor="middle">G-B</text>
          </g>

          {/* Gate C — Bottom Right */}
          <g
            onClick={() => onSelectNode('Gate C')}
            onKeyDown={handleKeyActivate('Gate C')}
            tabIndex={0}
            role="button"
            className="map-node"
            aria-label="Gate C — Bottom Right entrance"
            aria-pressed={isNodeSelected('Gate C')}
            style={{ cursor: 'pointer' }}
          >
            <circle cx="680" cy="420" r="22" fill={gateFill('Gate C')} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <text x="680" y="424" fill={gateTextFill('Gate C')} fontSize="11" fontWeight="800" textAnchor="middle">G-C</text>
          </g>

          {/* Gate D — Bottom Left */}
          <g
            onClick={() => onSelectNode('Gate D')}
            onKeyDown={handleKeyActivate('Gate D')}
            tabIndex={0}
            role="button"
            className="map-node"
            aria-label="Gate D — Bottom Left entrance"
            aria-pressed={isNodeSelected('Gate D')}
            style={{ cursor: 'pointer' }}
          >
            <circle cx="120" cy="420" r="22" fill={gateFill('Gate D')} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <text x="120" y="424" fill={gateTextFill('Gate D')} fontSize="11" fontWeight="800" textAnchor="middle">G-D</text>
          </g>

          {/* ── CONCESSIONS & STATIONS ── */}

          {/* GreenBites Vegan Food — West */}
          <g
            onClick={() => onSelectNode('GreenBites Vegan Food')}
            onKeyDown={handleKeyActivate('GreenBites Vegan Food')}
            tabIndex={0}
            role="button"
            className="map-node"
            aria-label="GreenBites Vegan Food concession"
            aria-pressed={isNodeSelected('GreenBites Vegan Food')}
            style={{ cursor: 'pointer' }}
          >
            <rect x="230" y="240" width="14" height="20" rx="3" fill={isNodeSelected('GreenBites Vegan Food') ? 'var(--color-accent)' : isNodeInPath('GreenBites Vegan Food') ? 'var(--color-primary)' : '#06b6d4'} />
            <text x="237" y="254" fill="#000" fontSize="9" fontWeight="800" textAnchor="middle">F</text>
          </g>
          <text x="210" y="253" fill="var(--text-secondary)" fontSize="9" textAnchor="end" pointerEvents="none">Eco-Bites</text>

          {/* Main Concession Row — East */}
          <g
            onClick={() => onSelectNode('Main Concession Row')}
            onKeyDown={handleKeyActivate('Main Concession Row')}
            tabIndex={0}
            role="button"
            className="map-node"
            aria-label="Main Concession Row food stand"
            aria-pressed={isNodeSelected('Main Concession Row')}
            style={{ cursor: 'pointer' }}
          >
            <rect x="556" y="240" width="14" height="20" rx="3" fill={isNodeSelected('Main Concession Row') ? 'var(--color-accent)' : isNodeInPath('Main Concession Row') ? 'var(--color-primary)' : '#06b6d4'} />
            <text x="563" y="254" fill="#000" fontSize="9" fontWeight="800" textAnchor="middle">F</text>
          </g>
          <text x="578" y="253" fill="var(--text-secondary)" fontSize="9" textAnchor="start" pointerEvents="none">Main Food</text>

          {/* Medical Hub — South concourse */}
          <g
            onClick={() => onSelectNode('Medical Hub')}
            onKeyDown={handleKeyActivate('Medical Hub')}
            tabIndex={0}
            role="button"
            className="map-node"
            aria-label="Medical Hub — First Aid station"
            aria-pressed={isNodeSelected('Medical Hub')}
            style={{ cursor: 'pointer' }}
          >
            <rect x="390" y="365" width="20" height="20" rx="4" fill={isNodeSelected('Medical Hub') ? 'var(--color-accent)' : isNodeInPath('Medical Hub') ? 'var(--color-primary)' : 'var(--color-danger)'} />
            <path d="M 400,370 L 400,380 M 395,375 L 405,375" stroke="#fff" strokeWidth="2.5" />
          </g>
          <text x="400" y="397" fill="var(--text-secondary)" fontSize="9" textAnchor="middle" pointerEvents="none">First-Aid</text>

          {/* Eco-Bin A — near Gate A */}
          <g
            onClick={() => onSelectNode('Eco-Bin A')}
            onKeyDown={handleKeyActivate('Eco-Bin A')}
            tabIndex={0}
            role="button"
            className="map-node"
            aria-label="Eco recycling bin near Gate A"
            aria-pressed={isNodeSelected('Eco-Bin A')}
            style={{ cursor: 'pointer' }}
          >
            <circle cx="160" cy="110" r="8" fill={isNodeSelected('Eco-Bin A') ? 'var(--color-accent)' : isNodeInPath('Eco-Bin A') ? 'var(--color-primary)' : '#22c55e'} />
            <text x="160" y="113" fill="#fff" fontSize="8" fontWeight="800" textAnchor="middle">B</text>
          </g>

          {/* Eco-Bin C — near Gate C */}
          <g
            onClick={() => onSelectNode('Eco-Bin C')}
            onKeyDown={handleKeyActivate('Eco-Bin C')}
            tabIndex={0}
            role="button"
            className="map-node"
            aria-label="Eco recycling bin near Gate C"
            aria-pressed={isNodeSelected('Eco-Bin C')}
            style={{ cursor: 'pointer' }}
          >
            <circle cx="640" cy="390" r="8" fill={isNodeSelected('Eco-Bin C') ? 'var(--color-accent)' : isNodeInPath('Eco-Bin C') ? 'var(--color-primary)' : '#22c55e'} />
            <text x="640" y="393" fill="#fff" fontSize="8" fontWeight="800" textAnchor="middle">B</text>
          </g>

          {/* ── WAYFINDING PATH OVERLAY ── */}
          {wayfindingPolyline && (
            <g opacity="0.85" filter="url(#glow)">
              {wayfindingPolyline}
            </g>
          )}
        </svg>
      </div>

      {/* Usage tip */}
      <div className="map-tip-box">
        <p>
          💡 <strong>Tip:</strong> Click or press <kbd>Enter</kbd> / <kbd>Space</kbd> on any seating section, gate, first-aid station, or concession on the map to select it as a waypoint, inspect its details, or use it in the navigation tool.
        </p>
      </div>
    </div>
  );
});

StadiumMap.displayName = 'StadiumMap';
