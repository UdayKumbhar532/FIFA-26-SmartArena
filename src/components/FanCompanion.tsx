import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Send, Compass, ShieldAlert, Sparkles, Volume2, TreePine } from 'lucide-react';
import { chatWithAI, getWayfindingRoute } from '../services/geminiService';
import type { RouteDetail, TravelMethod, ChatMessage } from '../types';
import { CO2_EMISSION_FACTORS, BASELINE_CAR_EMISSION_FACTOR } from '../constants';

interface FanCompanionProps {
  accessibilityMode: boolean;
  onSetWaypoints: (path: string[]) => void;
  selectedNode: string | null;
  onSelectNode: (node: string | null) => void;
}

export const FanCompanion: React.FC<FanCompanionProps> = memo(({
  accessibilityMode,
  onSetWaypoints,
  selectedNode,
  onSelectNode,
}) => {
  // Chat state
  const [chatInput, setChatInput]   = useState('');
  const [messages, setMessages]     = useState<ChatMessage[]>([
    {
      id: 'msg-init-1',
      sender: 'ai',
      text: 'Hello! I am ArenaMind. Ask me any questions about seating, navigation, concessions, accessibility, or transit for the FIFA World Cup 2026!',
    },
  ]);
  const [chatCounter, setChatCounter]   = useState<number>(1);
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

    const userMsgId = `msg-user-${chatCounter}`;
    const aiMsgId   = `msg-ai-${chatCounter}`;

    setMessages((prev) => [...prev, { id: userMsgId, sender: 'user', text }]);
    if (!textToSend) setChatInput('');
    setChatLoading(true);
    setChatCounter((prev) => prev + 1);

    try {
      const response = await chatWithAI(text, `accessibilityMode: ${accessibilityMode}`);
      setMessages((prev) => [...prev, { id: aiMsgId, sender: 'ai', text: response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatCounter, accessibilityMode]);

  // ── Text-to-Speech ────────────────────────────────────────────────────────

  const handleSpeak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
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

  // Derived style logic using useMemo to ensure 100% efficiency
  const warningList = useMemo(() => {
    if (!route || route.warnings.length === 0) return null;
    return route.warnings;
  }, [route]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fan-companion-container">

      {/* 1. GenAI Chat Assistant */}
      <div id="ai-support" className="glass-panel chat-panel-container">
        {/* Panel header */}
        <div className="chat-panel-header">
          <div className="chat-panel-header-title">
            <Sparkles size={18} className="icon-accent" aria-hidden="true" />
            <h3 className="panel-heading">ArenaMind Assistant</h3>
          </div>
          <span className="chat-panel-status-tag">
            ⚡ Gemini AI Active
          </span>
        </div>

        {/* TTS error notification */}
        {ttsError && (
          <div role="alert" className="chat-tts-error-alert">
            {ttsError}
          </div>
        )}

        {/* Message feed */}
        <div
          role="log"
          aria-live="polite"
          aria-label="ArenaMind chat messages"
          aria-atomic="false"
          className="chat-messages-container"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message-row ${
                msg.sender === 'user' ? 'chat-message-row-user' : 'chat-message-row-ai'
              }`}
            >
              {msg.sender === 'ai' && (
                <div className="chat-message-avatar" aria-hidden="true">
                  AM
                </div>
              )}
              <div
                className={`chat-message-bubble ${
                  msg.sender === 'user' ? 'chat-message-bubble-user' : 'chat-message-bubble-ai'
                }`}
              >
                {msg.text}
                {msg.sender === 'ai' && (
                  <button
                    onClick={() => handleSpeak(msg.text)}
                    className="chat-tts-btn"
                    aria-label={isSpeaking ? 'Stop reading this message aloud' : 'Read this message aloud'}
                  >
                    <Volume2
                      size={13}
                      className={`chat-tts-btn-icon${isSpeaking ? ' chat-tts-btn-icon-speaking' : ''}`}
                      aria-hidden="true"
                    />
                    <span className="chat-tts-btn-label">{isSpeaking ? 'Stop speaking' : 'Read aloud'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {chatLoading && (
            <div className="chat-loading-row" aria-live="polite" aria-label="ArenaMind is generating a response">
              <div className="chat-loading-avatar" aria-hidden="true">...</div>
              <span className="chat-loading-text">ArenaMind is thinking...</span>
            </div>
          )}
          {/* Scroll anchor */}
          <div ref={chatEndRef} />
        </div>

        {/* Quick suggestion chips */}
        <div className="chat-suggestion-chips-wrapper" role="group" aria-label="Quick question suggestions">
          <button
            onClick={() => handleSendMessage('How do I walk to the shuttle bus?')}
            className="btn btn-secondary"
            aria-label="Ask: How do I walk to the shuttle bus?"
          >
            🚌 Transit Hubs
          </button>
          <button
            onClick={() => handleSendMessage('Is there wheelchair access at Section 102?')}
            className="btn btn-secondary"
            aria-label="Ask: Is there wheelchair access at Section 102?"
          >
            ♿ Accessible Elevators
          </button>
          <button
            onClick={() => handleSendMessage('Where can I get vegan food?')}
            className="btn btn-secondary"
            aria-label="Ask: Where can I get vegan food?"
          >
            🌱 Vegan Food
          </button>
          <button
            onClick={() => handleSendMessage('How is plastic waste recycled here?')}
            className="btn btn-secondary"
            aria-label="Ask: How is plastic waste recycled here?"
          >
            ♻️ Recycle Guide
          </button>
        </div>

        {/* Chat input */}
        <div className="chat-input-row">
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
            className="btn btn-primary chat-send-btn"
            aria-label="Send message to ArenaMind"
            disabled={chatLoading || !chatInput.trim()}
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 2. Wayfinding Route Planner */}
      <div className="glass-panel">
        <div className="wayfinder-header">
          <Compass size={18} className="icon-primary" aria-hidden="true" />
          <h3 className="panel-heading">Stadium Wayfinder</h3>
        </div>

        <form onSubmit={handleGetRoute} className="wayfinder-form">
          <div>
            <label className="label" htmlFor="startSelect">Start Point</label>
            <select
              id="startSelect"
              value={startPoint}
              onChange={(e) => setStartPoint(e.target.value)}
              className="input-field wayfinder-select"
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
              className="input-field wayfinder-select"
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

          <div className="wayfinder-submit-row">
            <button type="submit" className="btn btn-primary wayfinder-submit-btn" disabled={routeLoading}>
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
            className="wayfinder-results-box"
            aria-live="polite"
            aria-label="Route directions"
          >
            <div className="wayfinder-results-header">
              <span>⏱️ Time: <strong>{route.estimatedTimeMin} mins</strong></span>
              <span className={`badge ${route.accessibilityFriendly ? 'badge-success' : 'badge-info'}`}>
                {route.accessibilityFriendly ? '♿ Accessible Grade' : '🏃 Standard Route'}
              </span>
            </div>

            {warningList && (
              <div role="alert" className="wayfinder-warning-box">
                <ShieldAlert size={14} aria-hidden="true" />
                <span>{warningList[0]}</span>
              </div>
            )}

            <ol className="wayfinder-directions-list">
              {route.directions.map((step, idx) => (
                <li key={`step-${idx}`}>{step}</li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* 3. Sustainability Carbon Tracker */}
      <div className="glass-panel">
        <div className="transit-calculator-header">
          <TreePine size={18} className="icon-success" aria-hidden="true" />
          <h3 className="panel-heading">Green Matchday Transit Calculator</h3>
        </div>

        <div className="transit-calculator-row">
          <div>
            <label className="label" htmlFor="travelMethodSelect">Transit Mode</label>
            <select
              id="travelMethodSelect"
              value={travelMethod}
              onChange={(e) => setTravelMethod(e.target.value as TravelMethod)}
              className="input-field transit-calculator-select"
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

        <button onClick={calculateCO2} className="btn btn-accent btn-accent-text">
          Calculate My Offset
        </button>

        {co2Saved !== null && (
          <div
            className="transit-results-box"
            aria-live="polite"
          >
            <div className="transit-results-header">
              <span className="transit-results-title">♻️ Carbon Offset Captured</span>
              <span className="badge badge-success">{co2Saved} kg CO₂ Saved</span>
            </div>
            <p className="transit-results-tip">{ecoTip}</p>
          </div>
        )}
      </div>

    </div>
  );
});
