# MalangCode AI Engineering Manager – Full-Stack Prototype Implementation Plan

This plan details the design, architecture, and deployment strategy for MalangCode, an intelligent AI-powered Project and Engineering Manager. It communicates with the developer via voice, plans features, delegates code tasks, reviews work, and maintains local and cloud project memory.

---

## User Review Required

> [!IMPORTANT]
> **Gemini Live API Key**: To test the live audio/speech-to-speech loop, a Gemini API Key is required. The application will read this from a `.env` file in the backend. We will provide a clean setup to input this in the UI or configure it via `.env`.
>
> **Audio Processing**: Continuous voice streaming requires capturing 16kHz linear PCM in the frontend and streaming it over WebSockets. We will implement a custom Web Audio utility in the frontend to record and stream audio, and to play back streaming audio responses from Gemini.

---

## Open Questions

> [!NOTE]
>
> 1. **Default Project Path**: For testing MalangCode's `.nova` folder sync, should we create a default sandbox project inside the workspace, e.g. `c:\Users\Rahis\Desktop\mcode-agent\sandbox-project`, so you can see the `.nova/` directory structure created and synchronized in real-time?
> 2. **MongoDB Connection**: Do you have a local MongoDB instance running, or should we use a local MongoDB connection string (e.g. `mongodb://localhost:27017/malangcode`), with fallback to an in-memory/mock DB service if MongoDB is not running locally? (We will build a robust Mongoose connection that falls back gracefully or reports connection health in the UI dashboard).

---

## Proposed Changes

We will construct a monorepo-style layout inside the workspace:

- `backend/`: Express.js, TypeScript, Mongoose, WebSockets, Gemini Live API Proxy, Brains Services, `.nova` Sync.
- `frontend/`: Next.js (App Router), TypeScript, Tailwind CSS, Web Audio API streaming client.

---

### Component: Backend (`/backend`)

The backend will expose REST APIs and a WebSocket server to manage the real-time speech and project workflow.

#### [NEW] [package.json](file:///c:/Users/Rahis/Desktop/mcode-agent/backend/package.json)

- Define standard packages: `express`, `cors`, `dotenv`, `mongoose`, `ws`, `@google/generative-ai`.
- Define TypeScript developer dependencies and run scripts (`ts-node-dev`, `nodemon`, `typescript`).

#### [NEW] [tsconfig.json](file:///c:/Users/Rahis/Desktop/mcode-agent/backend/tsconfig.json)

- Configure strict TypeScript settings for the backend compilation.

#### [NEW] [src/config/db.ts](file:///c:/Users/Rahis/Desktop/mcode-agent/backend/src/config/db.ts)

- MongoDB connection config with error handling and fallback reporting.

#### [NEW] [src/models/Schemas.ts](file:///c:/Users/Rahis/Desktop/mcode-agent/backend/src/models/Schemas.ts)

- **ProjectSchema**: Path, active branch, framework, health status.
- **TaskSchema**: Title, status (pending, in_progress, completed), planning context, assigned agent.
- **ConversationSchema**: Message role (user/agent/system), content type (text/audio), transcription, timestamp.
- **DecisionSchema**: Title, content, rationale, impact, date.
- **AgentReportSchema**: Target task, changes made, tests validation, build validation, review comments.

#### [NEW] [src/services/ProjectBrain.ts](file:///c:/Users/Rahis/Desktop/mcode-agent/backend/src/services/ProjectBrain.ts)

- Detect frameworks, read folders, analyze directory tree, and check dependencies.

#### [NEW] [src/services/MemoryBrain.ts](file:///c:/Users/Rahis/Desktop/mcode-agent/backend/src/services/MemoryBrain.ts)

- Manage the double synchronization of `.nova/` directory files and MongoDB databases.
- Read/write `project.json`, `roadmap.md`, `tasks.json`, `decisions.json`, `context.json`, `session.json`.

#### [NEW] [src/services/PlanningBrain.ts](file:///c:/Users/Rahis/Desktop/mcode-agent/backend/src/services/PlanningBrain.ts)

- Generate subtasks, roadmap details, and dependency graphs based on user requests.

#### [NEW] [src/services/EngineeringBrain.ts](file:///c:/Users/Rahis/Desktop/mcode-agent/backend/src/services/EngineeringBrain.ts)

- Analyze design, SOLID principles, security, and scalability metrics (simulated/modeled).

