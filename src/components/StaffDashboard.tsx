import React, { useState, useCallback, useMemo } from 'react';
import { ShieldAlert, Users, RotateCw, PlusCircle, CheckCircle, Trash2, Flame } from 'lucide-react';
import { parseIncidentReport } from '../services/geminiService';
import type { ParsedIncident, CrowdDensities } from '../types';
import {
  CROWD_CRITICAL_THRESHOLD,
  CROWD_HIGH_THRESHOLD,
  BIN_ALERT_THRESHOLD,
  MAX_INCIDENT_REPORT_LENGTH,
} from '../constants';
import confetti from 'canvas-confetti';

interface StaffDashboardProps {
  crowdDensities: CrowdDensities;
  onUpdateCrowd: (densities: CrowdDensities) => void;
  incidents: ParsedIncident[];
  onAddIncident: (incident: Omit<ParsedIncident, 'id'>) => void;
  onResolveIncident: (index: number) => void;
  emergencyStopDispatch: boolean;
}

interface BinState {
  A: number;
  C: number;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  crowdDensities,
  onUpdateCrowd,
  incidents,
  onAddIncident,
  onResolveIncident,
  emergencyStopDispatch,
}) => {
  // Incident Form State
  const [rawReport, setRawReport] = useState('');
  const [parsingLoading, setParsingLoading] = useState(false);

  // Merged Eco-Bins State
  const [bins, setBins] = useState<BinState>({
    A: 65,
    C: 30,
  });

  // Trigger crowd re-simulation
  const handleSimulateCrowd = useCallback(() => {
    const newDensities: CrowdDensities = {
      'Section 102': Math.floor(Math.random() * 50) + 15,
      'Section 106': Math.floor(Math.random() * 60) + 20,
      'Section 108': Math.floor(Math.random() * 50) + 25,
      'Section 112': Math.floor(Math.random() * 60) + 40,
    };
    onUpdateCrowd(newDensities);
  }, [onUpdateCrowd]);

  // Derived crowd advice using useMemo to avoid recomputations on unrelated state edits
  const crowdAdvice = useMemo((): string => {
    const sec112 = crowdDensities['Section 112'] || 0;
    const sec106 = crowdDensities['Section 106'] || 0;

    if (sec112 > CROWD_CRITICAL_THRESHOLD) {
      return `🚨 CRITICAL CONGESTION: Section 112 is at ${sec112}% capacity. Recommend directing Section 112 exiting spectators to Gate D instead of Gate A. Update electronic signs now.`;
    }
    if (sec106 > CROWD_HIGH_THRESHOLD) {
      return `⚠️ HIGH DENSITY: Section 106 is at ${sec106}%. Recommend opening overflow Gate C turnstiles and notifying security teams.`;
    }
    return '✅ STABLE FLOW: Crowd levels at all sections are balanced. Concourse lanes remain clear.';
  }, [crowdDensities]);

  // Derived severity level for CSS class-based theming
  const crowdAdviceSeverity = useMemo((): 'critical' | 'high' | 'ok' => {
    const sec112 = crowdDensities['Section 112'] || 0;
    const sec106 = crowdDensities['Section 106'] || 0;
    if (sec112 > CROWD_CRITICAL_THRESHOLD) return 'critical';
    if (sec106 > CROWD_HIGH_THRESHOLD)     return 'high';
    return 'ok';
  }, [crowdDensities]);

  // Handle Incident Submission
  const handleReportIncident = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawReport.trim() || emergencyStopDispatch) return;

    setParsingLoading(true);
    try {
      const parsed = await parseIncidentReport(rawReport);
      // parsed matches ParsedIncident, but parent handleAddIncident expects Omit<ParsedIncident, 'id'>
      onAddIncident(parsed);
      setRawReport('');

      if (parsed.priority === 'Critical') {
        confetti({ particleCount: 50, colors: ['#ef4444', '#f97316'] });
      } else {
        confetti({ particleCount: 30, colors: ['#10b981', '#3b82f6'] });
      }
    } catch (err) {
      console.error(err);
      onAddIncident({
        category: 'Other',
        priority: 'Low',
        location: 'Unknown',
        description: rawReport,
        remediationSteps: ['Assess report manually.', 'Dispatch standby volunteers.'],
      });
      setRawReport('');
    } finally {
      setParsingLoading(false);
    }
  }, [rawReport, emergencyStopDispatch, onAddIncident]);

  // Resolve incident handler
  const handleResolve = useCallback((index: number) => {
    onResolveIncident(index);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10b981', '#06b6d4', '#eab308'],
    });
  }, [onResolveIncident]);

  // Simulating waste additions
  const handleAddWaste = useCallback(() => {
    setBins((prev) => ({
      A: Math.min(100, prev.A + Math.floor(Math.random() * 15) + 5),
      C: Math.min(100, prev.C + Math.floor(Math.random() * 12) + 2),
    }));
  }, []);

  // Empty bin handler
  const handleEmptyBin = useCallback((bin: keyof BinState) => {
    setBins((prev) => ({
      ...prev,
      [bin]: 0,
    }));
    confetti({ particleCount: 20, colors: ['#10b981'] });
  }, []);

  const getPriorityBadge = useCallback((priority: string) => {
    switch (priority) {
      case 'Critical':
        return (
          <span className="badge badge-danger badge-critical-pulse">
            <Flame size={10} className="badge-critical-icon" aria-hidden="true" /> Critical
          </span>
        );
      case 'High':
        return <span className="badge badge-danger">High</span>;
      case 'Medium':
        return <span className="badge badge-warning">Medium</span>;
      default:
        return <span className="badge badge-info">Low</span>;
    }
  }, []);

  return (
    <div className="staff-dashboard-container">

      {/* Upper Section: Crowd simulations */}
      <div className="staff-dashboard-subgrid">

        {/* Crowd controller */}
        <div id="crowd-heatmap" className="glass-panel crowd-controller-body">
          <div className="staff-panel-header-row">
            <h3 className="panel-heading">
              <Users size={18} className="icon-primary" aria-hidden="true" /> Live Crowd Control Simulator
            </h3>
            <button onClick={handleSimulateCrowd} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              <RotateCw size={12} style={{ marginRight: '4px' }} aria-hidden="true" /> Refresh Simulation
            </button>
          </div>

          {/* Density numbers */}
          <div className="staff-density-grid">
            {Object.entries(crowdDensities).map(([sec, val]) => (
              <div key={`density-${sec}`} className="staff-density-card">
                <span className="staff-density-card-label">{sec}</span>
                <span
                  className={`staff-density-card-value ${
                    val > CROWD_CRITICAL_THRESHOLD
                      ? 'density-value-critical'
                      : val > 50
                      ? 'density-value-high'
                      : 'density-value-ok'
                  }`}
                >
                  {val}%
                </span>
              </div>
            ))}
          </div>

          {/* AI Crowd routing recommendation */}
          <div
            className={`staff-suggestion-alert staff-suggestion-alert--${crowdAdviceSeverity}`}
            aria-live="polite"
          >
            <span
              className={`staff-suggestion-alert-title ${
                crowdAdviceSeverity === 'critical' ? 'icon-danger'
                : crowdAdviceSeverity === 'high'   ? 'icon-warning'
                : 'icon-success'
              }`}
            >
              🧠 ArenaMind Operational Suggestion
            </span>
            <p>{crowdAdvice}</p>
          </div>
        </div>

      </div>

      {/* Mid Section: Incident reporter + Incident Queue */}
      <div className="staff-split-layout">

        {/* Report form */}
        <div className="glass-panel staff-form-wrapper">
          <div>
            <h3 className="panel-heading">
              <PlusCircle size={18} className="icon-accent" aria-hidden="true" /> Staff Incident Dispatcher
            </h3>
            <p className="staff-form-desc">AI parses raw text into structured dispatch commands automatically.</p>
          </div>

          <form onSubmit={handleReportIncident} className="staff-form-container">
            <label className="label" htmlFor="incidentRawInput">Raw Dispatch Text</label>
            <textarea
              id="incidentRawInput"
              className="input-field staff-form-textarea"
              placeholder={emergencyStopDispatch ? 'Dispatch queue is frozen.' : 'Example: Medical: Fan has slipped near Gate A on wet stairs, minor ankle injury...'}
              value={rawReport}
              onChange={(e) => setRawReport(e.target.value)}
              disabled={parsingLoading || emergencyStopDispatch}
              maxLength={MAX_INCIDENT_REPORT_LENGTH}
            />

            {emergencyStopDispatch && (
              <div role="alert" className="staff-form-lock-alert">
                🚨 DISPATCH LOCKED: System is in Emergency Stop Dispatch mode. Staff reports are currently frozen.
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={parsingLoading || !rawReport.trim() || emergencyStopDispatch}>
              {parsingLoading ? 'AI Dispatching...' : 'Dispatch Report'}
            </button>
          </form>

          {/* Quick presets */}
          <div className="staff-presets-group" role="group" aria-label="Incident templates">
            <button type="button" onClick={() => setRawReport('Water spill near Section 106, fans slipping!')} className="btn btn-secondary staff-presets-btn" disabled={emergencyStopDispatch}>💦 Section 106 Spill</button>
            <button type="button" onClick={() => setRawReport('Spectator has heat exhaustion and chest tightness at Section 108 Row D.')} className="btn btn-secondary staff-presets-btn" disabled={emergencyStopDispatch}>🏥 Section 108 Chest Pain</button>
            <button type="button" onClick={() => setRawReport('Gate B crowd bottleneck forming, ticket scanner slow')} className="btn btn-secondary staff-presets-btn" disabled={emergencyStopDispatch}>🚪 Gate B Gatejam</button>
          </div>
        </div>

        {/* Incident Queue */}
        <div id="incident-queue" className="glass-panel incident-queue-panel">
          <h3 className="incident-queue-header">
            <ShieldAlert size={18} className="incident-queue-count-icon" aria-hidden="true" /> Active Dispatch Queue ({incidents.length})
          </h3>

          {incidents.length === 0 ? (
            <div className="incident-queue-empty-box">
              <CheckCircle size={32} className="incident-empty-icon" aria-hidden="true" />
              <span className="incident-empty-label">All clear! No active incidents.</span>
            </div>
          ) : (
            <div className="incident-queue-list">
              {incidents.map((inc, i) => (
                <div key={inc.id} className="incident-card">
                  <div className="incident-card-header">
                    <span className="badge badge-info" style={{ textTransform: 'uppercase', fontSize: '10px' }}>{inc.category}</span>
                    {getPriorityBadge(inc.priority)}
                  </div>
                  <p className="incident-card-location">📍 {inc.location}</p>
                  <p className="incident-card-desc">{inc.description}</p>

                  {inc.remediationSteps.length > 0 && (
                    <div className="incident-remediation-box">
                      <span className="incident-remediation-title">🤖 AI Recommended Protocols:</span>
                      <ul className="incident-remediation-list">
                        {inc.remediationSteps.map((step, sIdx) => <li key={`step-${inc.id}-${sIdx}`}>{step}</li>)}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={() => handleResolve(i)}
                    className="btn btn-secondary incident-resolve-btn"
                    aria-label={`Mark resolved: ${inc.category} incident at ${inc.location}`}
                  >
                    Mark Resolved
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Lower Section: Eco-bins */}
      <div id="analytics-section" className="glass-panel analytics-panel-body">
        <div className="eco-brigade-header-row">
          <h3 className="panel-heading">
            <Trash2 size={18} className="icon-success" aria-hidden="true" /> Eco-Brigade Waste monitors
          </h3>
          <div className="flex-gap-sm">
            <button onClick={handleAddWaste} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
              Simulate Fan Waste
            </button>
          </div>
        </div>

        <div className="eco-brigade-subgrid">
          {/* Bin A */}
          <div className="eco-brigade-bin-card">
            <div className="eco-brigade-bin-header">
              <span className="eco-brigade-bin-title">🗑️ Eco-Station Gate A</span>
              <span className={`badge ${bins.A > BIN_ALERT_THRESHOLD ? 'badge-danger' : bins.A > 50 ? 'badge-warning' : 'badge-success'}`}>{bins.A}% Full</span>
            </div>

            <div className="eco-brigade-bin-progress-track">
              <div
                className="eco-brigade-bin-progress-fill"
                style={{
                  width: `${bins.A}%`,
                  background: bins.A > BIN_ALERT_THRESHOLD ? 'var(--color-danger)' : bins.A > 50 ? 'var(--color-warning)' : 'var(--color-success)',
                }}
              />
            </div>

            {bins.A > BIN_ALERT_THRESHOLD && (
              <div role="alert" className="eco-brigade-bin-alert">
                ⚠️ AI Alert: High overflow probability within 10 mins. Dispatch Eco-crew now.
              </div>
            )}

            <button onClick={() => handleEmptyBin('A')} className="btn btn-secondary eco-brigade-bin-btn" aria-label="Empty waste bin at Eco-Station Gate A">
              Empty Bin / Dispatch Crew
            </button>
          </div>

          {/* Bin C */}
          <div className="eco-brigade-bin-card">
            <div className="eco-brigade-bin-header">
              <span className="eco-brigade-bin-title">🗑️ Eco-Station Gate C</span>
              <span className={`badge ${bins.C > BIN_ALERT_THRESHOLD ? 'badge-danger' : bins.C > 50 ? 'badge-warning' : 'badge-success'}`}>{bins.C}% Full</span>
            </div>

            <div className="eco-brigade-bin-progress-track">
              <div
                className="eco-brigade-bin-progress-fill"
                style={{
                  width: `${bins.C}%`,
                  background: bins.C > BIN_ALERT_THRESHOLD ? 'var(--color-danger)' : bins.C > 50 ? 'var(--color-warning)' : 'var(--color-success)',
                }}
              />
            </div>

            {bins.C > BIN_ALERT_THRESHOLD && (
              <div role="alert" className="eco-brigade-bin-alert">
                ⚠️ AI Alert: High overflow probability within 10 mins. Dispatch Eco-crew now.
              </div>
            )}

            <button onClick={() => handleEmptyBin('C')} className="btn btn-secondary eco-brigade-bin-btn" aria-label="Empty waste bin at Eco-Station Gate C">
              Empty Bin / Dispatch Crew
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
