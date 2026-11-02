# Full-Stack Server-Side Gemini Upgrade for My Compass (بوصلتي)

Upgrade **بوصلتي (My Compass)** to our recommended full-stack architecture by moving all Gemini AI career analysis and smart counselor requests from the browser to a dedicated backend server, ensuring the application works seamlessly for every student and visitor while keeping the interface and user experience completely unchanged.

### User Review & Critical Decisions

> [!NOTE]
> All product behavior, Arabic RTL visual design, assessment scoring, counselor responses, and PDF report export remain identical—no visual or workflow changes will be introduced.

- **Preserved User Experience**: The 30-question Holland (RIASEC) assessment, personalized Arabic career report, interactive AI career counselor (including browser voice input), and printable A4 PDF export continue working identically.
- **Full-Stack Server Architecture**: A lightweight Express server will host both the frontend application and dedicated backend Gemini API endpoints on a single unified port so every visitor can use the AI features out of the box.
- **Model Selection**: Uses `gemini-3.8-flash` via the latest official Google GenAI SDK on the server for fast, high-quality Arabic career analysis and interactive Q&A.

### 1. Overview & Core Concept

- **What It Does**: Moves the two core AI capabilities of **بوصلتي**—generating the structured 4-part initial career identity analysis and answering follow-up student questions in the interactive counselor chat—onto a Node.js backend service.
- **Target Audience / Persona**: 11th-grade students and academic counselors at Ahmad Al-Lawzi Secondary School for Boys exploring academic tracks and Jordanian labor-market pathways.
- **Key Value**: Every student who opens the shared application link gets immediate, reliable access to personalized AI career reports and interactive guidance without any client-side setup.

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Student Onboarding & RIASEC Assessment**: Students enter their name, review instructions, and complete the 30-item 5-point scale assessment across Realistic, Investigative, Artistic, Social, Enterprising, and Conventional dimensions.
  2. **Automated Career Identity Report**: Upon completing the last question, the frontend sends the calculated RIASEC scores to the backend analysis endpoint and renders the 4-section Arabic report (*هويتك المهنية*, *نقاط القوة الاستراتيجية*, *بيئات الإبداع المثالية*, *تخصصات المستقبل المقترحة*) alongside the radar chart.
  3. **Smart Career Counselor Chat**: Students type or dictate questions (using browser speech recognition) and receive tailored responses grounded in their RIASEC profile and modern Jordanian career sectors from the backend guidance endpoint.
  4. **PDF Export & Print**: Students export or print their complete personalized report, scores, and counselor conversation in A4 Arabic RTL format.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Refined academic editorial Arabic RTL interface—retained 100% intact.
  - *Color Palette & Mood*: Crisp light surfaces (`--background` slate/white tones) paired with deep royal indigo/blue primary accents (`--primary`) and emerald/amber score highlights.
  - *Typography & Hierarchy*: Clean Arabic typography (`Cairo` / `Tajawal`) with structured section headers, readable card hierarchy, and print-calibrated A4 report typography.
  - *Component Styling & Layout*: Existing Tailwind CSS responsive card layouts, interactive RIASEC radar visualization, chat interface, and off-screen high-resolution PDF capture template remain untouched.
- **Interactive Feedback & Motion**: Existing loading indicators during report generation, typing states in the counselor chat, and graceful Arabic fallback messages on network errors are preserved seamlessly.

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Unified Express + Vite Full-Stack Server**
  - *Chosen Approach*: Run an Express server on port 3000 that handles `/api/gemini/*` endpoints first, mounts Vite middleware during development, and serves compiled static assets in production.
  - *Why*: Eliminates cross-origin (CORS) complexity, works identically in preview and production deployments, and keeps client requests fast and reliable.
  - *Alternatives Considered*: Separate standalone API server on a second port, which adds proxy configuration overhead and deployment friction.
