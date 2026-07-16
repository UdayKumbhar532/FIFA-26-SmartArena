import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Compass, ShieldAlert, Sparkles, Volume2, TreePine } from 'lucide-react';
import { chatWithAI, getWayfindingRoute } from '../services/geminiService';
import type { RouteDetail, TravelMethod } from '../types';
import { CO2_EMISSION_FACTORS, BASELINE_CAR_EMISSION_FACTOR } from '../constants';


interface FanCompanionProps {
  accessibilityMode: boolean;
  onSetWaypoints: (path: string[]) => void;
  selectedNode: string | null;
  onSelectNode: (node: string | null) => void;
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export const FanCompanion: React.FC<FanCompanionProps> = ({
  accessibilityMode,
  onSetWaypoints,
  selectedNode,
  onSelectNode,
}) => {
  // Chat state
  const [chatInput, setChatInput]   = useState('');
  const [messages, setMessages]     = useState<ChatMessage[]>([
    { sender: 'ai', text: 'Hello! I am ArenaMind. Ask me any questions about seating, navigation, concessions, accessibility, or transit for the FIFA World Cup 2026!' },
  ]);
  const [chatLoading, setChatLoading]   = useState(false);
  const [isSpeaking, setIsSpeaking]     = useState(false);
  const [ttsError, setTtsError]         = useState<string | null>(null);

  // Wayfinding state
  const [startPoint, setStartPoint]   = useState('Gate A');
  const [endPoint, setEndPoint]       = useState('Section 104');
  const [route, setRoute]             = useState<RouteDetail | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Sustainability state
  const [travelMethod, setTravelMethod]   = useState<TravelMethod>('metro');
  const [travelDistance, setTravelDistance] = useState(15);
  const [co2Saved, setCo2Saved]           = useState<number | null>(null);
  const [ecoTip, setEcoTip]               = useState('');

  // Ref for auto-scrolling the chat feed to the latest message
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current?.scrollIntoView) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatLoading]);

  // Sync selected map node into wayfinding dropdowns
  useEffect(() => {
    if (selectedNode) {
      if (selectedNode.toLowerCase().includes('gate')) {
        setStartPoint(selectedNode);
      } else {
        setEndPoint(selectedNode);
      }
    }
  }, [selectedNode]);

  // ── Chat ──────────────────────────────────────────────────────────────────

  const handleSendMessage = useCallback(async (textToSend?: string) => {
    const text = textToSend ?? chatInput;
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { sender: 'user', text }]);
    if (!textToSend) setChatInput('');
    setChatLoading(true);

    try {
      const response = await chatWithAI(text, `accessibilityMode: ${accessibilityMode}`);
      setMessages((prev) => [...prev, { sender: 'ai', text: response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, accessibilityMode]);

  // ── Text-to-Speech ────────────────────────────────────────────────────────

  const handleSpeak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      // Replace browser alert() with an in-UI error notification
      setTtsError('Text-to-speech is not supported in your browser.');
      setTimeout(() => setTtsError(null), 4000);
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking]);

  // ── Wayfinding ────────────────────────────────────────────────────────────

  const handleGetRoute = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setRouteLoading(true);
    try {
      const routeDetail = await getWayfindingRoute(startPoint, endPoint, accessibilityMode);
      setRoute(routeDetail);
      onSetWaypoints(routeDetail.path);
    } catch (err) {
      console.error('Route lookup failed:', err);
    } finally {
      setRouteLoading(false);
    }
  }, [startPoint, endPoint, accessibilityMode, onSetWaypoints]);

  const handleClearRoute = useCallback(() => {
    setRoute(null);
    onSetWaypoints([]);
    onSelectNode(null);
  }, [onSetWaypoints, onSelectNode]);

  // ── Sustainability Carbon Calculator ──────────────────────────────────────

  const calculateCO2 = useCallback(() => {
    const baselineEmission = BASELINE_CAR_EMISSION_FACTOR * travelDistance;
    const currentEmission  = CO2_EMISSION_FACTORS[travelMethod] * travelDistance;
    const saved = Math.max(0, baselineEmission - currentEmission);
    setCo2Saved(Number(saved.toFixed(2)));

    const tips: Record<TravelMethod, string> = {
      walking:   'Wow! Pure zero carbon. You offset 100% of your transit footprint. Have a nice stroll to the match!',
      metro:     'Excellent choice. Rail systems are the backbone of tournament transit, running on clean electric grids.',
      bus:       'Great job. Riding shuttles removes single vehicles from access corridors, speeding up local operations.',
      rideshare: 'Ridesharing is convenient, but try the direct FIFA Express Shuttle next time to save even more carbon emissions!',
    };
    setEcoTip(tips[travelMethod]);
  }, [travelMethod, travelDistance]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-lg)' }}>

      {/* 1. GenAI Chat Assistant */}
      <div id="ai-support" className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
        {/* Panel header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>ArenaMind Assistant</h3>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 600 }}>
            ⚡ Gemini AI Active
          </span>
        </div>

        {/* TTS error notification — replaces browser alert() */}
        {ttsError && (
          <div
            role="alert"
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--color-danger)', fontSize: '12px', marginBottom: 'var(--spacing-sm)' }}
          >
            {ttsError}
          </div>
        )}

        {/* Message feed — aria-live region so screen readers announce new AI messages */}
        <div
          role="log"
          aria-live="polite"
          aria-label="ArenaMind chat messages"
          aria-atomic="false"
          style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px', marginBottom: 'var(--spacing-md)' }}
        >
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: '8px' }}>
              {msg.sender === 'ai' && (
                <div
                  style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--color-primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: 'var(--color-primary)', flexShrink: 0 }}
                  aria-hidden="true"
                >
                  AM
                </div>
              )}
              <div
                style={{
                  maxWidth: '75%',
                  padding: '10px 14px',
                  borderRadius: msg.sender === 'user' ? '12px 12px 0 12px' : '0 12px 12px 12px',
                  background: msg.sender === 'user' ? 'linear-gradient(135deg, var(--color-primary), #6d28d9)' : 'rgba(255,255,255,0.04)',
                  border: msg.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.06)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                }}
              >
                {msg.text}
                {msg.sender === 'ai' && (
                  <button
                    onClick={() => handleSpeak(msg.text)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}
                    aria-label={isSpeaking ? 'Stop reading this message aloud' : 'Read this message aloud'}
                  >
                    <Volume2
                      size={13}
                      style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle', color: isSpeaking ? 'var(--color-accent)' : 'inherit' }}
                      aria-hidden="true"
                    />
                    <span style={{ fontSize: '10px' }}>{isSpeaking ? 'Stop speaking' : 'Read aloud'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {chatLoading && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} aria-live="polite" aria-label="ArenaMind is generating a response">
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--text-muted)' }} aria-hidden="true">...</div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ArenaMind is thinking...</span>
            </div>
          )}
          {/* Scroll anchor */}
          <div ref={chatEndRef} />
        </div>

        {/* Quick suggestion chips */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '6px' }} role="group" aria-label="Quick question suggestions">
          <button
            onClick={() => handleSendMessage('How do I walk to the shuttle bus?')}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '11px', borderRadius: 'var(--radius-round)' }}
            aria-label="Ask: How do I walk to the shuttle bus?"
          >
            🚌 Transit Hubs
          </button>
          <button
            onClick={() => handleSendMessage('Is there wheelchair access at Section 102?')}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '11px', borderRadius: 'var(--radius-round)' }}
            aria-label="Ask: Is there wheelchair access at Section 102?"
          >
            ♿ Accessible Elevators
          </button>
          <button
            onClick={() => handleSendMessage('Where can I get vegan food?')}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '11px', borderRadius: 'var(--radius-round)' }}
            aria-label="Ask: Where can I get vegan food?"
          >
            🌱 Vegan Food
          </button>
          <button
            onClick={() => handleSendMessage('How is plastic waste recycled here?')}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '11px', borderRadius: 'var(--radius-round)' }}
            aria-label="Ask: How is plastic waste recycled here?"
          >
            ♻️ Recycle Guide
          </button>
        </div>

        {/* Chat input */}
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <input
            type="text"
            id="chat-input"
            className="input-field"
            placeholder="Type your stadium question..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            aria-label="Type your question to ArenaMind"
            autoComplete="off"
          />
          <button
            onClick={() => handleSendMessage()}
            className="btn btn-primary"
            style={{ padding: '12px' }}
            aria-label="Send message to ArenaMind"
            disabled={chatLoading || !chatInput.trim()}
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 2. Wayfinding Route Planner */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 'var(--spacing-sm)' }}>
          <Compass size={18} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Stadium Wayfinder</h3>
        </div>

        <form onSubmit={handleGetRoute} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
          <div>
            <label className="label" htmlFor="startSelect">Start Point</label>
            <select
              id="startSelect"
              value={startPoint}
              onChange={(e) => setStartPoint(e.target.value)}
              className="input-field"
              style={{ background: '#120f35' }}
            >
              <option value="Gate A">Gate A (Top-Left)</option>
              <option value="Gate B">Gate B (Top-Right)</option>
              <option value="Gate C">Gate C (Bottom-Right)</option>
              <option value="Gate D">Gate D (Bottom-Left)</option>
              <option value="Section 104">Section 104 ADA Deck</option>
              <option value="Section 112">Section 112 Seats</option>
              <option value="Section 108">Section 108 Seats</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="destSelect">Destination</label>
            <select
              id="destSelect"
              value={endPoint}
              onChange={(e) => setEndPoint(e.target.value)}
              className="input-field"
              style={{ background: '#120f35' }}
            >
              <option value="Section 102">Section 102 Seating</option>
              <option value="Section 104">Section 104 ADA Deck</option>
              <option value="Section 106">Section 106 Seating</option>
              <option value="Section 108">Section 108 Seating</option>
              <option value="Section 112">Section 112 Seating</option>
              <option value="GreenBites Vegan Food">GreenBites Vegan Food</option>
              <option value="Main Concession Row">Main Concession Row</option>
              <option value="Medical Hub">Medical Hub / First Aid</option>
              <option value="Eco-Bin A">Recycling Bin A</option>
            </select>
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', gap: 'var(--spacing-sm)', marginTop: '4px' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={routeLoading}>
              {routeLoading ? 'Calculating Path...' : 'Find Route'}
            </button>
            {route && (
              <button type="button" onClick={handleClearRoute} className="btn btn-secondary">
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Route directions */}
        {route && (
          <div
            style={{ padding: 'var(--spacing-md)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}
            aria-live="polite"
            aria-label="Route directions"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '4px' }}>
              <span>⏱️ Time: <strong>{route.estimatedTimeMin} mins</strong></span>
              <span className={`badge ${route.accessibilityFriendly ? 'badge-success' : 'badge-info'}`}>
                {route.accessibilityFriendly ? '♿ Accessible Grade' : '🏃 Standard Route'}
              </span>
            </div>

            {route.warnings.length > 0 && (
              <div role="alert" style={{ color: 'var(--color-warning)', display: 'flex', gap: '6px', alignItems: 'center', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
                <ShieldAlert size={14} aria-hidden="true" />
                <span>{route.warnings[0]}</span>
              </div>
            )}

            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)' }}>
              {route.directions.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* 3. Sustainability Carbon Tracker */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 'var(--spacing-sm)' }}>
          <TreePine size={18} style={{ color: 'var(--color-success)' }} aria-hidden="true" />
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Green Matchday Transit Calculator</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
          <div>
            <label className="label" htmlFor="travelMethodSelect">Transit Mode</label>
            <select
              id="travelMethodSelect"
              value={travelMethod}
              onChange={(e) => setTravelMethod(e.target.value as TravelMethod)}
              className="input-field"
              style={{ background: '#120f35' }}
            >
              <option value="walking">🏃 Walking / Cycling</option>
              <option value="metro">🚇 Electric Metro / Rail</option>
              <option value="bus">🚌 FIFA Express Shuttle</option>
              <option value="rideshare">🚗 Ride-share (Car)</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="distInput">One-Way Distance (km)</label>
            <input
              id="distInput"
              type="number"
              className="input-field"
              value={travelDistance}
              onChange={(e) => setTravelDistance(Number(e.target.value))}
              min="1"
              max="200"
              aria-describedby="dist-hint"
            />
            <span id="dist-hint" className="sr-only">Enter a distance between 1 and 200 kilometres.</span>
          </div>
        </div>

        <button onClick={calculateCO2} className="btn btn-accent" style={{ color: 'var(--bg-primary)' }}>
          Calculate My Offset
        </button>

        {co2Saved !== null && (
          <div
            style={{ marginTop: 'var(--spacing-sm)', padding: 'var(--spacing-md)', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: 'var(--radius-sm)' }}
            aria-live="polite"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-success)' }}>♻️ Carbon Offset Captured</span>
              <span className="badge badge-success">{co2Saved} kg CO₂ Saved</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{ecoTip}</p>
          </div>
        )}
      </div>

    </div>
  );
};
