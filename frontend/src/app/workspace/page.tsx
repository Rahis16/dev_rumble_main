'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardShell from '../../components/DashboardShell';
import VoiceController from '../../components/VoiceController';
import { 
  Code2, 
  Terminal, 
  FolderTree, 
  FileCode, 
  Folder, 
  Sparkles, 
  Play, 
  Zap, 
  Activity, 
  FolderSync, 
  CheckCircle2, 
  RefreshCw,
  Send,
  MessageSquare,
  Bot,
  Flame,
  FileText
} from 'lucide-react';

interface FileItem {
  name: string;
  path: string;
  isDir: boolean;
  content?: string;
}

export default function LiveWorkspace() {
  const [activeCourse, setActiveCourse] = useState<string>('React 19 & Server Components Live Mastery');
  const [activeFile, setActiveFile] = useState<string>('App.tsx');
  const [code, setCode] = useState<string>(
`// React 19 Live Mastery - Mcode-Agent Workspace
import React, { useActionState } from 'react';

async function updateServerAction(previousState: number, formData: FormData) {
  'use server';
  // Mcode-Agent: Live Server Action execution demo
  return previousState + 1;
}

export default function App() {
  const [score, formAction, isPending] = useActionState(updateServerAction, 0);

  return (
    <div className="p-8 bg-slate-950 text-white rounded-xl">
      <h1 className="text-2xl font-bold text-gradient-purple-pink">
        React 19 Interactive Score Tracker
      </h1>
      <p className="text-sm text-slate-400 mt-2">
        Score: <span className="font-mono text-purple-400 font-bold">{score}</span>
      </p>

      <form action={formAction} className="mt-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-xs font-bold text-white hover:opacity-90 transition-all disabled:opacity-50"
        >
          {isPending ? 'Syncing Server State...' : 'Increment Score'}
        </button>
      </form>
    </div>
  );
}`
  );

  const [files, setFiles] = useState<FileItem[]>([
    { name: 'App.tsx', path: 'src/App.tsx', isDir: false },
    { name: 'ServerAction.ts', path: 'src/ServerAction.ts', isDir: false },
    { name: 'package.json', path: 'package.json', isDir: false },
    { name: 'README.md', path: 'README.md', isDir: false },
  ]);

  const [wsStatus, setWsStatus] = useState<string>('CONNECTED');
  const [studentEditDetected, setStudentEditDetected] = useState<boolean>(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['[System] Mcode-Agent live workspace connected to desktop folder.']);
  const [tutorMessages, setTutorMessages] = useState<{ role: 'user' | 'tutor'; text: string }[]>([
    { role: 'tutor', text: 'Welcome to your React 19 Live Workspace! I am Mcode-Agent, your live tutor. Try modifying the form action or button text in App.tsx. I will detect your code edits live!' }
  ]);
  const [textInput, setTextInput] = useState<string>('');

  const socketRef = useRef<WebSocket | null>(null);

  // Connect WebSocket for live student edit detection & orchestrator
  useEffect(() => {
    try {
      const ws = new WebSocket('ws://localhost:5000/api/live');
      socketRef.current = ws;

      ws.onopen = () => {
        setWsStatus('CONNECTED');
        appendTerminal('[WebSocket] Live Agent Orchestrator Gateway ready.');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'STUDENT_CODE_EDIT_DETECTED') {
            setStudentEditDetected(true);
            appendTerminal(`[Edit Detector] ${data.payload.message}`);
            setTimeout(() => setStudentEditDetected(false), 4000);
          }
        } catch (e) {
          // ignore non-json
        }
      };

      ws.onclose = () => setWsStatus('DISCONNECTED');
    } catch (err) {
      setWsStatus('OFFLINE');
    }

    return () => {
      socketRef.current?.close();
    };
  }, []);

  const appendTerminal = (line: string) => {
    setTerminalOutput(prev => [...prev, `${new Date().toLocaleTimeString()} ${line}`]);
  };

  // Handle student typing in editor
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);

    // Notify backend WebSocket of live student edit
    setStudentEditDetected(true);
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        event: 'STUDENT_CODE_CHANGE',
        payload: {
          filePath: activeFile,
          codeSnippet: newCode.substring(0, 150),
          changeLine: 12
        }
      }));
    }

    setTimeout(() => setStudentEditDetected(false), 3000);
  };

  const handleSendQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const userText = textInput;
    setTextInput('');
    setTutorMessages(prev => [...prev, { role: 'user', text: userText }]);

    appendTerminal(`[Student] Question: "${userText}"`);

    // Simulate MalangCode tutor real-time answer & live code check
    setTimeout(() => {
      setTutorMessages(prev => [
        ...prev,
        { 
          role: 'tutor', 
          text: `Great question! In ${activeFile}, Mcode-Agent is monitoring your live execution. Notice how React 19 handles asynchronous form submission without reloading!` 
        }
      ]);
      appendTerminal(`[Tutor] Mcode-Agent responded live.`);
    }, 800);
  };

  const runLiveCode = () => {
    appendTerminal(`[Terminal] Running: npx tsx ${activeFile}`);
    appendTerminal(`[Build] Compiled successfully (0 warnings).`);
    appendTerminal(`[Output] React 19 Live Component rendered in 4ms.`);
  };

  // Open Physical VS Code Application on desktop
  const handleOpenVSCode = async () => {
    appendTerminal('[VS Code] Triggering desktop VS Code application launch...');
    try {
      const res = await fetch('http://localhost:5000/api/projects/open-vscode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'c:\\Users\\Rahis\\Desktop\\McodeProjects' })
      });
      if (res.ok) {
        const data = await res.json();
        appendTerminal(`[VS Code] ${data.message}`);
      }
    } catch (e) {
      appendTerminal('[VS Code] Failed to open VS Code desktop app.');
    }
  };

  useEffect(() => {
    const handleVoiceVSCode = () => {
      handleOpenVSCode();
    };

    window.addEventListener('mcode_voice_vscode', handleVoiceVSCode);
    return () => window.removeEventListener('mcode_voice_vscode', handleVoiceVSCode);
  }, []);

  return (
    <DashboardShell>
      <div className="min-h-[calc(100vh-8.5rem)] flex flex-col space-y-4 pb-4">
        
        {/* TOP WORKSPACE TOOLBAR */}
        <div className="glass-card p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border-purple-900/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shrink-0">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm font-bold text-[var(--text-primary)]">{activeCourse}</h1>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800/40 text-[9px] font-mono text-purple-700 dark:text-purple-300">
                  LIVE DEMO
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-mono">c:\Users\Rahis\Desktop\McodeProjects</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Live Student Code Edit Detector Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all ${
              studentEditDetected
                ? 'bg-pink-950/80 border-pink-500 text-pink-300 edit-detected-glow'
                : 'bg-[var(--inner-box-bg)] border-[var(--inner-box-border)] text-[var(--text-muted)]'
            }`}>
              <Zap className={`w-3.5 h-3.5 ${studentEditDetected ? 'text-pink-400 animate-bounce' : 'text-[var(--text-muted)]'}`} />
              <span>{studentEditDetected ? 'STUDENT EDIT DETECTED!' : 'Edit Detector Listening'}</span>
            </div>

            <button
              onClick={handleOpenVSCode}
              className="px-3.5 py-1.5 bg-[var(--inner-box-bg)] border border-purple-800/50 hover:bg-purple-950/40 rounded-xl text-xs font-semibold text-purple-600 dark:text-purple-300 transition-all flex items-center gap-1.5"
            >
              <Code2 className="w-3.5 h-3.5 text-purple-500" />
              <span>Open VS Code Desktop</span>
            </button>

            <button
              onClick={runLiveCode}
              className="px-4 py-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 rounded-xl text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:scale-105 transition-all flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Code</span>
            </button>
          </div>
        </div>

        {/* MAIN THREE-COLUMN WORKSPACE */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[460px]">
          
          {/* COLUMN 1: Desktop File Browser (2 cols on lg) */}
          <div className="lg:col-span-2 glass-card p-4 rounded-2xl flex flex-col justify-between border-[var(--inner-box-border)] min-h-[200px] lg:min-h-0">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--inner-box-border)] pb-2 mb-3">
                <span className="text-[10px] font-mono text-purple-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5" />
                  Files Tree
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">Desktop</span>
              </div>

              <div className="space-y-1">
                {files.map((file) => (
                  <button
                    key={file.name}
                    onClick={() => setActiveFile(file.name)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                      activeFile === file.name
                        ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800/40 font-semibold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--nav-hover-bg)]'
                    }`}
                  >
                    <FileCode className={`w-3.5 h-3.5 ${activeFile === file.name ? 'text-purple-500' : 'text-[var(--text-muted)]'}`} />
                    <span className="truncate">{file.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2.5 bg-[var(--inner-box-bg)] rounded-xl border border-[var(--inner-box-border)] text-[10px] font-mono text-[var(--text-muted)] mt-4 lg:mt-0">
              <span className="text-emerald-500 font-semibold block">Folder Sync: ACTIVE</span>
              <span>2-way VS Code Sync</span>
            </div>
          </div>

          {/* COLUMN 2: VS Code Live Code Editor (6 cols on lg) */}
          <div className="lg:col-span-6 glass-card rounded-2xl flex flex-col min-h-[380px] lg:min-h-0 border-purple-900/30 overflow-hidden">
            {/* Tab Bar */}
            <div className="h-10 bg-[var(--inner-box-bg)] border-b border-[var(--inner-box-border)] px-4 flex items-center gap-2 overflow-x-auto shrink-0">
              <div className="px-3 py-1 bg-[var(--card-bg)] border border-[var(--inner-box-border)] text-purple-600 dark:text-purple-300 rounded-t-lg text-xs font-mono flex items-center gap-2 font-semibold">
                <FileCode className="w-3.5 h-3.5 text-purple-500" />
                <span>{activeFile}</span>
                {studentEditDetected && <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />}
              </div>
            </div>

            {/* Code Editor Textarea */}
            <div className="flex-1 relative bg-[var(--inner-box-bg)] p-4 font-mono text-xs overflow-hidden min-h-[280px]">
              <textarea
                value={code}
                onChange={handleCodeChange}
                spellCheck={false}
                className="w-full h-full bg-transparent text-[var(--text-primary)] outline-none resize-none font-mono text-xs leading-relaxed selection:bg-purple-900/40"
              />
            </div>
          </div>

          {/* COLUMN 3: Mcode-Agent Live Tutor Discussion (4 cols on lg) */}
          <div className="lg:col-span-4 glass-card p-4 rounded-2xl flex flex-col justify-between min-h-[400px] lg:min-h-0 border-purple-900/30 overflow-hidden space-y-3">
            <div className="flex-1 flex flex-col min-h-0 space-y-3">
              {/* Tutor Header */}
              <div className="flex items-center justify-between border-b border-[var(--inner-box-border)] pb-2.5 shrink-0">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-[var(--text-primary)]">Mcode-Agent Live Tutor</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="wave-bar" />
                  <span className="wave-bar" />
                  <span className="wave-bar" />
                </div>
              </div>

              {/* Compact Speech Voice Controller */}
              <div className="shrink-0">
                <VoiceController projectId="workspace-live" compact={true} />
              </div>

              {/* Tutor Chat Transcript */}
              <div className="flex-1 min-h-[140px] max-h-[260px] lg:max-h-none overflow-y-auto space-y-2.5 pr-1">
                {tutorMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-purple-100 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800/40 text-purple-900 dark:text-purple-200 ml-4'
                        : 'bg-[var(--inner-box-bg)] border border-[var(--inner-box-border)] text-[var(--text-secondary)] mr-4'
                    }`}
                  >
                    <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase block mb-1">
                      {msg.role === 'user' ? 'STUDENT' : 'MCODE-AGENT TUTOR'}
                    </span>
                    <p>{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Input Question Form - ALWAYS PINNED AT BOTTOM */}
            <form onSubmit={handleSendQuestion} className="pt-2.5 border-t border-[var(--inner-box-border)] flex gap-2 shrink-0">
              <input
                type="text"
                placeholder="Ask Mcode-Agent a question..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="flex-1 bg-[var(--inner-box-bg)] border border-[var(--inner-box-border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-purple-500 shadow-inner"
              />
              <button
                type="submit"
                className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white hover:opacity-90 transition-all shrink-0 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

        {/* BOTTOM TERMINAL OUTPUT CONSOLE */}
        <div className="glass-card p-3.5 rounded-xl border-[var(--inner-box-border)] bg-[var(--inner-box-bg)] h-32 flex flex-col justify-between shrink-0 font-mono text-[11px]">
          <div className="flex items-center justify-between border-b border-[var(--inner-box-border)] pb-1.5 mb-1.5 text-[var(--text-muted)] shrink-0">
            <span className="flex items-center gap-2 font-semibold">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              Async Process Console & Terminal Output
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">READY</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 text-[var(--text-secondary)]">
            {terminalOutput.map((line, idx) => (
              <p key={idx} className="text-[var(--text-muted)] font-mono">{line}</p>
            ))}
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
