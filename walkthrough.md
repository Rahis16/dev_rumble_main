# MalangCode Prototype Walkthrough

We have successfully built, integrated, and verified the first full-stack prototype of **MalangCode** (the AI-powered Project and Engineering Manager). The backend controller structures and SQLite/MongoDB schema components are linked to a premium Next.js dashboard UI.

## Components Implemented

### 1. Style System (`globals.css`)

- Custom colors, futuristic deep space navy theme (`#090d16`).
- CSS keyframe animations for voice waveform visualizer levels.
- Pulsating glow effect classes for active recording states.
- Animated dashed lines indicating active pipeline transitions.

### 2. Core Shell Layout (`DashboardShell.tsx` & `layout.tsx`)

- Left sidebar navigation panel displaying brand assets and active pages:
  - **Dashboard**: Central feedback loop and status metrics.
  - **Projects**: Registering project directories and triggering rescans.
  - **Conversations**: Historic meeting transcripts and audio playbacks.
  - **Memory Brain**: Side-by-side local `.nova` file editor and cloud DB decisions.
  - **Workflow**: Step-by-step SVG pipeline nodes.
  - **Settings**: System credentials and environment diagnostic metrics.
- Database, local memory, and selected project status widgets.

### 3. Audio & Voice Gateway Controller (`VoiceController.tsx`)

- Downsamples browser raw microphone input to **16kHz 16-bit PCM** mono.
- Streams base64-encoded audio chunks over WebSockets to `/api/live`.
- Dynamically schedules and plays back audio buffers received from the proxy.
- Implements fallback speech-to-speech utilizing browser `window.speechSynthesis`.

### 4. Interactive Pages

- **Dashboard (`page.tsx`)**: Displays compliance score, security grade, chat transcripts, voice visualizer, and subtask delegator hooks.
- **Projects Manager (`projects/page.tsx`)**: Integrates path validation and manual scanning.
- **Memory Browser (`memory/page.tsx`)**: Offers direct editing of files like `project.json` and logging new architectural decisions.
- **Workflow Pipeline (`workflow/page.tsx`)**: Interactive step visualizer mapping data routing.
- **Settings (`settings/page.tsx`)**: API key management and database purges.

---

## Verification & Testing

### 1. Backend Compilation

We ran type checks inside the backend workspace:

```bash
npx tsc --noEmit
```

**Result**: Clean compile, exit code `0`.

### 2. Frontend Compilation

We checked for React/Next.js/TypeScript errors inside the frontend workspace:

```bash
npx tsc --noEmit
```

**Result**: Clean compilation, exit code `0`.