#### [NEW] [src/services/AgentBrain.ts](file:///c:/Users/Rahis/Desktop/mcode-agent/backend/src/services/AgentBrain.ts)

- Simulate delegating coding tasks to external Ollama agents (mocked interface exposing execute methods).

#### [NEW] [src/services/ReviewBrain.ts](file:///c:/Users/Rahis/Desktop/mcode-agent/backend/src/services/ReviewBrain.ts)

- Simulate reviewing file changes, build validation, and testing results.

#### [NEW] [src/websocket/geminiLiveProxy.ts](file:///c:/Users/Rahis/Desktop/mcode-agent/backend/src/websocket/geminiLiveProxy.ts)

- WebSocket gateway to capture audio/text streams from the client, proxy them to the Gemini Live API (`wss://generativelanguage.googleapis.com/...`), customize the model (using `gemini-2.0-flash-exp` or similar), set voice settings (Female voice), and forward audio back.

#### [NEW] [src/prompts/systemPrompts.ts](file:///c:/Users/Rahis/Desktop/mcode-agent/backend/src/prompts/systemPrompts.ts)

- Modular system prompts for MalangCode's personality (calm, technical CTO, analytical).

#### [NEW] [src/app.ts](file:///c:/Users/Rahis/Desktop/mcode-agent/backend/src/app.ts) & [src/server.ts](file:///c:/Users/Rahis/Desktop/mcode-agent/backend/src/server.ts)

- Set up routes, mount WebSocket server, and initialize servers.

---

### Component: Frontend (`/frontend`)

A high-fidelity Next.js App Router project using Tailwind CSS.

#### [NEW] [frontend/package.json](file:///c:/Users/Rahis/Desktop/mcode-agent/frontend/package.json)

- Define standard Next.js, React, Tailwind, and icon (lucide-react) packages.

#### [NEW] [frontend/src/app/layout.tsx](file:///c:/Users/Rahis/Desktop/mcode-agent/frontend/src/app/layout.tsx)

- Root layout with font imports (Google Fonts: Outfit/Inter) and core shell styles.

#### [NEW] [frontend/src/app/page.tsx](file:///c:/Users/Rahis/Desktop/mcode-agent/frontend/src/app/page.tsx)

- Dashboard displaying: Active Project status, health, workflow state, memory status, and a real-time conversation and voice-input visualizer interface.

#### [NEW] [frontend/src/app/projects/page.tsx](file:///c:/Users/Rahis/Desktop/mcode-agent/frontend/src/app/projects/page.tsx)

- Projects manager: Add projects, select active projects, see local `.nova` synchronization logs.

#### [NEW] [frontend/src/app/conversations/page.tsx](file:///c:/Users/Rahis/Desktop/mcode-agent/frontend/src/app/conversations/page.tsx)

- Search historical audio transcripts, view dialog threads, and check decisions generated during meetings.

#### [NEW] [frontend/src/app/memory/page.tsx](file:///c:/Users/Rahis/Desktop/mcode-agent/frontend/src/app/memory/page.tsx)

- High-fidelity view of the memory brains. Interactive cards detailing local `.nova/decisions.json`, `context.json`, and cloud MongoDB records side-by-side.

#### [NEW] [frontend/src/app/workflow/page.tsx](file:///c:/Users/Rahis/Desktop/mcode-agent/frontend/src/app/workflow/page.tsx)

- Graphical canvas/pipeline representing the flow of tasks: Developer -> MalangCode -> Terminal -> Ollama Agent -> Review -> Audio Report.

#### [NEW] [frontend/src/app/settings/page.tsx](file:///c:/Users/Rahis/Desktop/mcode-agent/frontend/src/app/settings/page.tsx)

- Configure Gemini API Keys, select voices, toggle debug console logs, and manage local database reset.

#### [NEW] [frontend/src/components/VoiceController.tsx](file:///c:/Users/Rahis/Desktop/mcode-agent/frontend/src/components/VoiceController.tsx)

- Handles recording from mic (16kHz PCM downsampling), connecting to WebSocket, sending/receiving binary buffers, and playing them back using the Web Audio API.

---

## Verification Plan

### Automated Tests

- Running TypeScript compilation tests in both folders: `npm run build` or `npx tsc --noEmit`.
- Verifying Express API routes using `curl` or server diagnostics.

### Manual Verification

- Testing the UI dashboard using the browser tool.
- Verifying page-to-page navigation, beautiful layouts, and responsive state changes.
- Launching the app locally on port 3000 (Next.js) and 5000 (Express).
