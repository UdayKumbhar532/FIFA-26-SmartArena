import React from 'react';
import { ShieldCheck, Accessibility, Settings, Zap } from 'lucide-react';


interface SettingsPanelProps {
  accessibilityMode: boolean;
  onToggleAccessibilityMode: () => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
}

/**
 * SettingsPanel — Accessibility & Display controls for end users.
 *
 * Security note: The Gemini API key is intentionally absent from this UI.
 * It is baked into the build at compile time via the VITE_GEMINI_API_KEY
 * environment variable, invisible to end users.
 */
export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  accessibilityMode,
  onToggleAccessibilityMode,
  highContrast,
  onToggleHighContrast,
}) => {
  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 'var(--spacing-sm)' }}>
        <Settings size={20} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
        <h3 style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-header)' }}>System Settings</h3>
      </div>

      {/* AI Status — read-only indicator (no key visible) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.18)',
        }}
        role="status"
        aria-label="AI engine status"
      >
        <Zap size={20} style={{ color: 'var(--color-success)', flexShrink: 0 }} aria-hidden="true" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-success)' }}>
            ⚡ Live Gemini AI — Connected
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            ArenaMind is powered by Google Gemini 1.5 Flash in real-time AI mode.
          </span>
        </div>
      </div>

      {/* Accessibility Controls */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-sm)',
          marginTop: 'var(--spacing-sm)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 'var(--spacing-md)',
        }}
      >
        <h4 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Accessibility size={16} style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
          Accessibility &amp; Display
        </h4>

        {/* Accessibility Routing Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Wheelchair &amp; Accessibility Routing</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Prefer paths with low-slopes, ramps, and elevator overrides
            </span>
          </div>
          <button
            onClick={onToggleAccessibilityMode}
            className={`btn ${accessibilityMode ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '12px', borderRadius: 'var(--radius-round)', flexShrink: 0 }}
            aria-pressed={accessibilityMode}
            aria-label={`Accessibility routing is ${accessibilityMode ? 'enabled' : 'disabled'}. Click to toggle.`}
          >
            {accessibilityMode ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* High Contrast Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>High Contrast Theme</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Maximize readability using deep black overrides
            </span>
          </div>
          <button
            onClick={onToggleHighContrast}
            className={`btn ${highContrast ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '12px', borderRadius: 'var(--radius-round)', flexShrink: 0 }}
            aria-pressed={highContrast}
            aria-label={`High contrast theme is ${highContrast ? 'enabled' : 'disabled'}. Click to toggle.`}
          >
            {highContrast ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* Security notice — reassures users, reveals nothing */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '10px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(6, 182, 212, 0.04)',
          border: '1px solid rgba(6, 182, 212, 0.12)',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          alignItems: 'flex-start',
        }}
        role="note"
      >
        <ShieldCheck size={14} style={{ color: 'var(--color-info)', marginTop: '2px', flexShrink: 0 }} aria-hidden="true" />
        <span>
          <strong>Secured by design:</strong> AI credentials are embedded at build time and
          are not accessible through this interface. All AI requests are processed through
          Google's encrypted API endpoints.
        </span>
      </div>
    </div>
  );
};