- **Decision 2: Server-Owned Prompt Construction & Validation**
  - *Chosen Approach*: Send structured inputs (`scores` and `userInput`) from the browser to dedicated JSON endpoints while keeping the system instructions, Arabic formatting templates, and Gemini SDK initialization strictly on the server.
  - *Why*: Keeps frontend service calls lightweight, validates incoming score payloads cleanly, and preserves the exact return strings and Arabic error fallbacks expected by the UI.
  - *Alternatives Considered*: Generic pass-through prompt endpoint, which duplicates prompt templates in client bundles unnecessarily.

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Browser Client (Arabic RTL SPA)                  │
│                                                                         │
│  ┌──────────────────────┐   ┌──────────────────────┐   ┌─────────────┐  │
│  │  RIASEC Assessment   │──▶│  Results Dashboard   │──▶│ PDF / Print │  │
│  │  (30-Item Wizard)    │   │  & Radar Chart       │   │ Exporter    │  │
│  └──────────────────────┘   └──────────┬───────────┘   └─────────────┘  │
│                                        │                                │
│                             ┌──────────▼───────────┐                    │
│                             │  Smart Counselor UI  │                    │
│                             │  (Text + Web Speech) │                    │
│                             └──────────┬───────────┘                    │
│                                        │                                │
│                             ┌──────────▼───────────┐                    │
│                             │ Client API Connector │                    │
│                             │ (Fetch JSON Client)  │                    │
│                             └──────────┬───────────┘                    │
└────────────────────────────────────────┼────────────────────────────────┘
                                         │ HTTP POST (/api/gemini/*)
                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Node.js / Express Full-Stack Server                 │
│                                                                         │
│  ┌─────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │ POST /api/gemini/initial-       │  │ POST /api/gemini/career-     │  │
│  │      analysis                   │  │      guidance                │  │
│  │ • Validates 6 RIASEC scores     │  │ • Validates scores + query   │  │
│  │ • Builds 4-part Arabic prompt   │  │ • Applies counselor persona  │  │
│  └────────────────┬────────────────┘  └──────────────┬───────────────┘  │
│                   └────────────────┬─────────────────┘                  │
│                                    ▼                                    │
│                   ┌──────────────────────────────────┐                  │
│                   │  Shared GoogleGenAI SDK Client   │                  │
│                   │  • Server-side API Key           │                  │
│                   │  • User-Agent: aistudio-build    │                  │
│                   │  • Model: gemini-3.8-flash       │                  │
│                   └────────────────┬─────────────────┘                  │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │ HTTPS
                                     ▼
                         ┌────────────────────────┐
                         │   Google Gemini API    │
                         └────────────────────────┘
```

- **Data Model & State**:
  - `RIASECScores`: Numeric score object (`R`, `I`, `A`, `S`, `E`, `C`, each `0–25`) computed in React state upon quiz completion and passed in request bodies to the server endpoints.
  - `ChatMessage`: Conversation array (`role: 'user' | 'ai'`, `text: string`) maintained in client state for both live display and PDF report rendering.
  - No Gemini SDK imports or environment key definitions exist anywhere in client-side code or frontend build configuration.
- **Interactive Component & State Mapping**:
  - **Assessment Completion Flow**: Submitting the final assessment item sets the analysis loading spinner, posts `{ scores }` to `/api/gemini/initial-analysis`, stores the returned markdown analysis in state, and transitions cleanly to the results view.
  - **Counselor Q&A Flow**: Submitting text or dictated speech appends the student's message immediately, sets the typing indicator, posts `{ scores, userInput }` to `/api/gemini/career-guidance`, and appends the counselor's response (or localized Arabic fallback message if an upstream error occurs).
  - **Error Propagation**: Server endpoints validate input payloads (`400`) and propagate upstream Gemini errors (`500` / status code with error details) so the client connector can log diagnostics and return the exact Arabic user-friendly fallback strings already used by the interface.
