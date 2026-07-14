import { useState, useEffect, useRef } from 'react';
import { Sparkles, Menu, X, BarChart2, Users, ShieldAlert, AlertOctagon, Headphones } from 'lucide-react';
import { StadiumMap } from './components/StadiumMap';
import { FanCompanion } from './components/FanCompanion';
import { StaffDashboard } from './components/StaffDashboard';
import { SettingsPanel } from './components/SettingsPanel';
import { ParsedIncident } from './services/geminiService';
import './styles/global.css';


export default function App() {
  // Config & State Management
  const [selectedView, setSelectedView] = useState<'fan' | 'staff' | 'settings'>('fan');
  
  // Accessibility States
  const [accessibilityMode, setAccessibilityMode] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);

  // Navigation Drawer & Emergency Dispatch States
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [emergencyStopDispatch, setEmergencyStopDispatch] = useState<boolean>(false);

  // Layout & Interaction States
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);

  // Ref for first drawer item (focus trap on open)
  const firstDrawerItemRef = useRef<HTMLButtonElement>(null);

  // Keyboard handlers: Escape to close menu, focus trap for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  // Focus first drawer item when opened (Accessibility: WCAG 2.1 AA)
  useEffect(() => {
    if (isMenuOpen && firstDrawerItemRef.current) {
      firstDrawerItemRef.current.focus();
    }
  }, [isMenuOpen]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  // Jump helper: scrolls to target section and applies glow
  const handleJumpToSection = (targetId: string, viewName: 'fan' | 'staff') => {
    setSelectedView(viewName);
    setIsMenuOpen(false);
    
    // Timeout allows React render to complete before scrolling
    setTimeout(() => {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('highlight-glow');
        setTimeout(() => {
          element.classList.remove('highlight-glow');
        }, 2500);
      }
    }, 200);
  };

  // Toggle emergency lockdown
  const handleToggleEmergencyStop = () => {
    setEmergencyStopDispatch(prev => !prev);
    setIsMenuOpen(false);
  };

  // Crowd & Operations States
  const [crowdDensities, setCrowdDensities] = useState<{ [key: string]: number }>({
    'Section 102': 35,
    'Section 106': 18,
    'Section 108': 42,
    'Section 112': 78,
  });

  // Pre-configured incidents so the command queue is live on launch
  const [incidents, setIncidents] = useState<ParsedIncident[]>([
    {
      category: 'Facilities',
      priority: 'Medium',
      location: 'Section 106',
      description: 'Minor water leakage reported near the third row seats, creating a minor hazard.',
      remediationSteps: ['Deploy janitorial team with dry-mops.', 'Place a yellow warning cone at row entrance.']
    },
    {
      category: 'Medical',
      priority: 'High',
      location: 'Section 112',
      description: 'An elderly fan reports severe heat exhaustion and dizziness near Gate D exit.',
      remediationSteps: ['Dispatch nearby volunteer with cold water.', 'Alert medical staff at the west gate hub.']
    }
  ]);

  // Synchronize High-Contrast Mode on document body
  useEffect(() => {
    if (highContrast) {
      document.documentElement.setAttribute('data-theme', 'high-contrast');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [highContrast]);

  const handleAddIncident = (newIncident: ParsedIncident) => {
    setIncidents(prev => [newIncident, ...prev]);
  };

  const handleResolveIncident = (idx: number) => {
    setIncidents(prev => prev.filter((_, i) => i !== idx));
  };

  // Menu navigation items definition
  const menuItems = [
    {
      id: 'incident-queue',
      label: 'Incidents',
      icon: <ShieldAlert size={18} />,
      view: 'staff' as const,
      description: 'Active dispatch queue',
    },
    {
      id: 'ai-support',
      label: 'AI Support',
      icon: <Headphones size={18} />,
      view: 'fan' as const,
      description: 'Fan companion & chat',
    },
    {
      id: 'crowd-heatmap',
      label: 'Crowd Heat Map',
      icon: <Users size={18} />,
      view: 'staff' as const,
      description: 'Live density monitor',
    },
    {
      id: 'analytics-section',
      label: 'Analytics',
      icon: <BarChart2 size={18} />,
      view: 'staff' as const,
      description: 'Eco & operations data',
    },
  ];

  return (
    <div className="app-container">

      {/* ── Emergency Stop Dispatch Banner ── */}
      {emergencyStopDispatch && (
        <div
          className="emergency-banner"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <AlertOctagon size={16} aria-hidden="true" />
          🚨 EMERGENCY STOP DISPATCH ACTIVE — All dispatch queues are frozen. Contact Operations Command immediately.
          <button
            onClick={handleToggleEmergencyStop}
            style={{
              marginLeft: '16px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: 'white',
              borderRadius: '4px',
              padding: '2px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            aria-label="Deactivate emergency stop dispatch"
          >
            DEACTIVATE
          </button>
        </div>
      )}

      {/* ── Navigation Drawer Backdrop ── */}
      {isMenuOpen && (
        <div
          className="menu-overlay"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Slide-Out Navigation Drawer ── */}
      <aside
        className={`menu-drawer ${isMenuOpen ? 'open' : ''}`}
        role="navigation"
        aria-label="Main navigation"
        aria-hidden={!isMenuOpen}
      >
        {/* Drawer Header */}
        <div className="menu-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, var(--color-accent), #b45309)',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-hidden="true"
            >
              <Sparkles size={14} style={{ color: '#070514' }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              SmartArena Menu
            </span>
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Section label */}
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
          Quick Navigation
        </p>

        {/* Nav Items */}
        <ul className="menu-drawer-list" role="menubar">
          {menuItems.map((item, idx) => (
            <li key={item.id} role="none">
              <button
                ref={idx === 0 ? firstDrawerItemRef : undefined}
                className="menu-drawer-item"
                role="menuitem"
                onClick={() => handleJumpToSection(item.id, item.view)}
                aria-label={`Navigate to ${item.label}: ${item.description}`}
              >
                <span style={{ color: 'var(--color-primary)', flexShrink: 0 }} aria-hidden="true">
                  {item.icon}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{item.label}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>{item.description}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0' }} />

        {/* Emergency Stop Dispatch Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
            Emergency Controls
          </p>
          <button
            className={`btn ${emergencyStopDispatch ? 'btn-secondary' : 'btn-danger'}`}
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              padding: '12px 16px',
              gap: '10px',
              fontSize: '13px',
              border: emergencyStopDispatch
                ? '1px solid rgba(16, 185, 129, 0.4)'
                : '1px solid rgba(239, 68, 68, 0.4)',
              background: emergencyStopDispatch
                ? 'rgba(16, 185, 129, 0.08)'
                : 'rgba(239, 68, 68, 0.1)',
              color: emergencyStopDispatch ? 'var(--color-success)' : 'var(--color-danger)',
            }}
            onClick={handleToggleEmergencyStop}
            aria-label={emergencyStopDispatch ? 'Deactivate Emergency Stop Dispatch' : 'Activate Emergency Stop Dispatch'}
            aria-pressed={emergencyStopDispatch}
          >
            <AlertOctagon size={16} aria-hidden="true" />
            <span style={{ display: 'flex', flexDirection: 'column', gap: '1px', textAlign: 'left' }}>
              <span style={{ fontWeight: 700, fontSize: '13px' }}>
                {emergencyStopDispatch ? '✅ Dispatch Restored' : '🛑 Stop Dispatch'}
              </span>
              <span style={{ fontSize: '10px', opacity: 0.7, fontWeight: 400 }}>
                {emergencyStopDispatch ? 'Click to resume normal operations' : 'Freeze all incident dispatch queues'}
              </span>
            </span>
          </button>
        </div>

        {/* Footer branding */}
        <div style={{ marginTop: 'auto', paddingTop: 'var(--spacing-md)', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
          FIFA 26 SmartArena · Powered by Gemini AI
        </div>
      </aside>

      {/* ── Sticky Header ── */}
      <header
        style={{
          background: 'rgba(7, 5, 20, 0.88)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--glass-border)',
          padding: 'var(--spacing-md) var(--spacing-lg)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--spacing-md)'
          }}
        >
          {/* Left: Hamburger + Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            {/* Hamburger Menu Toggle Button */}
            <button
              onClick={() => setIsMenuOpen(prev => !prev)}
              style={{
                background: isMenuOpen ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${isMenuOpen ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: isMenuOpen ? 'var(--color-primary)' : 'var(--text-primary)',
                borderRadius: '8px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMenuOpen}
              aria-controls="main-nav-drawer"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Logo & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--color-accent), #b45309)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-glow-accent)',
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                <Sparkles size={20} style={{ color: '#070514' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.03em' }}>
                  FIFA 26 <span style={{ color: 'var(--color-accent)' }}>SmartArena</span>
                </h1>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  AI Stadium Operations & Fan Portal
                </p>
              </div>
            </div>
          </div>

          {/* Right: Role View Toggles */}
          <nav aria-label="Role view selector" style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedView('fan')}
              className={`btn ${selectedView === 'fan' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '13px' }}
              aria-label="Switch to Fan Experience mode"
              aria-pressed={selectedView === 'fan'}
            >
              ⚽ Fan Portal
            </button>
            <button
              onClick={() => setSelectedView('staff')}
              className={`btn ${selectedView === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '13px' }}
              aria-label="Switch to Staff Operations Command mode"
              aria-pressed={selectedView === 'staff'}
            >
              🛡️ Operations Command
            </button>
            <button
              onClick={() => setSelectedView('settings')}
              className={`btn ${selectedView === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '13px' }}
              aria-label="Switch to Settings view"
              aria-pressed={selectedView === 'settings'}
            >
              ⚙️ Settings
            </button>
          </nav>
        </div>
      </header>

      {/* ── Main Workspace ── */}
      <main className="main-content" id="main-content" aria-label="Main application workspace">
        
        {/* Dynamic Multi-role Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: 'var(--spacing-lg)',
            alignItems: 'start'
          }}
        >
          {/* Left Panel: Stadium Map - always visible for situational awareness */}
          <div style={{ position: 'sticky', top: '100px' }}>
            <StadiumMap
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              crowdDensities={crowdDensities}
              highlightedPath={highlightedPath}
            />
          </div>

          {/* Right Panel: Role Views */}
          <div className="animate-fade-in">
            {selectedView === 'fan' && (
              <FanCompanion
                accessibilityMode={accessibilityMode}
                onSetWaypoints={setHighlightedPath}
                selectedNode={selectedNode}
                onSelectNode={setSelectedNode}
              />
            )}
            
            {selectedView === 'staff' && (
              <StaffDashboard
                crowdDensities={crowdDensities}
                onUpdateCrowd={setCrowdDensities}
                incidents={incidents}
                onAddIncident={handleAddIncident}
                onResolveIncident={handleResolveIncident}
                emergencyStopDispatch={emergencyStopDispatch}
              />
            )}

            {selectedView === 'settings' && (
              <SettingsPanel
                accessibilityMode={accessibilityMode}
                onToggleAccessibilityMode={() => setAccessibilityMode(!accessibilityMode)}
                highContrast={highContrast}
                onToggleHighContrast={() => setHighContrast(!highContrast)}
              />
            )}
          </div>

        </div>

      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: '1px solid var(--glass-border)',
          padding: 'var(--spacing-md)',
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text-muted)',
          marginTop: 'var(--spacing-xl)',
          background: 'var(--bg-secondary)'
        }}
      >
        <p>© 2026 FIFA SmartArena Operations Challenge. Powered by Gemini Generative AI.</p>
      </footer>

    </div>
  );
}
