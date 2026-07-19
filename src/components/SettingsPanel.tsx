import React from 'react';
import { ShieldCheck, Accessibility, Settings, Zap } from 'lucide-react';

interface SettingsPanelProps {
  accessibilityMode: boolean;
  onToggleAccessibilityMode: () => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  hasApiKey: boolean;
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
  hasApiKey,
}) => {

  return (
    <div className="glass-panel settings-panel-body">

      {/* Header */}
      <div className="settings-header-row">
        <Settings size={20} className="icon-primary" aria-hidden="true" />
        <h3 className="settings-header-title">System Settings</h3>
      </div>

      {/* AI Status — read-only indicator (no key visible) */}
      <div
        className={`settings-status-card ${
          hasApiKey ? 'settings-status-card--connected' : 'settings-status-card--offline'
        }`}
        role="status"
        aria-label="AI engine status"
      >
        <Zap
          size={20}
          className={`flex-shrink-0 ${
            hasApiKey ? 'settings-status-icon-connected' : 'settings-status-icon-offline'
          }`}
          aria-hidden="true"
        />
        <div className="settings-status-text-group">
          <span
            className={`settings-status-title ${
              hasApiKey ? 'settings-status-icon-connected' : 'settings-status-icon-offline'
            }`}
          >
            {hasApiKey ? '⚡ Live Gemini AI — Connected' : '🔌 Offline AI Simulator — Active'}
          </span>
          <span className="settings-status-desc">
            {hasApiKey
              ? 'ArenaMind is powered by Google Gemini 1.5 Flash in real-time AI mode.'
              : 'Using high-fidelity local simulator fallback (no API key configured).'}
          </span>
        </div>
      </div>

      {/* Accessibility Controls */}
      <div className="settings-controls-group">
        <h4 className="settings-controls-title">
          <Accessibility size={16} className="icon-accent" aria-hidden="true" />
          Accessibility &amp; Display
        </h4>

        {/* Accessibility Routing Toggle */}
        <div className="settings-controls-row">
          <div className="settings-controls-label-group">
            <span className="settings-controls-label">Wheelchair &amp; Accessibility Routing</span>
            <span className="settings-controls-desc">
              Prefer paths with low-slopes, ramps, and elevator overrides
            </span>
          </div>
          <button
            onClick={onToggleAccessibilityMode}
            className={`btn settings-controls-btn ${accessibilityMode ? 'btn-primary' : 'btn-secondary'}`}
            aria-pressed={accessibilityMode}
            aria-label={`Accessibility routing is ${accessibilityMode ? 'enabled' : 'disabled'}. Click to toggle.`}
          >
            {accessibilityMode ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* High Contrast Toggle */}
        <div className="settings-controls-row">
          <div className="settings-controls-label-group">
            <span className="settings-controls-label">High Contrast Theme</span>
            <span className="settings-controls-desc">
              Maximize readability using deep black overrides
            </span>
          </div>
          <button
            onClick={onToggleHighContrast}
            className={`btn settings-controls-btn ${highContrast ? 'btn-primary' : 'btn-secondary'}`}
            aria-pressed={highContrast}
            aria-label={`High contrast theme is ${highContrast ? 'enabled' : 'disabled'}. Click to toggle.`}
          >
            {highContrast ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* Security notice — reassures users, reveals nothing */}
      <div className="settings-security-card" role="note">
        <ShieldCheck size={14} className="settings-security-card-icon" aria-hidden="true" />
        <span>
          <strong>Secured by design:</strong> AI credentials are embedded at build time and
          are not accessible through this interface. All AI requests are processed through
          Google's encrypted API endpoints.
        </span>
      </div>
    </div>
  );
};
