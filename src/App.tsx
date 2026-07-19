import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Menu, X, BarChart2, Users, ShieldAlert, AlertOctagon, Headphones } from 'lucide-react';
import { StadiumMap } from './components/StadiumMap';
import { FanCompanion } from './components/FanCompanion';
import { StaffDashboard } from './components/StaffDashboard';
import { SettingsPanel } from './components/SettingsPanel';
import type { ParsedIncident, AppView, CrowdDensities } from './types';
import { DEFAULT_CROWD_DENSITIES, MENU_ITEMS, DEFAULT_INCIDENTS } from './constants';
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

  // Ref-based counter: generates unique IDs without triggering re-renders.
  // No UI depends on this value directly, so useRef is more efficient than useState.
  const incidentCounterRef = useRef<number>(1);

  // Pre-configured incidents using stable IDs
  const [incidents, setIncidents] = useState<ParsedIncident[]>(() => [...DEFAULT_INCIDENTS]);

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

  /** Prepends a newly parsed incident to the queue with a unique stable ID. */
  const handleAddIncident = useCallback((newIncident: Omit<ParsedIncident, 'id'>) => {
    const newId = `inc-dynamic-${incidentCounterRef.current}`;
    incidentCounterRef.current += 1;
    setIncidents((prevIncidents) => [
      { ...newIncident, id: newId },
      ...prevIncidents,
    ]);
  }, []);

  /** Removes a resolved incident by matching its stable ID. */
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
            className="btn btn-secondary emergency-btn"
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
          <div className="header-logo-container">
            <div className="menu-logo-icon-wrapper" aria-hidden="true">
              <Sparkles size={14} className="header-logo-icon" />
            </div>
            <span className="menu-drawer-title-text">
              SmartArena Menu
            </span>
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="menu-drawer-close-btn"
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Section label */}
        <p className="menu-drawer-section-label">
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
                <span className="menu-drawer-item-icon-container" aria-hidden="true">
                  {item.id === 'incident-queue'    && <ShieldAlert size={18} />}
                  {item.id === 'ai-support'        && <Headphones size={18} />}
                  {item.id === 'crowd-heatmap'     && <Users size={18} />}
                  {item.id === 'analytics-section' && <BarChart2 size={18} />}
                </span>
                <span className="menu-drawer-item-text-wrapper">
                  <span className="menu-drawer-item-label">{item.label}</span>
                  <span className="menu-drawer-item-desc">{item.description}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Divider */}
        <div className="menu-drawer-divider" />

        {/* Emergency Stop Dispatch Toggle */}
        <div className="menu-drawer-emergency-container">
          <p className="menu-drawer-section-label">
            Emergency Controls
          </p>
          <button
            className={`btn menu-drawer-emergency-btn ${emergencyStopDispatch ? 'btn-secondary' : 'btn-danger'}`}
            onClick={handleToggleEmergencyStop}
            aria-label={emergencyStopDispatch ? 'Deactivate Emergency Stop Dispatch' : 'Activate Emergency Stop Dispatch'}
            aria-pressed={emergencyStopDispatch}
          >
            <AlertOctagon size={16} aria-hidden="true" />
            <span className="menu-drawer-emergency-btn-text-wrapper">
              <span className="menu-drawer-emergency-btn-title">
                {emergencyStopDispatch ? '✅ Dispatch Restored' : '🛑 Stop Dispatch'}
              </span>
              <span className="menu-drawer-emergency-btn-desc">
                {emergencyStopDispatch ? 'Click to resume normal operations' : 'Freeze all incident dispatch queues'}
              </span>
            </span>
          </button>
        </div>

        {/* Footer branding */}
        <div className="menu-drawer-footer">
          FIFA 26 SmartArena · Powered by Gemini AI
        </div>
      </aside>

      {/* ── Sticky Header ── */}
      <header className="app-header">
        <div className="header-container">
          {/* Left: Hamburger + Logo */}
          <div className="header-left">
            {/* Hamburger Menu Toggle Button */}
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className={`header-menu-btn${isMenuOpen ? ' is-open' : ''}`}
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMenuOpen}
              aria-controls="main-nav-drawer"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Logo & Title */}
            <div className="header-logo-container">
              <div className="header-logo-icon-bg" aria-hidden="true">
                <Sparkles size={20} className="header-logo-icon" />
              </div>
              <div className="header-logo-text-wrapper">
                <h1 className="header-logo-title">
                  FIFA 26 <span className="logo-accent">SmartArena</span>
                </h1>
                <p className="header-logo-subtitle">
                  AI Stadium Operations &amp; Fan Portal
                </p>
              </div>
            </div>
          </div>

          {/* Right: Role View Toggles */}
          <nav className="header-nav" aria-label="Role view selector">
            <button
              onClick={() => setSelectedView('fan')}
              className={`btn nav-btn ${selectedView === 'fan' ? 'btn-primary' : 'btn-secondary'}`}
              aria-label="Switch to Fan Experience mode"
              aria-pressed={selectedView === 'fan'}
            >
              ⚽ Fan Portal
            </button>
            <button
              onClick={() => setSelectedView('staff')}
              className={`btn nav-btn ${selectedView === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
              aria-label="Switch to Staff Operations Command mode"
              aria-pressed={selectedView === 'staff'}
            >
              🛡️ Operations Command
            </button>
            <button
              onClick={() => setSelectedView('settings')}
              className={`btn nav-btn ${selectedView === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
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
        <div className="layout-grid">
          {/* Left Panel: Stadium Map — always visible for situational awareness */}
          <div className="sticky-sidebar">
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
      <footer className="app-footer">
        <p>© 2026 FIFA SmartArena Operations Challenge. Powered by Gemini Generative AI.</p>
      </footer>

    </div>
  );
}
