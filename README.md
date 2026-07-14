# ⚽ FIFA 26 SmartArena — AI-Powered Stadium Operations Platform

<div align="center">

![FIFA 26 SmartArena Banner](https://img.shields.io/badge/FIFA%2026-SmartArena-gold?style=for-the-badge&logo=soccer&logoColor=white&labelColor=0a0a2e)
![Gemini AI](https://img.shields.io/badge/Gemini%201.5%20Flash-AI%20Powered-blue?style=for-the-badge&logo=google&logoColor=white)
![React](https://img.shields.io/badge/React%2018-TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-6%2F6%20Passing-10b981?style=for-the-badge&logo=vitest&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**A production-grade, GenAI-enabled stadium operations system for FIFA World Cup 2026.**  
Enhances navigation, crowd management, accessibility, sustainability, multilingual assistance, and real-time decision support.

[🚀 Live Demo](#-quick-start) · [📖 Docs](#-architecture) · [🧪 Tests](#-testing)

</div>

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Features](#-features)
- [Architecture](#-architecture)
- [System Workflow](#-system-workflow)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Security Model](#-security-model)
- [Accessibility](#-accessibility)
- [Testing](#-testing)
- [Screenshots](#-screenshots)

---

## 🎯 Problem Statement

FIFA World Cup 2026 venues will host **80,000+ concurrent fans** across multi-city stadiums. Key operational challenges include:

- 🧭 **Navigation chaos** — Fans struggle to find seats, concessions, and exits
- 👥 **Crowd bottlenecks** — Dangerous density build-ups at gates and corridors
- ♿ **Accessibility gaps** — Wheelchair users lack optimized routing
- 🌍 **Language barriers** — 200+ nationalities with multilingual needs
- 🚌 **Transport overload** — Uncoordinated post-match transit surges
- 🌱 **Sustainability tracking** — No real-time eco-impact visibility
- 🚨 **Incident response lag** — Manual reporting slows emergency dispatch

**SmartArena solves all of these** using a unified Generative AI platform.

---

## ✨ Features

### 👨‍👩‍👧 Fan Portal (Public-facing)
| Feature | Description |
|---|---|
| 🤖 **ArenaMind AI Chat** | Gemini-powered conversational assistant for navigation, food, transit, lost items |
| 🗺️ **AI Wayfinder** | Natural-language route planning with accessibility mode (elevators, ramps) |
| 🌍 **Multilingual Support** | Detects and responds in Spanish, French, Portuguese, and more |
| 🌿 **Carbon Estimator** | Calculates CO₂ savings vs baseline car travel for eco-aware fans |
| 🔊 **Text-to-Speech** | Web Speech API integration for visually impaired users |

### 🛡️ Operations Command (Staff-facing)
| Feature | Description |
|---|---|
| 📊 **Live Crowd Heat Map** | Real-time density monitoring across all stadium sections |
| 🧠 **AI Crowd Routing** | Automatic congestion detection with gate-redirect recommendations |
| 📋 **Incident Dispatcher** | AI parses raw text reports into structured dispatch commands |
| 🗑️ **Eco-Brigade Monitor** | Waste bin fill-level tracker with overflow alerts |
| 🚨 **Emergency Stop Dispatch** | System-wide lockdown that freezes all dispatch queues instantly |

### 🧭 Navigation Drawer (All Users)
- Hamburger menu with jump-navigation to: **Incidents**, **AI Support**, **Crowd Heat Map**, **Analytics**
- Animated slide-out with backdrop blur and focus management
- Keyboard-accessible (Escape to close, Tab/focus trap)

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    FIFA 26 SmartArena Platform                    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    React Frontend (SPA)                  │    │
│  │                                                          │    │
│  │   ┌────────────┐  ┌───────────────┐  ┌──────────────┐  │    │
│  │   │ Fan Portal │  │  Operations   │  │   Settings   │  │    │
│  │   │            │  │   Command     │  │    Panel     │  │    │
│  │   │ • AI Chat  │  │ • Crowd Map   │  │ • A11y Mode  │  │    │
│  │   │ • Wayfind  │  │ • Incidents   │  │ • Hi-Contrast│  │    │
│  │   │ • Carbon   │  │ • Eco Bins    │  │              │  │    │
│  │   │ • TTS      │  │ • Dispatch    │  │              │  │    │
│  │   └─────┬──────┘  └──────┬────────┘  └──────────────┘  │    │
│  │         │                │                              │    │
│  │   ┌─────▼────────────────▼──────────────────────────┐  │    │
│  │   │            Shared Components                     │  │    │
│  │   │   StadiumMap SVG  │  NavDrawer  │  EmergencyBanner│  │    │
│  │   └─────────────────────────────────────────────────┘  │    │
│  └───────────────────────────┬─────────────────────────────┘    │
│                              │                                   │
│  ┌───────────────────────────▼─────────────────────────────┐    │
│  │                  geminiService.ts                        │    │
│  │                                                          │    │
│  │   chatWithAI()  │  parseIncidentReport()  │  getRoute() │    │
│  │                                                          │    │
│  │   ┌─────────────────────┐  ┌─────────────────────────┐  │    │
│  │   │  Real Gemini API    │  │  Offline AI Simulator   │  │    │
│  │   │  (via env key)      │  │  (fallback, always on)  │  │    │
│  │   │  Gemini 1.5 Flash   │  │  Rule-based engine      │  │    │
│  │   └─────────────────────┘  └─────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Security Layer                                            │  │
│  │  .env (VITE_GEMINI_API_KEY) → Build-time injection only   │  │
│  │  No key exposure in UI  │  .gitignore protected           │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 System Workflow

### Fan Journey

```
Fan Arrives at Stadium
        │
        ▼
   Opens SmartArena
        │
        ├──── Asks AI Chat ──────► ArenaMind (Gemini AI)
        │         │                      │
        │         │              ┌───────┴────────┐
        │         │              │ Real Gemini API │
        │         │              │ OR Simulator   │
        │         │              └───────┬────────┘
        │         ◄──────────── Response in fan's language
        │
        ├──── Needs Routing ────► Wayfinder
        │         │                  │
        │         │           AI generates path
        │         │                  │
        │         ◄──── SVG Map highlights route + step-by-step directions
        │
        ├──── Checks Transit ───► Carbon Estimator
        │                             │
        │                     Calculates CO₂ offset
        │                         vs car baseline
        │
        └──── Needs Accessibility ──► A11y Mode ON
                                          │
                                  Elevator-first routing
                                  TTS voice output
```

### Staff Operations Workflow

```
Incident Detected
        │
        ▼
Staff Opens Operations Command
        │
        ├──── Types raw incident text
        │         │
        │         ▼
        │    Gemini AI parses:
        │    • Category (Medical/Safety/Crowd...)
        │    • Priority (Critical/High/Medium/Low)
        │    • Location extraction
        │    • Remediation steps generation
        │         │
        │         ▼
        │    Incident added to Dispatch Queue
        │
        ├──── Crowd Monitor detects HIGH density
        │         │
        │         ▼
        │    AI Advice: "Redirect Section 112 fans to Gate D"
        │
        ├──── Emergency detected
        │         │
        │         ▼
        │    Hamburger Menu → STOP DISPATCH
        │         │
        │         ▼
        │    🚨 Emergency Banner activates
        │    All dispatch inputs FROZEN
        │
        └──── Eco-Bin overflow alert
                  │
                  ▼
             Dispatch Eco-Brigade crew
```

### Emergency Stop Dispatch Flow

```
                    ┌──────────────────┐
                    │  Normal Operation │
                    └────────┬─────────┘
                             │
                    Staff triggers STOP DISPATCH
                             │
                    ┌────────▼─────────┐
                    │  Emergency Mode  │
                    │  ─────────────── │
                    │  • Red banner    │
                    │  • Inputs locked │
                    │  • Queue frozen  │
                    └────────┬─────────┘
                             │
                    Staff clicks DEACTIVATE
                             │
                    ┌────────▼─────────┐
                    │  Normal Operation │
                    └──────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + TypeScript | Component architecture, type safety |
| **Build** | Vite 5 | Fast HMR dev server, env variable injection |
| **Styling** | Vanilla CSS + CSS Variables | Glassmorphism, FIFA dark navy/gold theme |
| **AI Engine** | Google Gemini 1.5 Flash | Chat, incident parsing, wayfinding |
| **Icons** | Lucide React | Consistent icon set |
| **Animation** | canvas-confetti | Incident resolve celebrations |
| **Testing** | Vitest + Testing Library | Unit + integration tests |
| **Type Check** | TypeScript strict mode | Zero-error guarantee |
| **Linting** | ESLint | Code quality enforcement |
| **Version Control** | Git + GitHub | Source management |

### Design System
- 🎨 **Dark Navy/Gold** color palette (FIFA brand-aligned)
- 💎 **Glassmorphism** panels with backdrop blur
- ✨ **Micro-animations**: fade-in, glow-pulse, slide-in drawer
- ♿ **WCAG 2.1 AA** compliant — high contrast mode, TTS, keyboard nav

---

## 📁 Project Structure

```
fifa26-smartarena/
├── .env                          # 🔐 API key (NOT committed)
├── .gitignore                    # Excludes .env & node_modules
├── index.html                    # App entry point
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript config (strict mode)
├── vite.config.ts                # Vite build config
│
└── src/
    ├── main.tsx                  # React DOM root
    ├── App.tsx                   # Root component, state management
    │
    ├── components/
    │   ├── StadiumMap.tsx        # Interactive SVG venue map
    │   ├── FanCompanion.tsx      # Fan Portal (chat, wayfinder, carbon)
    │   ├── StaffDashboard.tsx    # Operations Command (incidents, crowd)
    │   └── SettingsPanel.tsx     # Accessibility & display toggles
    │
    ├── services/
    │   └── geminiService.ts      # Gemini AI client + offline simulator
    │
    ├── styles/
    │   ├── global.css            # Layout, components, animations
    │   └── variables.css         # CSS design tokens
    │
    └── test/
        └── smartarena.test.tsx  # 6 integration + unit tests
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- A Gemini API key (optional — offline simulator works without it)

### Installation

```bash
# Clone the repository
git clone https://github.com/UdayKumbhar532/FIFA-26-SmartArena.git

# Navigate to project
cd FIFA-26-SmartArena

# Install dependencies
npm install
```

### Configure AI (Optional)

```bash
# Copy the environment template
cp .env.example .env

# Add your Gemini API key (starts with AIza...)
# Edit .env:
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

> **Without a key**: The app runs in Offline Simulator mode — all features work with a high-fidelity rule-based AI engine.

### Run Locally

```bash
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🔐 Security Model

The API key is **completely invisible to end users**:

```
Developer              Build System           End User
    │                       │                    │
    │  VITE_GEMINI_API_KEY  │                    │
    │─────────────────────►│                    │
    │  (.env file)          │  Baked into bundle │
    │                       │──────────────────► │
    │                       │  (key NOT in UI)   │
    │                       │                    │
    │  .gitignore blocks    │  SettingsPanel     │
    │  .env from commits    │  has NO key input  │
```

- ✅ Key lives only in `.env` (excluded from git)
- ✅ Injected at **build time** by Vite as `import.meta.env.VITE_GEMINI_API_KEY`
- ✅ **Zero UI exposure** — Settings page has no key field
- ✅ Graceful fallback to offline simulator if key is missing/invalid

---

## ♿ Accessibility

Meets **WCAG 2.1 Level AA** standards:

| Feature | Implementation |
|---|---|
| **Keyboard Navigation** | All interactive elements reachable via Tab |
| **Escape to Close** | Drawer/modal dismiss via Escape key |
| **Focus Management** | Focus trapped in drawer when open |
| **Screen Reader** | `aria-label`, `aria-pressed`, `aria-expanded`, `role` attributes |
| **Text-to-Speech** | Web Speech API for AI responses |
| **High Contrast** | CSS `data-theme="high-contrast"` toggle |
| **Accessible Routing** | Elevator/ramp-preferred paths in wayfinder |
| **Alert Regions** | Emergency banner uses `role="alert"` + `aria-live="assertive"` |

---

## 🧪 Testing

```bash
# Run all tests
npm test -- --run

# Watch mode (development)
npm test

# Type checking
npx tsc --noEmit
```

### Test Coverage

| Test Suite | Tests | Status |
|---|---|---|
| Safety incident classification | 2 | ✅ Pass |
| Medical emergency parsing | 1 | ✅ Pass |
| Accessibility routing | 1 | ✅ Pass |
| Multilingual AI responses | 1 | ✅ Pass |
| Carbon offset calculation UI | 1 | ✅ Pass |
| **Total** | **6** | **✅ All Pass** |

---

## 🌱 Sustainability Features

- **Carbon Estimator**: Calculates CO₂ offset vs single-occupancy car baseline
  - Metro: 35g CO₂/km (84% less than baseline)
  - Bus: 100g CO₂/km (55% less)
  - Rideshare: 170g CO₂/km (23% less)
  - Walking/Bike: 0g CO₂/km (100% offset)
- **Eco-Brigade Monitor**: Real-time waste bin fill tracking at Gates A & C
- **AI Overflow Alerts**: Warns when bins exceed 80% capacity

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- **Google Gemini** — Generative AI backbone
- **FIFA** — World Cup 2026 inspiration
- **React & Vite teams** — Framework excellence
- **Lucide Icons** — Beautiful icon library

---

<div align="center">

**Built for the FIFA Smart Stadium Challenge 4**  
*Enhancing the World Cup 2026 experience through Generative AI*

⚽ **FIFA 26 SmartArena** · Powered by Google Gemini AI

</div>
