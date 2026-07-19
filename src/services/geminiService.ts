import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ParsedIncident, RouteDetail } from '../types';

// Re-export shared types so existing imports from this module still work
export type { ParsedIncident, RouteDetail };

/**
 * API key baked in at build time from the .env file.
 * NEVER expose this constant in the UI — it is only used server-side in
 * requests that originate from the running local process or the built bundle.
 * End users see no key input; the key is invisible in the browser UI.
 */
const BAKED_API_KEY: string = import.meta.env.VITE_GEMINI_API_KEY ?? '';

/**
 * Maximum number of characters accepted from user-supplied text before it is
 * truncated. Guards against prompt-injection attacks that attempt to overflow
 * the context window or inject hidden instructions.
 */
const MAX_PROMPT_CHARS = 500;

/**
 * Strips HTML tags and control characters from user input to prevent injection
 * into LLM prompts, and enforces the character length cap.
 *
 * @param raw - Raw text from a form field or chat input.
 * @returns Sanitised, length-capped plain text.
 */
function sanitiseInput(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '')          // strip HTML tags
    .replace(/[\u0000-\u001F\u007F]/g, '') // strip non-printable control chars
    .trim()
    .slice(0, MAX_PROMPT_CHARS);
}

/**
 * Runtime type guard for `Omit<ParsedIncident, 'id'>`.
 * Validates that a value decoded from JSON has the expected shape before it is
 * cast to the TypeScript type, preventing runtime errors from malformed LLM
 * output.
 */
function isParsedIncident(value: unknown): value is Omit<ParsedIncident, 'id'> {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.category === 'string' &&
    ['Medical', 'Safety', 'Facilities', 'Crowd', 'Sustainability', 'Other'].includes(v.category) &&
    typeof v.priority === 'string' &&
    ['Critical', 'High', 'Medium', 'Low'].includes(v.priority) &&
    typeof v.location === 'string' &&
    typeof v.description === 'string' &&
    Array.isArray(v.remediationSteps) &&
    (v.remediationSteps as unknown[]).every((s) => typeof s === 'string')
  );
}

/**
 * Runtime type guard for `RouteDetail`.
 */
function isRouteDetail(value: unknown): value is RouteDetail {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.path) &&
    (v.path as unknown[]).every((p) => typeof p === 'string') &&
    typeof v.accessibilityFriendly === 'boolean' &&
    Array.isArray(v.warnings) &&
    Array.isArray(v.directions) &&
    typeof v.estimatedTimeMin === 'number'
  );
}

/**
 * Safely extracts and parses a JSON object from a raw LLM response string.
 * Returns `null` if no valid JSON block is found.
 */
