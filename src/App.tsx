import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Menu, X, BarChart2, Users, ShieldAlert, AlertOctagon, Headphones } from 'lucide-react';
import { StadiumMap } from './components/StadiumMap';
import { FanCompanion } from './components/FanCompanion';
import { StaffDashboard } from './components/StaffDashboard';
import { SettingsPanel } from './components/SettingsPanel';
import type { ParsedIncident, AppView, CrowdDensities } from './types';
import { DEFAULT_CROWD_DENSITIES, MENU_ITEMS } from './constants';
import './styles/global.css';

export default function App() {
  // ── View & Navigation State ──────────────────────────────────────────────
  const [selectedView, setSelectedView] = useState<AppView>('fan');
  const [isMenuOpen, setIsMenuOpen]     = useState<boolean>(false);

  // ── Accessibility State ──────────────────────────────────────────────────
  const [accessibilityMode, setAccessibilityMode] = useState<boolean>(false);
  const [highContrast, setHighContrast]           = useState<boolean>(false);

  // ── Emergency Dispatch State ─────────────────────────────────────────────
  const [emergencyStopDispatch, setEmergencyStopDispatch] = useState<boolean>(false);

  // ── Layout / Wayfinding State ────────────────────────────────────────────
  const [selectedNode, setSelectedNode]       = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);

  // ── Crowd & Incident State ───────────────────────────────────────────────
  const [crowdDensities, setCrowdDensities] = useState<CrowdDensities>(DEFAULT_CROWD_DENSITIES);

  // Pre-configured incidents so the command queue is live on launch
  const [incidents, setIncidents] = useState<ParsedIncident[]>([
    {
      category: 'Facilities',
      priority: 'Medium',
      location: 'Section 106',
      description: 'Minor water leakage reported near the third row seats, creating a minor hazard.',
      remediationSteps: ['Deploy janitorial team with dry-mops.', 'Place a yellow warning cone at row entrance.'],
    },
    {
      category: 'Medical',
      priority: 'High',
      location: 'Section 112',
      description: 'An elderly fan reports severe heat exhaustion and dizziness near Gate D exit.',
      remediationSteps: ['Dispatch nearby volunteer with cold water.', 'Alert medical staff at the west gate hub.'],
    },
  ]);

  // Ref for first drawer item — focus trap on open (WCAG 2.1 SC 2.1.2)
  const firstDrawerItemRef = useRef<HTMLButtonElement>(null);

  // ── Side Effects ─────────────────────────────────────────────────────────

  // Keyboard handler: Escape key closes the navigation drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  // Focus first drawer item when drawer opens — WCAG 2.4.3 Focus Order
  useEffect(() => {
    if (isMenuOpen && firstDrawerItemRef.current) {
      firstDrawerItemRef.current.focus();
    }
  }, [isMenuOpen]);

  // Prevent body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  // Apply high-contrast data attribute to document root
  useEffect(() => {
    if (highContrast) {
      document.documentElement.setAttribute('data-theme', 'high-contrast');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [highContrast]);

  // ── Event Handlers (memoised to prevent unnecessary child re-renders) ────

  /**
   * Scrolls to a named section on the page, switching to the correct view
   * first and applying a brief highlight glow for orientation.
   */
  const handleJumpToSection = useCallback((targetId: string, viewName: AppView) => {
    setSelectedView(viewName);
    setIsMenuOpen(false);
    // Allow React to commit the view change before scrolling
    setTimeout(() => {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('highlight-glow');
        setTimeout(() => element.classList.remove('highlight-glow'), 2500);
      }
    }, 200);
  }, []);

  /** Toggles the emergency stop dispatch lockdown. */
  const handleToggleEmergencyStop = useCallback(() => {
    setEmergencyStopDispatch((prev) => !prev);
    setIsMenuOpen(false);
  }, []);

  /** Prepends a newly parsed incident to the queue. */
  const handleAddIncident = useCallback((newIncident: ParsedIncident) => {
    setIncidents((prev) => [newIncident, ...prev]);
  }, []);

  /** Removes a resolved incident by index. */
  const handleResolveIncident = useCallback((idx: number) => {
    setIncidents((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  /** Toggles accessibility routing mode. */
  const handleToggleAccessibilityMode = useCallback(() => {
    setAccessibilityMode((prev) => !prev);
  }, []);

  /** Toggles high contrast display theme. */
  const handleToggleHighContrast = useCallback(() => {
    setHighContrast((prev) => !prev);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="app-container">

      {/* ── Skip-to-content link (WCAG 2.4.1) ── */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

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
        id="main-nav-drawer"
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
          {MENU_ITEMS.map((item, idx) => (
            <li key={item.id} role="none">
              <button
                ref={idx === 0 ? firstDrawerItemRef : undefined}
                className="menu-drawer-item"
                role="menuitem"
                tabIndex={isMenuOpen ? 0 : -1}
                onClick={() => handleJumpToSection(item.id, item.view)}
                aria-label={`Navigate to ${item.label}: ${item.description}`}
              >
                <span style={{ color: 'var(--color-primary)', flexShrink: 0 }} aria-hidden="true">
                  {/* Icon rendered dynamically via MENU_ITEMS — kept here for layout */}
                  {item.id === 'incident-queue'    && <ShieldAlert size={18} />}
                  {item.id === 'ai-support'        && <Headphones size={18} />}
                  {item.id === 'crowd-heatmap'     && <Users size={18} />}
                  {item.id === 'analytics-section' && <BarChart2 size={18} />}
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
            gap: 'var(--spacing-md)',
          }}
        >
          {/* Left: Hamburger + Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            {/* Hamburger Menu Toggle Button */}
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
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
            alignItems: 'start',
          }}
        >
          {/* Left Panel: Stadium Map — always visible for situational awareness */}
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
                onToggleAccessibilityMode={handleToggleAccessibilityMode}
                highContrast={highContrast}
                onToggleHighContrast={handleToggleHighContrast}
                hasApiKey={Boolean(import.meta.env.VITE_GEMINI_API_KEY)}
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
          background: 'var(--bg-secondary)',
        }}
      >
        <p>© 2026 FIFA SmartArena Operations Challenge. Powered by Gemini Generative AI.</p>
      </footer>

    </div>
  );
}
