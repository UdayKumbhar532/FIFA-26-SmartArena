import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { parseIncidentReport, getWayfindingRoute, chatWithAI } from '../services/geminiService';
import { FanCompanion } from '../components/FanCompanion';
import { StaffDashboard } from '../components/StaffDashboard';

// ===========================================================================
// 1. Service Logic & Security Sanitisation Tests
// ===========================================================================
describe('Gemini AI Service / Offline Simulator Logic', () => {

  it('should classify and prioritise safety reports accurately', async () => {
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

  it('should classify crowd control reports', async () => {
    const result = await parseIncidentReport('Bottleneck forming and crowd stampede warning near Gate B entrance');
    expect(result.category).toBe('Crowd');
    expect(result.priority).toBe('Critical');
    expect(result.location).toBe('Gate B');
  });

  it('should classify sustainability reports from waste issues', async () => {
    const result = await parseIncidentReport('Recycling bin overflowing near Concession A');
    expect(result.category).toBe('Sustainability');
    expect(result.priority).toBe('Medium');
    expect(result.location).toBe('Concession A');
  });

  it('should fallback to other/low on empty or malformed inputs', async () => {
    const result = await parseIncidentReport('     ');
    expect(result.category).toBe('Other');
    expect(result.priority).toBe('Low');
    expect(result.location).toBe('Unknown Section');
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

  it('should yield a sensible fallback response for generic/unknown queries', async () => {
    const defaultResponse = await chatWithAI('Unknown query string 12345', 'idle');
    expect(defaultResponse).toContain('FIFA World Cup 2026');
  });

  it('should sanitise user prompts to remove HTML content', async () => {
    const chatResult = await chatWithAI('Hello <script>alert("XSS")</script>', 'idle');
    // Ensure it doesn't crash and returns the standard response safely
    expect(chatResult).toBeDefined();
    
    const incidentResult = await parseIncidentReport('Spill in <b>Section 102</b>');
    expect(incidentResult.location).toBe('Section 102');
  });
});

// ===========================================================================
// 2. Fan Companion Integration & Accessibility Tests
// ===========================================================================
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

  it('calculates carbon offsets correctly for zero-emission walking transit', () => {
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
    fireEvent.change(distInput, { target: { value: '10' } });

    // Select Walking Mode
    const selectMode = screen.getByLabelText(/Transit Mode/i);
    fireEvent.change(selectMode, { target: { value: 'walking' } });

    // Click Calculate
    const calcButton = screen.getByRole('button', { name: /Calculate My Offset/i });
    fireEvent.click(calcButton);

    // Assert CO2 offsets displayed
    // Baseline (0.220 * 10 = 2.2kg), Walking (0.0kg) -> 2.20kg offset saved
    expect(screen.getByText(/2.2 kg CO₂ Saved/i)).toBeInTheDocument();
    expect(screen.getByText(/Pure zero carbon/i)).toBeInTheDocument();
  });

  it('populates wayfinding start dropdown when a Gate node is selected on the map', () => {
    const mockSetWaypoints = vi.fn();
    const mockSelectNode = vi.fn();

    const { rerender } = render(
      <FanCompanion
        accessibilityMode={false}
        onSetWaypoints={mockSetWaypoints}
        selectedNode={null}
        onSelectNode={mockSelectNode}
      />
    );

    // Initial value is Gate A
    const startSelect = screen.getByLabelText(/Start Point/i) as HTMLSelectElement;
    expect(startSelect.value).toBe('Gate A');

    // Rerender with active Gate selected from the map
    rerender(
      <FanCompanion
        accessibilityMode={false}
        onSetWaypoints={mockSetWaypoints}
        selectedNode="Gate B"
        onSelectNode={mockSelectNode}
      />
    );

    expect(startSelect.value).toBe('Gate B');
  });

  it('has appropriate aria-live logging region for fan companion chats', () => {
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

    const logRegion = screen.getByRole('log');
    expect(logRegion).toBeInTheDocument();
    expect(logRegion).toHaveAttribute('aria-live', 'polite');
  });
});

// ===========================================================================
// 3. Staff Command Dashboard Integration & Locking Tests
// ===========================================================================
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
        remediationSteps: ['Empty the bin.'],
      },
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

  it('disables incident dispatcher when emergency stop dispatch is active', () => {
    const mockUpdateCrowd = vi.fn();
    const mockAddIncident = vi.fn();
    const mockResolveIncident = vi.fn();

    render(
      <StaffDashboard
        crowdDensities={{ 'Section 102': 30 }}
        onUpdateCrowd={mockUpdateCrowd}
        incidents={[]}
        onAddIncident={mockAddIncident}
        onResolveIncident={mockResolveIncident}
        emergencyStopDispatch={true}
      />
    );

    // Raw report input should be disabled
    const textarea = screen.getByPlaceholderText(/Dispatch queue is frozen/i);
    expect(textarea).toBeDisabled();

    // Submit button should be disabled
    const submitBtn = screen.getByRole('button', { name: /Dispatch Report/i });
    expect(submitBtn).toBeDisabled();

    // Presets should be disabled
    const presets = screen.getAllByRole('button');
    presets.forEach((btn) => {
      // Except the 'Refresh Simulation' button, 'Simulate Fan Waste' button, and 'Empty Bin' buttons
      if (
        btn.textContent?.includes('Refresh Simulation') ||
        btn.textContent?.includes('Simulate Fan Waste') ||
        btn.textContent?.includes('Empty Bin')
      ) {
        return;
      }
      expect(btn).toBeDisabled();
    });
  });

  it('allows quick preset templates to populate raw dispatch text', () => {
    const mockUpdateCrowd = vi.fn();
    const mockAddIncident = vi.fn();
    const mockResolveIncident = vi.fn();

    render(
      <StaffDashboard
        crowdDensities={{ 'Section 102': 30 }}
        onUpdateCrowd={mockUpdateCrowd}
        incidents={[]}
        onAddIncident={mockAddIncident}
        onResolveIncident={mockResolveIncident}
        emergencyStopDispatch={false}
      />
    );

    const presetBtn = screen.getByRole('button', { name: /Section 106 Spill/i });
    fireEvent.click(presetBtn);

    const textarea = screen.getByLabelText(/Raw Dispatch Text/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('Water spill near Section 106');
  });
});

// ===========================================================================
// 4. Accessibility Structural Smoke Tests
// ===========================================================================
describe('Accessibility Smoke Tests', () => {
  it('guarantees all buttons in the Staff Dashboard have accessible names', () => {
    const mockUpdateCrowd = vi.fn();
    const mockAddIncident = vi.fn();
    const mockResolveIncident = vi.fn();

    render(
      <StaffDashboard
        crowdDensities={{ 'Section 102': 30 }}
        onUpdateCrowd={mockUpdateCrowd}
        incidents={[]}
        onAddIncident={mockAddIncident}
        onResolveIncident={mockResolveIncident}
        emergencyStopDispatch={false}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).toHaveAccessibleName();
    });
  });
});