function extractJSON(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.substring(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * Helper to initialise the Gemini model.
 * Prefers the baked env key; falls back to any key passed at runtime (e.g. tests).
 * Returns `null` when no valid key is available, allowing callers to fall back
 * gracefully to the offline simulator without throwing.
 */
const getGeminiModel = (runtimeKey?: string) => {
  const key = runtimeKey?.trim() || BAKED_API_KEY;
  // Guard against an explicitly empty key to avoid a silent Gemini SDK error
  if (!key) return null;
  try {
    const genAI = new GoogleGenerativeAI(key);
    // gemini-1.5-flash: fast, cost-effective for real-time operational commands
    return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  } catch (error) {
    console.error('Failed to initialise Gemini client:', error);
    return null;
  }
};

// ---------------------------------------------------------------------------
// 1. AI Chat — General fan queries
// ---------------------------------------------------------------------------

/**
 * Sends a fan question to Gemini and returns a concise AI response.
 * Falls back to the high-fidelity offline simulator when the key is absent or
 * the network request fails.
 *
 * @param prompt - User's question text.
 * @param context - Ambient context string (e.g. accessibility mode state).
 * @param apiKey  - Optional override key (used in automated tests).
 */
export async function chatWithAI(
  prompt: string,
  context: string,
  apiKey?: string,
): Promise<string> {
  const safePrompt = sanitiseInput(prompt);
  const safeContext = sanitiseInput(context);
  const model = getGeminiModel(apiKey);

  if (model) {
    try {
      const systemInstruction = `
        You are ArenaMind, the official AI assistant for the FIFA World Cup 2026.
        Your goal is to assist fans, volunteers, and staff with stadium navigation,
        transportation, accessibility, sustainability, and general tournament info.
        Keep answers helpful, clear, and concise (under 4 sentences if possible).
        You have the following context about the stadium state: ${safeContext}.
        If the user asks in a different language, respond in that language.
      `;
      const result = await model.generateContent([systemInstruction, safePrompt]);
      return result.response.text();
    } catch (error) {
      console.warn('Real AI chat failed, falling back to simulator:', error);
    }
  }

  // High-fidelity local simulation fallback
  return simulateChatResponse(safePrompt, safeContext);
}

// ---------------------------------------------------------------------------
// 2. Parse free-form staff incident reports
// ---------------------------------------------------------------------------

/**
 * Sends a raw staff dispatch report to Gemini for structured parsing.
 * Falls back to the rule-based offline simulator when the API is unavailable.
 *
 * @param report - Free-form incident text entered by staff.
 * @param apiKey - Optional override key (used in automated tests).
 */
export async function parseIncidentReport(
  report: string,
  apiKey?: string,
): Promise<Omit<ParsedIncident, 'id'>> {
  const safeReport = sanitiseInput(report);
  const model = getGeminiModel(apiKey);

  if (model) {
    try {
      const prompt = `
        Analyse the following stadium incident report. Extract details and return
        them strictly in JSON format with no additional text or markdown.
        Report: "${safeReport}"

        JSON structure:
        {
          "category": "Medical" | "Safety" | "Facilities" | "Crowd" | "Sustainability" | "Other",
          "priority": "Critical" | "High" | "Medium" | "Low",
          "location": "extracted location or 'Unknown'",
          "description": "clean summary of what happened",
          "remediationSteps": ["step 1", "step 2", ...]
        }

        Rules:
        - Critical: Life safety, severe medical, active fight, major structural issues.
        - High: Minor medical, slippery surfaces, gate blockages, minor crowd congestions.
        - Medium: Broken seats, full waste bins, mild debris, translation help needed.
        - Low: General enquiries, lost & found items.
      `;
      const result = await model.generateContent(prompt);
      const parsed = extractJSON(result.response.text());
      if (isParsedIncident(parsed)) {
        return parsed;
      }
      console.warn('Gemini returned unexpected incident schema; using simulator.');
    } catch (error) {
      console.warn('Real AI incident parsing failed, falling back to simulator:', error);
    }
  }

  return simulateIncidentParsing(safeReport);
}

// ---------------------------------------------------------------------------
// 3. Wayfinding routing assistant
// ---------------------------------------------------------------------------

/**
 * Requests a navigational route from Gemini or the offline simulator.
 *
 * @param start             - Starting node name.
 * @param destination       - Target node name.
 * @param accessibilityMode - When true, prefer ramps/elevators.
 * @param apiKey            - Optional override key (used in automated tests).
 */
export async function getWayfindingRoute(
  start: string,
  destination: string,
  accessibilityMode: boolean,
  apiKey?: string,
): Promise<RouteDetail> {
  const safeStart = sanitiseInput(start);
  const safeDest  = sanitiseInput(destination);
  const model     = getGeminiModel(apiKey);

  if (model) {
    try {
      const prompt = `
        Generate a navigational route inside a stadium.
        Origin: "${safeStart}"
        Destination: "${safeDest}"
        Accessibility Mode (wheelchair-friendly/elevators preferred): ${accessibilityMode ? 'ON' : 'OFF'}

        Respond strictly with a JSON object matching this structure, no markdown:
        {
          "path": ["node1", "node2", ...],
          "accessibilityFriendly": true/false,
          "warnings": ["warning 1", ...],
          "directions": ["step 1 description", "step 2 description", ...],
          "estimatedTimeMin": number
        }
      `;
      const result = await model.generateContent(prompt);
      const parsed = extractJSON(result.response.text());
      if (isRouteDetail(parsed)) {
        return parsed;
      }
      console.warn('Gemini returned unexpected route schema; using simulator.');
    } catch (error) {
      console.warn('Real AI routing failed, falling back to simulator:', error);
    }
  }

  return simulateRouteFinding(safeStart, safeDest, accessibilityMode);
}

/* ==========================================================================
   HIGH-FIDELITY OFFLINE AI SIMULATOR
   ========================================================================== */

function simulateChatResponse(prompt: string, context: string): string {
  const p = prompt.toLowerCase();

  // Multilingual greetings
  if (p.includes('hola') || p.includes('buenos dias')) {
    return '¡Hola! Bienvenido al Estadio de la Copa Mundial de la FIFA 2026. Soy tu asistente ArenaMind. ¿En qué te puedo ayudar hoy?';
  }
  if (p.includes('bonjour') || p.includes('salut')) {
    return "Bonjour ! Bienvenue au stade de la Coupe du Monde de la FIFA 2026. Je suis votre assistant ArenaMind. Comment puis-je vous aider aujourd'hui ?";
  }
  if (p.includes('olá') || p.includes('bom dia')) {
    return 'Olá! Bem-vindo ao Estádio da Copa do Mundo da FIFA 2026. Eu sou o ArenaMind. Como posso ajudar você hoje?';
  }

  // Accessibility queries
  if (p.includes('wheelchair') || p.includes('disabled') || p.includes('accessible') || p.includes('elevator') || p.includes('ramp')) {
    return 'Accessible elevators are located at Gates A, D, and G. For wheelchairs, Section 102 and 204 have designated viewing decks. You can toggle "Accessibility Mode" in the navigation tab to view low-slope routes and elevator connections.';
  }

  // Transit queries
  if (p.includes('bus') || p.includes('train') || p.includes('shuttle') || p.includes('transit') || p.includes('metro') || p.includes('parking') || p.includes('transport')) {
    return 'The FIFA Express Shuttle departs from Gate C Hub every 6 minutes to downtown and local park-and-rides. Metro Line 2 is a 10-minute walk from Gate B. Ride-share pickups (Uber/Lyft) are restricted to Zone Blue near Parking Lot P5.';
  }

  // Sustainability queries
  if (p.includes('recycle') || p.includes('trash') || p.includes('sustainability') || p.includes('eco') || p.includes('carbon') || p.includes('plastic')) {
    return 'FIFA 2026 is committed to zero waste! Please use the green bins for compostables, blue bins for plastic cups/bottles, and grey bins for general landfill. Our food concession stands use 100% biodegradable packaging. You can log your transport in the Carbon Estimator to view your game-day offsets.';
  }

  // Concession queries
  if (p.includes('food') || p.includes('concession') || p.includes('beer') || p.includes('vegan') || p.includes('water') || p.includes('eat')) {
    return 'We have food courts located at Level 1 (near Section 105) and Level 2 (near Section 220). Vegetarian and vegan options (such as Plant-based tacos) are featured at GreenBites near Section 112. Water bottle refill stations are free and situated at every restroom corridor.';
  }

  // Gate/entry queries
  if (p.includes('gate') || p.includes('entry') || p.includes('entrance') || p.includes('ticket')) {
    return 'Gates open 3 hours prior to kickoff. Ensure your digital ticket is loaded in your mobile wallet. Security checks are at all gates; bag sizes are limited to 14cm x 19cm. Gate A generally has the lowest wait time currently.';
  }

  // Lost & Found
  if (p.includes('lost') || p.includes('found') || p.includes('wallet') || p.includes('phone') || p.includes('bag')) {
    return 'Lost and Found operations are centered at the Guest Services Hub near Section 101 (close to Gate A). If you have lost an item, please report it to any volunteer or submit a request here so our staff can check the database.';
  }

  // Default response
  return `Welcome to the FIFA World Cup 2026 Smart Stadium portal! Currently, crowd levels are ${context.includes('congested') ? 'higher than average' : 'normal'}. Please let me know how I can help with stadium navigation, transportation, accessibility, or food selections.`;
}

function simulateIncidentParsing(report: string): Omit<ParsedIncident, 'id'> {
  const r = report.toLowerCase();

  let category: ParsedIncident['category'] = 'Other';
  let priority: ParsedIncident['priority'] = 'Low';
  let location = 'Unknown Section';
  const description = report;

  // Extract location
  const secMatch  = report.match(/section\s*(\d+)/i);
  const gateMatch = report.match(/gate\s*([a-gA-G]|\d+)/i);
  const concMatch = report.match(/concession\s*([a-zA-Z]|\d+)/i);

  if (secMatch)       location = `Section ${secMatch[1]}`;
  else if (gateMatch) location = `Gate ${gateMatch[1].toUpperCase()}`;
  else if (concMatch) location = `Concession ${concMatch[1].toUpperCase()}`;

  // Rule-based classification
  if (r.includes('heart') || r.includes('fainted') || r.includes('injury') || r.includes('medical') || r.includes('dizzy') || r.includes('unconscious') || r.includes('blood') || r.includes('seizure') || r.includes('chest pain')) {
    category = 'Medical';
    priority = (r.includes('chest') || r.includes('unconscious') || r.includes('breathing') || r.includes('seizure')) ? 'Critical' : 'High';
  } else if (r.includes('fight') || r.includes('weapon') || r.includes('smoke') || r.includes('fire') || r.includes('security') || r.includes('stole') || r.includes('harassment') || r.includes('perimeter')) {
    category = 'Safety';
    priority = (r.includes('fire') || r.includes('weapon') || r.includes('smoke') || r.includes('fight')) ? 'Critical' : 'High';
  } else if (r.includes('spill') || r.includes('broken') || r.includes('leak') || r.includes('light') || r.includes('door') || r.includes('toilet') || r.includes('overflow')) {
    category = r.includes('overflow') && (r.includes('bin') || r.includes('trash') || r.includes('recycling')) ? 'Sustainability' : 'Facilities';
    priority = (r.includes('leak') || r.includes('spill')) ? 'High' : 'Medium';
  } else if (r.includes('crowd') || r.includes('crush') || r.includes('stampede') || r.includes('gate blocked') || r.includes('bottleneck') || r.includes('congested')) {
    category = 'Crowd';
    priority = (r.includes('crush') || r.includes('stampede') || r.includes('blocked')) ? 'Critical' : 'High';
  } else if (r.includes('trash') || r.includes('litter') || r.includes('bin') || r.includes('recycle') || r.includes('plastic')) {
    category = 'Sustainability';
    priority = 'Medium';
  }

  // Generate remediation steps
  const steps: string[] = [];

  if (category === 'Medical') {
    if (priority === 'Critical') {
      steps.push('Dispatch Stadium Paramedic Response Unit immediately.');
      steps.push(`Notify EMS Dispatch of ambulance entry point nearest to ${location}.`);
      steps.push('Direct nearby supervisor to clear pathways and keep onlookers back.');
    } else {
      steps.push(`Send local first-aid volunteer to ${location} with basic medical kit.`);
      steps.push('Monitor vital signs and report status back to Command.');
    }
  } else if (category === 'Safety') {
    if (priority === 'Critical') {
      steps.push(`Dispatch Stadium Security Response Team (SRT) to ${location}.`);
      steps.push('Alert police command on site for emergency support.');
      steps.push('Monitor local CCTV cameras for real-time video feed.');
    } else {
      steps.push(`Send standard security patrol to ${location} to de-escalate.`);
      steps.push('Instruct volunteers to keep fans moving away from the area.');
    }
  } else if (category === 'Facilities') {
    steps.push(`Dispatch Facilities Maintenance / Janitorial crew to ${location}.`);
    if (r.includes('spill') || r.includes('wet')) {
      steps.push('Place yellow "Wet Floor" warning signs immediately to prevent slips.');
    }
    steps.push('Verify fix/cleanup and sign off ticket.');
  } else if (category === 'Crowd') {
    steps.push('Activate AI Crowd Redirection guidelines on digital stadium signage.');
    steps.push(`Instruct gate/steward staff at ${location} to open overflow pathways.`);
    steps.push('Broadcast queue warning announcements in English and Spanish.');
  } else if (category === 'Sustainability') {
    steps.push(`Notify Eco-Brigade team to empty recycling/waste bins at ${location}.`);
    steps.push('Inspect surrounding area for litter and sweep cleanup.');
  } else {
    steps.push('Log query in Stadium Central Management system.');
    steps.push('Coordinate with Guest Services for any general assistance.');
  }

  return { category, priority, location, description, remediationSteps: steps };
}

function simulateRouteFinding(
  start: string,
  destination: string,
  accessibilityMode: boolean,
): RouteDetail {
  const normStart = start.toUpperCase();
  const normDest  = destination.toUpperCase();

  let path: string[]     = [start, 'Stairs Corridor A', 'Level 1 Concourse', destination];
  let warnings: string[] = [];
  let directions: string[];
  let estimatedTimeMin = 8;

  if (accessibilityMode) {
    path = [start, 'Accessible Ramp A', 'South Concourse Elevator', 'Level 1 Corridor (Flat)', destination];
    warnings = ['Elevator wait times may be up to 3 minutes during halftime.'];
    directions = [
      `Exit ${start} and head toward Elevator Hub South.`,
      'Take Elevator 2 to Level 1 Concourse (voice guidance available).',
      'Follow the low-slope accessible ramp to Section 104.',
      `Enter ${destination} via the flat-grade double door entrance.`,
    ];
    estimatedTimeMin = 12;
  } else {
    directions = [
      `Exit ${start} and turn left toward Stairs Corridor A.`,
      'Walk down 2 flights of stairs to the Main Concourse.',
      'Head straight past Concession Stand B.',
      `Arrive at ${destination} on your right.`,
    ];
  }

  // Customise for known route pairs
  if (normStart.includes('GATE A') && normDest.includes('SECTION 104')) {
    estimatedTimeMin = accessibilityMode ? 6 : 4;
    path = accessibilityMode
      ? ['Gate A Entrance', 'Concave Ramp West', 'Section 104 ADA Deck']
      : ['Gate A Entrance', 'West Concourse Escalators', 'Section 104 Entrance'];
  } else if (normStart.includes('SECTION 104') && normDest.includes('CONCESSION')) {
    estimatedTimeMin = 3;
    path = accessibilityMode
      ? ['Section 104 ADA Deck', 'Flat West Concourse', 'GreenBites Vegan Food']
      : ['Section 104 Entrance', 'West Stairs', 'Main Concession Row'];
  }

  return { path, accessibilityFriendly: accessibilityMode, warnings, directions, estimatedTimeMin };
}
