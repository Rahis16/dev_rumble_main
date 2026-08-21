# Mcode-Agent • Live Interactive AI Code Tutor & Autonomous Engineering Platform

![Mcode-Agent Platform](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)
![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Gemini Live API](https://img.shields.io/badge/Gemini-Multimodal_Live_API-8E44AD?style=for-the-badge&logo=google)
![Express](https://img.shields.io/badge/Express.js-Node.js-green?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)

> **Mcode-Agent** is an interactive, real-time AI coding tutor and autonomous engineering workspace. It fuses 2-way streaming voice interaction powered by Google's Gemini Multimodal Live API, OpenCode autonomous task execution, real-time desktop project filesystem synchronization, and practical course learning paths.

---

## 🌟 Key Features

### 🎙️ 1. Gemini Multimodal Live Voice Agent
- **2-Way Audio Streaming**: Real-time WebSocket audio streaming using raw PCM 16kHz audio input and speech output (`Aoede` voice).
- **Hands-Free Tool Execution**: The AI voice agent calls backend tools dynamically:
  - `navigatePage`: Hands-free navigation across dashboard, catalog, and workspace.
  - `searchCourses`: Real-time filtering and voice search context synchronization.
  - `checkCourseEnrollment` & `enrollCourse`: Auto-verifies student enrollment, initializes desktop starter templates, and switches workspace context.
  - `readWorkspaceFile` & `writeWorkspaceFile`: Reads and modifies real project source files directly on disk.
  - `switchActiveProject`: Switches voice agent context dynamically between registered projects.
  - `executeDirectTask`: Dispatches coding commands to the OpenCode autonomous agent.
  - `openVSCode`: Launches the physical VS Code desktop application on the student's machine.
- **Live Edit Detection**: Instantly detects student typing in the editor or VS Code and streams code change snippets to the voice agent.

### 💻 2. Real Desktop Sandbox Workspace (`/workspace`)
- **Real Filesystem Integration**: Scans real desktop directories (`c:\Users\Rahis\Desktop\McodeProjects\...`) and displays recursive tree structures (replacing static dummy data).
- **Interactive Project Switcher**: Top toolbar dropdown allowing manual switching between enrolled courses/projects with instant context synchronization.
- **Auto-Saving & Disk Sync**: Edits in the sandbox editor are debounced and written directly to disk.
- **Manual "Sync Workspace" Button**: Re-analyzes project dependencies, re-scans disk file trees, reloads source code, and synchronizes `.nova` memory.
- **Desktop VS Code Launcher**: One-click physical VS Code application launch.

### 🎓 3. Interactive Learning Space Catalog (`/learning-space`)
- Practical, hands-on course paths:
  - **React 19 & Server Components Live Mastery** (`react-19-mastery`)
  - **Next.js 15 App Router & API Architecture** (`nextjs-15-fullstack`)
  - **Python AI Agents & Autonomous Workflows** (`python-ai-agents`)
  - **Async TypeScript & Real-Time System Design** (`async-typescript`)
- Automatic enrollment checking, desktop folder creation, and starter source code generation (`App.tsx`, `ServerAction.ts`, `main.py`, `page.tsx`, `package.json`, `README.md`).

### 🤖 4. OpenCode Autonomous Task Engine
- **Direct Task & Feature Planning**: Dispatches tasks to OpenCode agents (`CoderAgent`, `ArchitectAgent`, `FrontendAgent`, `QA_Agent`).
- **SOLID Code Review Reports**: Performs automated code quality and architecture reviews upon task completion.
- **Live Workspace Auto-Reload**: When OpenCode finishes modifying project files on disk, the live workspace reloads automatically and the voice agent verbally summarizes the changes.

### 🎨 5. Theme Switcher & ElevenLabs Aesthetic
- Dual-theme system supporting **Dark Theme** and **ElevenLabs-style Light Theme**.
- Persistent `localStorage` state with global CSS design tokens, glassmorphism, ambient radial glows, and responsive mobile sidebar drawers.

---

## 🛠️ Technology Stack

| Layer | Technologies & Tools |
| :--- | :--- |
| **Frontend Framework** | Next.js 16.3 (Turbopack), React 19, TypeScript 5 |
| **Styling & UI** | Vanilla CSS Tokens, TailwindCSS, Framer Motion, Lucide Icons |
| **Audio Processing** | Web Audio API, ScriptProcessorNode, Float32 to Int16 PCM Encoder |
| **Backend Server** | Node.js, Express.js, TypeScript (`tsc`), WebSockets (`ws`) |
| **Database & Memory** | MongoDB, Mongoose, `.nova` Local FS Memory Brain |
| **AI & LLM Services** | Google Gemini Multimodal Live API (`models/gemini-3.1-flash-live-preview`) |
| **Autonomous Coding** | OpenCode CLI (`opencode`), Child Process Execution |

---

## 📋 Requirements & Prerequisites

Before running Mcode-Agent, ensure you have the following installed on your environment:

1. **Node.js**: `v18.0.0` or higher (Recommended: `v20.x`)
2. **Package Manager**: `npm` (v9+) or `yarn` / `pnpm`
3. **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017/malangcode`) OR MongoDB Atlas cluster URI.
4. **Google Gemini API Key**: A valid Google AI Studio key (`AIzaSy...`) with access to the Gemini Live WebSockets API.
5. **VS Code (Optional)**: VS Code CLI (`code`) added to PATH for desktop launcher functionality.

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Rahis16/dev_rumble_main.git
cd dev_rumble_main
```

### 2. Configure Backend Environment
Create a `.env` file inside the `backend/` directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/malangcode
GEMINI_API_KEY=your_google_gemini_api_key_here
NODE_ENV=development
```

### 3. Install Dependencies

#### Backend Setup
```bash
cd backend
npm install
```

#### Frontend Setup
```bash
cd ../frontend
npm install
```

---

## 💻 Running the Application

### 1. Start the Backend Server
From the `backend/` directory:
```bash
npm run dev
```
*The backend API will run on `http://localhost:5000` and the WebSocket orchestrator gateway on `ws://localhost:5000/api/live`.*

### 2. Start the Frontend Application
From the `frontend/` directory:
```bash
npm run dev
```
*Open `http://localhost:3000` in your web browser.*

---

## 📁 Directory Structure

```
dev_rumble_main/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Project, Task, Settings & Memory controllers
│   │   ├── models/          # Mongoose Schemas (Project, Task, AgentReport)
│   │   ├── prompts/         # Gemini Live System Prompts
│   │   ├── routes/          # Express API route declarations
│   │   ├── services/        # AgentBrain, ProjectBrain, MemoryBrain, PlanningBrain
│   │   └── websocket/       # Gemini Live WebSocket proxy & Tool handlers
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router (Dashboard, Workspace, Learning Space, etc.)
│   │   ├── components/      # VoiceController, DashboardShell, ThemeToggle, FileTree
│   │   ├── context/         # GeminiLiveContext & ThemeContext
│   │   └── styles/          # Design tokens & globals.css
│   ├── package.json
│   └── next.config.ts
└── README.md
```

---

## 📄 License

This project is open-source under the MIT License.
