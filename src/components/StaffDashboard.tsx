import React, { useState, useEffect, useCallback } from 'react';
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
  onAddIncident: (incident: ParsedIncident) => void;
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

  // AI Crowd Rerouting Advice
  const [crowdAdvice, setCrowdAdvice] = useState<string>('Crowd distributions are within safe operational parameters.');

  // Trigger crowd re-simulation (wrapped in useCallback)
  const handleSimulateCrowd = useCallback(() => {
    const newDensities: CrowdDensities = {
      'Section 102': Math.floor(Math.random() * 50) + 15,
      'Section 106': Math.floor(Math.random() * 60) + 20,
      'Section 108': Math.floor(Math.random() * 50) + 25,
      'Section 112': Math.floor(Math.random() * 60) + 40,
    };
    onUpdateCrowd(newDensities);
  }, [onUpdateCrowd]);

  // Run a quick AI advice update when crowd densities change
  useEffect(() => {
    const sec112 = crowdDensities['Section 112'] || 0;
    const sec106 = crowdDensities['Section 106'] || 0;

    if (sec112 > CROWD_CRITICAL_THRESHOLD) {
      setCrowdAdvice(`🚨 CRITICAL CONGESTION: Section 112 is at ${sec112}% capacity. Recommend directing Section 112 exiting spectators to Gate D instead of Gate A. Update electronic signs now.`);
    } else if (sec106 > CROWD_HIGH_THRESHOLD) {
      setCrowdAdvice(`⚠️ HIGH DENSITY: Section 106 is at ${sec106}%. Recommend opening overflow Gate C turnstiles and notifying security teams.`);
    } else {
      setCrowdAdvice('✅ STABLE FLOW: Crowd levels at all sections are balanced. Concourse lanes remain clear.');
    }
  }, [crowdDensities]);

  // Handle Incident Submission (wrapped in useCallback)
  const handleReportIncident = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawReport.trim() || emergencyStopDispatch) return;

    setParsingLoading(true);
    try {
      const parsed = await parseIncidentReport(rawReport);
      onAddIncident(parsed);
      setRawReport('');

      // Visual confirmation for dispatch validation
      if (parsed.priority === 'Critical') {
        confetti({ particleCount: 50, colors: ['#ef4444', '#f97316'] });
      } else {
        confetti({ particleCount: 30, colors: ['#10b981', '#3b82f6'] });
      }
    } catch (err) {
      console.error(err);
      // Safe fallback if parsing fails
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

  // Resolve incident handler (wrapped in useCallback)
  const handleResolve = useCallback((index: number) => {
    onResolveIncident(index);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10b981', '#06b6d4', '#eab308'],
    });
  }, [onResolveIncident]);

  // Simulating waste additions (wrapped in useCallback)
  const handleAddWaste = useCallback(() => {
    setBins((prev) => ({
      A: Math.min(100, prev.A + Math.floor(Math.random() * 15) + 5),
      C: Math.min(100, prev.C + Math.floor(Math.random() * 12) + 2),
    }));
  }, []);

  // Empty bin / Dispatch Eco-crew handler (wrapped in useCallback)
  const handleEmptyBin = useCallback((bin: keyof BinState) => {
    setBins((prev) => ({
      ...prev,
      [bin]: 0,
    }));
    confetti({ particleCount: 20, colors: ['#10b981'] });
  }, []);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return (
          <span className="badge badge-danger" style={{ animation: 'pulse 1.5s infinite' }}>
            <Flame size={10} style={{ marginRight: '3px' }} aria-hidden="true" /> Critical
          </span>
        );
      case 'High':
        return <span className="badge badge-danger">High</span>;
      case 'Medium':
        return <span className="badge badge-warning">Medium</span>;
      default:
        return <span className="badge badge-info">Low</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>

      {/* Upper Section: Crowd simulations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-md)' }}>

        {/* Crowd controller */}
        <div id="crowd-heatmap" className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: 'var(--color-primary)' }} aria-hidden="true" /> Live Crowd Control Simulator
            </h3>
            <button onClick={handleSimulateCrowd} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              <RotateCw size={12} style={{ marginRight: '4px' }} aria-hidden="true" /> Refresh Simulation
            </button>
          </div>

          {/* Density numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--spacing-sm)', marginTop: '4px' }}>
            {Object.entries(crowdDensities).map(([sec, val]) => (
              <div key={sec} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sec}</span>
                <span style={{ fontSize: '20px', fontWeight: 700, color: val > CROWD_CRITICAL_THRESHOLD ? 'var(--color-danger)' : val > 50 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                  {val}%
                </span>
              </div>
            ))}
          </div>

          {/* AI Crowd routing recommendation */}
          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              background: crowdAdvice.includes('CRITICAL') ? 'rgba(239, 68, 68, 0.05)' : crowdAdvice.includes('HIGH') ? 'rgba(249, 115, 22, 0.05)' : 'rgba(16, 185, 129, 0.05)',
              border: `1px solid ${crowdAdvice.includes('CRITICAL') ? 'rgba(239, 68, 68, 0.15)' : crowdAdvice.includes('HIGH') ? 'rgba(249, 115, 22, 0.15)' : 'rgba(16, 185, 129, 0.15)'}`,
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
            aria-live="polite"
          >
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: crowdAdvice.includes('CRITICAL') ? 'var(--color-danger)' : crowdAdvice.includes('HIGH') ? 'var(--color-warning)' : 'var(--color-success)' }}>
              🧠 ArenaMind Operational Suggestion
            </span>
            <p style={{ color: 'var(--text-primary)' }}>{crowdAdvice}</p>
          </div>
        </div>

      </div>

      {/* Mid Section: Incident reporter + Incident Queue */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-md)' }}>

        {/* Report form */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PlusCircle size={18} style={{ color: 'var(--color-accent)' }} aria-hidden="true" /> Staff Incident Dispatcher
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AI parses raw text into structured dispatch commands automatically.</p>
          </div>

          <form onSubmit={handleReportIncident} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <label className="label" htmlFor="incidentRawInput">Raw Dispatch Text</label>
            <textarea
              id="incidentRawInput"
              className="input-field"
              style={{ minHeight: '100px', resize: 'vertical' }}
              placeholder={emergencyStopDispatch ? 'Dispatch queue is frozen.' : 'Example: Medical: Fan has slipped near Gate A on wet stairs, minor ankle injury...'}
              value={rawReport}
              onChange={(e) => setRawReport(e.target.value)}
              disabled={parsingLoading || emergencyStopDispatch}
              maxLength={MAX_INCIDENT_REPORT_LENGTH}
            />

            {emergencyStopDispatch && (
              <div
                role="alert"
                style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: 'var(--color-danger)', fontSize: '12px', fontWeight: 600 }}
              >
                🚨 DISPATCH LOCKED: System is in Emergency Stop Dispatch mode. Staff reports are currently frozen.
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={parsingLoading || !rawReport.trim() || emergencyStopDispatch}>
              {parsingLoading ? 'AI Dispatching...' : 'Dispatch Report'}
            </button>
          </form>

          {/* Quick presets */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }} role="group" aria-label="Incident templates">
            <button type="button" onClick={() => setRawReport('Water spill near Section 106, fans slipping!')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '10px' }} disabled={emergencyStopDispatch}>💦 Section 106 Spill</button>
            <button type="button" onClick={() => setRawReport('Spectator has heat exhaustion and chest tightness at Section 108 Row D.')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '10px' }} disabled={emergencyStopDispatch}>🏥 Section 108 Chest Pain</button>
            <button type="button" onClick={() => setRawReport('Gate B crowd bottleneck forming, ticket scanner slow')} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '10px' }} disabled={emergencyStopDispatch}>🚪 Gate B Gatejam</button>
          </div>
        </div>

        {/* Incident Queue */}
        <div id="incident-queue" className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', maxHeight: '380px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 'var(--spacing-sm)' }}>
            <ShieldAlert size={18} style={{ color: 'var(--color-danger)' }} aria-hidden="true" /> Active Dispatch Queue ({incidents.length})
          </h3>

          {incidents.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '8px', padding: 'var(--spacing-lg)' }}>
              <CheckCircle size={32} style={{ color: 'var(--color-success)' }} aria-hidden="true" />
              <span style={{ fontSize: '13px' }}>All clear! No active incidents.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {incidents.map((inc, i) => (
                <div key={i} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-info" style={{ textTransform: 'uppercase', fontSize: '10px' }}>{inc.category}</span>
                    {getPriorityBadge(inc.priority)}
                  </div>
                  <p style={{ fontSize: '12px', fontWeight: 600 }}>📍 {inc.location}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{inc.description}</p>

                  {inc.remediationSteps.length > 0 && (
                    <div style={{ background: 'rgba(0,0,0,0.15)', padding: '6px', borderRadius: '4px', marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--color-accent)', fontWeight: 700 }}>🤖 AI Recommended Protocols:</span>
                      <ul style={{ paddingLeft: '14px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {inc.remediationSteps.map((step, sIdx) => <li key={sIdx}>{step}</li>)}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={() => handleResolve(i)}
                    className="btn btn-secondary"
                    style={{ alignSelf: 'flex-end', padding: '4px 8px', fontSize: '11px', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.05)', marginTop: '4px' }}
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
      <div id="analytics-section" className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 'var(--spacing-sm)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={18} style={{ color: 'var(--color-success)' }} aria-hidden="true" /> Eco-Brigade Waste monitors
          </h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={handleAddWaste} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
              Simulate Fan Waste
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          {/* Bin A */}
          <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>🗑️ Eco-Station Gate A</span>
              <span className={`badge ${bins.A > BIN_ALERT_THRESHOLD ? 'badge-danger' : bins.A > 50 ? 'badge-warning' : 'badge-success'}`}>{bins.A}% Full</span>
            </div>

            {/* Progress bar */}
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ width: `${bins.A}%`, height: '100%', background: bins.A > BIN_ALERT_THRESHOLD ? 'var(--color-danger)' : bins.A > 50 ? 'var(--color-warning)' : 'var(--color-success)', transition: 'width 0.3s ease' }} />
            </div>

            {bins.A > BIN_ALERT_THRESHOLD && (
              <div
                role="alert"
                style={{ fontSize: '11px', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.03)', marginBottom: '8px' }}
              >
                ⚠️ AI Alert: High overflow probability within 10 mins. Dispatch Eco-crew now.
              </div>
            )}

            <button onClick={() => handleEmptyBin('A')} className="btn btn-secondary" style={{ width: '100%', padding: '6px', fontSize: '11px' }} aria-label="Empty waste bin at Eco-Station Gate A">
              Empty Bin / Dispatch Crew
            </button>
          </div>

          {/* Bin C */}
          <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>🗑️ Eco-Station Gate C</span>
              <span className={`badge ${bins.C > BIN_ALERT_THRESHOLD ? 'badge-danger' : bins.C > 50 ? 'badge-warning' : 'badge-success'}`}>{bins.C}% Full</span>
            </div>

            {/* Progress bar */}
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ width: `${bins.C}%`, height: '100%', background: bins.C > BIN_ALERT_THRESHOLD ? 'var(--color-danger)' : bins.C > 50 ? 'var(--color-warning)' : 'var(--color-success)', transition: 'width 0.3s ease' }} />
            </div>

            {bins.C > BIN_ALERT_THRESHOLD && (
              <div
                role="alert"
                style={{ fontSize: '11px', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.03)', marginBottom: '8px' }}
              >
                ⚠️ AI Alert: High overflow probability within 10 mins. Dispatch Eco-crew now.
              </div>
            )}

            <button onClick={() => handleEmptyBin('C')} className="btn btn-secondary" style={{ width: '100%', padding: '6px', fontSize: '11px' }} aria-label="Empty waste bin at Eco-Station Gate C">
              Empty Bin / Dispatch Crew
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
