import React from 'react';

interface StadiumMapProps {
  selectedNode: string | null;
  onSelectNode: (node: string) => void;
  crowdDensities: { [key: string]: number }; // percentage 0 - 100
  highlightedPath: string[];
}

export const StadiumMap: React.FC<StadiumMapProps> = ({
  selectedNode,
  onSelectNode,
  crowdDensities,
  highlightedPath,
}) => {
  // Get color based on crowd density percentage
  const getDensityColor = (density: number) => {
    if (density > 80) return 'rgba(239, 68, 68, 0.7)'; // Red
    if (density > 50) return 'rgba(249, 115, 22, 0.7)'; // Orange
    return 'rgba(16, 185, 129, 0.7)'; // Green
  };

  // Helper to determine if a node is in the wayfinding path
  const isNodeInPath = (nodeName: string) => {
    return highlightedPath.some(p => p.toLowerCase().includes(nodeName.toLowerCase()));
  };

  // Check if node is selected
  const isNodeSelected = (nodeName: string) => {
    return selectedNode?.toLowerCase() === nodeName.toLowerCase();
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Interactive Stadium Layout</h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', fontSize: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
            Low Density
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-warning)' }} />
            Moderate
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-danger)' }} />
            Congested
          </span>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
        <svg
          viewBox="0 0 800 500"
          width="100%"
          height="100%"
          style={{ display: 'block' }}
        >
          {/* Defs for gradients & filters */}
          <defs>
            <radialGradient id="pitchGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* BACKGROUND STADIUM GRAPHICS */}
          <rect width="800" height="500" fill="transparent" />
          
          {/* Main Pitch Field */}
          <rect x="250" y="150" width="300" height="200" fill="#042f1a" rx="10" stroke="#10b981" strokeWidth="2" />
          <rect x="250" y="150" width="300" height="200" fill="url(#pitchGlow)" rx="10" />
          {/* Center line and circle */}
          <line x1="400" y1="150" x2="400" y2="350" stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="400" cy="250" r="40" fill="none" stroke="#10b981" strokeWidth="1" />
          {/* Goal boxes */}
          <rect x="250" y="210" width="30" height="80" fill="none" stroke="#10b981" strokeWidth="1" />
          <rect x="520" y="210" width="30" height="80" fill="none" stroke="#10b981" strokeWidth="1" />

          {/* INNER CONCOURSE RING */}
          <rect x="210" y="110" width="380" height="280" rx="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />

          {/* SEATING SECTIONS (Interactive Heatmap Layers) */}
          
          {/* North Sections */}
          <path
            d="M 200,90 Q 400,60 600,90 L 580,120 Q 400,90 220,120 Z"
            fill={getDensityColor(crowdDensities['Section 102'] || 30)}
            stroke={isNodeSelected('Section 102') ? 'var(--color-accent)' : isNodeInPath('Section 102') ? 'var(--color-primary)' : 'rgba(255,255,255,0.15)'}
            strokeWidth={isNodeSelected('Section 102') || isNodeInPath('Section 102') ? 3 : 1}
            onClick={() => onSelectNode('Section 102')}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <title>Section 102</title>
          </path>
          <text x="400" y="100" fill="#fff" fontSize="12" fontWeight="700" textAnchor="middle" pointerEvents="none">SEC 102</text>

          {/* South Sections */}
          <path
            d="M 200,410 Q 400,440 600,410 L 580,380 Q 400,410 220,380 Z"
            fill={getDensityColor(crowdDensities['Section 108'] || 45)}
            stroke={isNodeSelected('Section 108') ? 'var(--color-accent)' : isNodeInPath('Section 108') ? 'var(--color-primary)' : 'rgba(255,255,255,0.15)'}
            strokeWidth={isNodeSelected('Section 108') || isNodeInPath('Section 108') ? 3 : 1}
            onClick={() => onSelectNode('Section 108')}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <title>Section 108</title>
          </path>
          <text x="400" y="405" fill="#fff" fontSize="12" fontWeight="700" textAnchor="middle" pointerEvents="none">SEC 108</text>

          {/* West Sections (Split in 2) */}
          {/* Section 112 */}
          <path
            d="M 190,100 L 210,130 Q 150,250 210,370 L 190,400 Q 120,250 190,100 Z"
            fill={getDensityColor(crowdDensities['Section 112'] || 75)}
            stroke={isNodeSelected('Section 112') ? 'var(--color-accent)' : isNodeInPath('Section 112') ? 'var(--color-primary)' : 'rgba(255,255,255,0.15)'}
            strokeWidth={isNodeSelected('Section 112') || isNodeInPath('Section 112') ? 3 : 1}
            onClick={() => onSelectNode('Section 112')}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <title>Section 112</title>
          </path>
          <text x="165" y="255" fill="#fff" fontSize="12" fontWeight="700" textAnchor="middle" transform="rotate(-90, 165, 255)" pointerEvents="none">SEC 112</text>

          {/* East Sections */}
          {/* Section 106 */}
          <path
            d="M 610,100 L 590,130 Q 650,250 590,370 L 610,400 Q 680,250 610,100 Z"
            fill={getDensityColor(crowdDensities['Section 106'] || 20)}
            stroke={isNodeSelected('Section 106') ? 'var(--color-accent)' : isNodeInPath('Section 106') ? 'var(--color-primary)' : 'rgba(255,255,255,0.15)'}
            strokeWidth={isNodeSelected('Section 106') || isNodeInPath('Section 106') ? 3 : 1}
            onClick={() => onSelectNode('Section 106')}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <title>Section 106</title>
          </path>
          <text x="635" y="255" fill="#fff" fontSize="12" fontWeight="700" textAnchor="middle" transform="rotate(90, 635, 255)" pointerEvents="none">SEC 106</text>

          {/* GATES (Outermost boundary) */}
          {/* Gate A (Top Left) */}
          <g onClick={() => onSelectNode('Gate A')} style={{ cursor: 'pointer' }}>
            <circle cx="120" cy="80" r="22" fill={isNodeSelected('Gate A') ? 'var(--color-accent)' : isNodeInPath('Gate A') ? 'var(--color-primary)' : '#1e1b4b'} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <text x="120" y="84" fill={isNodeSelected('Gate A') ? '#000' : '#fff'} fontSize="11" fontWeight="800" textAnchor="middle">G-A</text>
          </g>

          {/* Gate B (Top Right) */}
          <g onClick={() => onSelectNode('Gate B')} style={{ cursor: 'pointer' }}>
            <circle cx="680" cy="80" r="22" fill={isNodeSelected('Gate B') ? 'var(--color-accent)' : isNodeInPath('Gate B') ? 'var(--color-primary)' : '#1e1b4b'} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <text x="680" y="84" fill={isNodeSelected('Gate B') ? '#000' : '#fff'} fontSize="11" fontWeight="800" textAnchor="middle">G-B</text>
          </g>

          {/* Gate C (Bottom Right) */}
          <g onClick={() => onSelectNode('Gate C')} style={{ cursor: 'pointer' }}>
            <circle cx="680" cy="420" r="22" fill={isNodeSelected('Gate C') ? 'var(--color-accent)' : isNodeInPath('Gate C') ? 'var(--color-primary)' : '#1e1b4b'} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <text x="680" y="424" fill={isNodeSelected('Gate C') ? '#000' : '#fff'} fontSize="11" fontWeight="800" textAnchor="middle">G-C</text>
          </g>

          {/* Gate D (Bottom Left) */}
          <g onClick={() => onSelectNode('Gate D')} style={{ cursor: 'pointer' }}>
            <circle cx="120" cy="420" r="22" fill={isNodeSelected('Gate D') ? 'var(--color-accent)' : isNodeInPath('Gate D') ? 'var(--color-primary)' : '#1e1b4b'} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <text x="120" y="424" fill={isNodeSelected('Gate D') ? '#000' : '#fff'} fontSize="11" fontWeight="800" textAnchor="middle">G-D</text>
          </g>

          {/* CONCESSIONS AND STATIONS */}
          {/* Concession Stand West (GreenBites Vegan Food) */}
          <g onClick={() => onSelectNode('GreenBites Vegan Food')} style={{ cursor: 'pointer' }}>
            <rect x="230" y="240" width="14" height="20" rx="3" fill={isNodeSelected('GreenBites Vegan Food') ? 'var(--color-accent)' : isNodeInPath('GreenBites Vegan Food') ? 'var(--color-primary)' : '#06b6d4'} />
            <text x="237" y="254" fill="#000" fontSize="9" fontWeight="800" textAnchor="middle">F</text>
          </g>
          <text x="210" y="253" fill="var(--text-secondary)" fontSize="9" textAnchor="end">Eco-Bites</text>

          {/* Concession Stand East (Main Concession Row) */}
          <g onClick={() => onSelectNode('Main Concession Row')} style={{ cursor: 'pointer' }}>
            <rect x="556" y="240" width="14" height="20" rx="3" fill={isNodeSelected('Main Concession Row') ? 'var(--color-accent)' : isNodeInPath('Main Concession Row') ? 'var(--color-primary)' : '#06b6d4'} />
            <text x="563" y="254" fill="#000" fontSize="9" fontWeight="800" textAnchor="middle">F</text>
          </g>
          <text x="578" y="253" fill="var(--text-secondary)" fontSize="9" textAnchor="start">Main Food</text>

          {/* First Aid Station (Medical Hub) */}
          <g onClick={() => onSelectNode('Medical Hub')} style={{ cursor: 'pointer' }}>
            <rect x="390" y="365" width="20" height="20" rx="4" fill={isNodeSelected('Medical Hub') ? 'var(--color-accent)' : isNodeInPath('Medical Hub') ? 'var(--color-primary)' : 'var(--color-danger)'} />
            <path d="M 400,370 L 400,380 M 395,375 L 405,375" stroke="#fff" strokeWidth="2.5" />
          </g>
          <text x="400" y="397" fill="var(--text-secondary)" fontSize="9" textAnchor="middle">First-Aid</text>

          {/* ECO-BIN STATIONS */}
          {/* Bin 1 (near Gate A) */}
          <g onClick={() => onSelectNode('Eco-Bin A')} style={{ cursor: 'pointer' }}>
            <circle cx="160" cy="110" r="8" fill={isNodeSelected('Eco-Bin A') ? 'var(--color-accent)' : isNodeInPath('Eco-Bin A') ? 'var(--color-primary)' : '#22c55e'} />
            <text x="160" y="113" fill="#fff" fontSize="8" fontWeight="800" textAnchor="middle">B</text>
          </g>

          {/* Bin 2 (near Gate C) */}
          <g onClick={() => onSelectNode('Eco-Bin C')} style={{ cursor: 'pointer' }}>
            <circle cx="640" cy="390" r="8" fill={isNodeSelected('Eco-Bin C') ? 'var(--color-accent)' : isNodeInPath('Eco-Bin C') ? 'var(--color-primary)' : '#22c55e'} />
            <text x="640" y="393" fill="#fff" fontSize="8" fontWeight="800" textAnchor="middle">B</text>
          </g>

          {/* WAYFINDING PATH OVERLAY */}
          {highlightedPath.length > 1 && (
            <g opacity="0.85" filter="url(#glow)">
              {/* Draw connected lines between nodes */}
              {(() => {
                // Map node names to approximate SVG pixel coordinates
                const nodeCoordinates: { [key: string]: { x: number; y: number } } = {
                  'gate a': { x: 120, y: 80 },
                  'gate b': { x: 680, y: 80 },
                  'gate c': { x: 680, y: 420 },
                  'gate d': { x: 120, y: 420 },
                  'section 102': { x: 400, y: 85 },
                  'section 106': { x: 615, y: 250 },
                  'section 108': { x: 400, y: 415 },
                  'section 112': { x: 185, y: 250 },
                  'greenbites vegan food': { x: 237, y: 250 },
                  'main concession row': { x: 563, y: 250 },
                  'medical hub': { x: 400, y: 375 },
                  'eco-bin a': { x: 160, y: 110 },
                  'eco-bin c': { x: 640, y: 390 },
                  'stairs corridor a': { x: 280, y: 110 },
                  'level 1 concourse': { x: 400, y: 120 },
                  'accessible ramp a': { x: 250, y: 120 },
                  'south concourse elevator': { x: 300, y: 380 },
                  'level 1 corridor (flat)': { x: 400, y: 380 },
                  'flat west concourse': { x: 230, y: 300 },
                  'west stairs': { x: 210, y: 200 },
                  'west concourse escalators': { x: 180, y: 150 },
                  'concave ramp west': { x: 220, y: 120 },
                  'section 104 ada deck': { x: 300, y: 85 },
                  'section 104 entrance': { x: 320, y: 85 }
                };

                const points: string[] = [];
                highlightedPath.forEach(node => {
                  const key = node.toLowerCase();
                  // Try to find exact key first, otherwise check contains
                  let coord = nodeCoordinates[key];
                  if (!coord) {
                    const foundKey = Object.keys(nodeCoordinates).find(k => key.includes(k) || k.includes(key));
                    if (foundKey) coord = nodeCoordinates[foundKey];
                  }

                  if (coord) {
                    points.push(`${coord.x},${coord.y}`);
                  }
                });

                if (points.length > 1) {
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
                }
                return null;
              })()}
            </g>
          )}
        </svg>

        {/* Animation styling in SVG path */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes dash {
            to {
              stroke-dashoffset: -1000;
            }
          }
        `}} />
      </div>
      
      <div style={{ padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <p>💡 <strong>Tip:</strong> Click any seating section, gate, first-aid station, or concession on the map to select it as a waypoint, inspect its details, or use it in the navigation tool.</p>
      </div>
    </div>
  );
};
