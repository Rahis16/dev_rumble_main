# MalangCode Project Checklist

## Phase 1: Backend Architecture Setup

- [x] Initialize `backend/` directory structure and files
- [x] Configure `package.json`, TypeScript, and `tsconfig.json`
- [x] Set up Express application with MongoDB connection (`src/config/db.ts`)
- [x] Implement database models (`src/models/Schemas.ts`):
  - [x] Project Schema
  - [x] Task Schema
  - [x] Conversation Schema
  - [x] Decision Schema
  - [x] AgentReport Schema

## Phase 2: Core Brains and Services

- [x] Implement `ProjectBrain` (directory structure, framework detection)
- [x] Implement `MemoryBrain` (sync between local `.nova/` and MongoDB)
- [x] Implement `PlanningBrain` (generate roadmaps, tasks, dependencies)
- [x] Implement `EngineeringBrain` (architectural validation, code standards)
- [x] Implement `AgentBrain` (simulated agent orchestration)
- [x] Implement `ReviewBrain` (simulated task verification)
- [x] Set up system prompt module (`src/prompts/systemPrompts.ts`)

## Phase 3: WebSocket and Gemini Live Proxy

- [x] Create WebSocket gateway client handler (`src/websocket/geminiLiveProxy.ts`)
- [x] Set up session route for client tokens/configuration
- [x] Connect backend to Gemini Live API (`wss://generativelanguage.googleapis.com/...`)
- [x] Forward audio buffers and text signals between frontend and Gemini Live API

## Phase 4: Frontend Development

- [x] Initialize Next.js app in `frontend/` using Tailwind CSS
- [x] Build global layout with modern sidebar and engineering aesthetic
- [x] Build pages:
  - [x] Dashboard (Voice visualizer, workflow tracker, project health)
  - [x] Projects manager (add projects, choose active directory, view sync state)
  - [x] Conversations (historical playbacks, text transcript log)
  - [x] Memory (side-by-side view of local `.nova/` files vs MongoDB cloud memory)
  - [x] Workflow (visual representation of tasks progressing through agents)
  - [x] Settings (API Keys, model options, theme control)
- [x] Implement `VoiceController` (Web Audio API for microphone streaming and speaker playback)

## Phase 5: Verification & Walkthrough

- [x] Compile and verify backend and frontend projects
- [x] Test API endpoints and real-time proxy functionality
- [x] Document work and create the final `walkthrough.md`
