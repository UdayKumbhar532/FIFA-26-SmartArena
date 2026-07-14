import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { parseIncidentReport, getWayfindingRoute, chatWithAI } from '../services/geminiService';
import { FanCompanion } from '../components/FanCompanion';
import { StaffDashboard } from '../components/StaffDashboard';

// ==========================================
// 1. Service Logic Tests
// ==========================================
describe('Gemini AI Service / Offline Simulator Logic', () => {
  
  it('should classify and prioritize safety reports accurately', async () => {
    // Critical safety event (active threat / smoke)
    const result1 = await parseIncidentReport('Fire smoke detected near Gate B corridor');
    expect(result1.category).toBe('Safety');
    expect(result1.priority).toBe('Critical');
    expect(result1.remediationSteps).toContain('Alert police command on site for emergency support.');

    // Moderate facilities event (leakage)
    const result2 = await parseIncidentReport('Water spill on concourse floor in Section 106');
    expect(result2.category).toBe('Facilities');
    expect(result2.priority).toBe('High');
    expect(result2.location).toBe('Section 106');
    expect(result2.remediationSteps.join()).toContain('Wet Floor');
  });

  it('should parse medical emergency reports', async () => {
    const result = await parseIncidentReport('Fan fainted and is unconscious at Section 108 Row D');
    expect(result.category).toBe('Medical');
    expect(result.priority).toBe('Critical');
    expect(result.location).toBe('Section 108');
  });

  it('should yield wheelchair-friendly path details in accessibility mode', async () => {
    // Accessibility Mode ON
    const routeAccess = await getWayfindingRoute('Gate B', 'Section 108', true);
    expect(routeAccess.accessibilityFriendly).toBe(true);
    expect(routeAccess.path.join()).toContain('Elevator');
    expect(routeAccess.warnings[0]).toContain('Elevator wait times');

    // Accessibility Mode OFF
    const routeStandard = await getWayfindingRoute('Gate B', 'Section 108', false);
    expect(routeStandard.accessibilityFriendly).toBe(false);
    expect(routeStandard.path.join()).toContain('Stairs');
  });


  it('should respond to multilingual questions in matching languages', async () => {
    const spanishGreeting = await chatWithAI('Hola, buenos dias', 'idle');
    expect(spanishGreeting).toContain('Bienvenido');

    const frenchGreeting = await chatWithAI('Bonjour, comment ca va?', 'idle');
    expect(frenchGreeting).toContain('Bienvenue');
  });

});

// ==========================================
// 2. Component Integration Tests
// ==========================================
describe('Fan Companion Panel UI', () => {

  it('calculates carbon offsets correctly for rail transit', () => {
    const mockSetWaypoints = vi.fn();
    const mockSelectNode = vi.fn();
    
    render(
      <FanCompanion
        accessibilityMode={false}
        onSetWaypoints={mockSetWaypoints}
        selectedNode={null}
        onSelectNode={mockSelectNode}
      />
    );

    // Enter distance
    const distInput = screen.getByLabelText(/One-Way Distance/i);
    fireEvent.change(distInput, { target: { value: '20' } });

    // Select Metro Mode
    const selectMode = screen.getByLabelText(/Transit Mode/i);
    fireEvent.change(selectMode, { target: { value: 'metro' } });

    // Click Calculate
    const calcButton = screen.getByRole('button', { name: /Calculate My Offset/i });
    fireEvent.click(calcButton);

    // Assert CO2 offsets displayed
    // Baseline (0.220 * 20 = 4.4kg), Metro (0.035 * 20 = 0.7kg) -> 4.4 - 0.7 = 3.70kg offset saved
    expect(screen.getByText(/3.7 kg CO₂ Saved/i)).toBeInTheDocument();
    expect(screen.getByText(/rail systems are the backbone/i)).toBeInTheDocument();
  });

});

describe('Staff Command Dashboard UI', () => {

  it('displays active incident dispatch cards and allows resolving them', () => {
    const mockUpdateCrowd = vi.fn();
    const mockAddIncident = vi.fn();
    const mockResolveIncident = vi.fn();
    
    const activeIncidents = [
      {
        category: 'Facilities' as const,
        priority: 'Medium' as const,
        location: 'Gate A',
        description: 'Trash can overflowing',
        remediationSteps: ['Empty the bin.']
      }
    ];

    render(
      <StaffDashboard
        crowdDensities={{ 'Section 102': 30 }}
        onUpdateCrowd={mockUpdateCrowd}
        incidents={activeIncidents}
        onAddIncident={mockAddIncident}
        onResolveIncident={mockResolveIncident}
        emergencyStopDispatch={false}
      />
    );

    // Incident text exists
    expect(screen.getByText(/Trash can overflowing/i)).toBeInTheDocument();

    // Click Resolve
    const resolveBtn = screen.getByRole('button', { name: /Mark Resolved/i });
    fireEvent.click(resolveBtn);
    
    expect(mockResolveIncident).toHaveBeenCalledWith(0);
  });

});
