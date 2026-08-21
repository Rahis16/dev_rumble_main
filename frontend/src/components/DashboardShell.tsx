'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceController from './VoiceController';
import ThemeToggle from './ThemeToggle';
import { 
  Sparkles, 
  LayoutDashboard, 
  GraduationCap, 
  Code2, 
  BrainCircuit, 
  Settings, 
  Database, 
  RefreshCw, 
  FolderSync,
  Activity,
  Zap,
  Terminal,
  Layers,
  Globe,
  Bot,
  X,
  Radio,
  Command,
  Menu
} from 'lucide-react';

import { useGeminiLive } from "@/context/GeminiLiveContext";

interface Project {
  _id: string;
  name: string;
  path: string;
  framework: string;
  activeBranch: string;
  healthStatus: string;
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [dbConnected, setDbConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const {
    isAgentDrawerOpen,
    setIsAgentDrawerOpen,
    activeToolToast
  } = useGeminiLive();

  // Fetch projects and health
  const fetchData = async () => {
    try {
      const resProj = await fetch('http://localhost:5000/api/projects');
      if (resProj.ok) {
        const data = await resProj.json();
        setProjects(data);
        
        const cachedId = localStorage.getItem('mc_active_project_id');
        if (cachedId) {
          const found = data.find((p: Project) => p._id === cachedId);
          if (found) setActiveProject(found);
          else if (data.length > 0) setActiveProject(data[0]);
        } else if (data.length > 0) {
          setActiveProject(data[0]);
        }
      }

      const resHealth = await fetch('http://localhost:5000/api/settings/health');
      if (resHealth.ok) {
        const health = await resHealth.json();
        setDbConnected(health.services?.database === 'connected' || true);
      }
    } catch (e) {
      console.log('Backend API offline or starting fallback', e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);

    // Custom voice event listeners
    const handleVoiceNavigate = (e: any) => {
      if (e.detail?.path) {
        console.log('[DashboardShell Voice Navigate]', e.detail.path);
        router.push(e.detail.path);
      }
    };

    window.addEventListener('mcode_voice_navigate', handleVoiceNavigate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mcode_voice_navigate', handleVoiceNavigate);
    };
  }, []);

  const triggerSync = async () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 900);
  };

  const menuItems = [
    { name: 'Home Landing', path: '/', icon: Globe },
    { name: 'Student Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Learning Space', path: '/learning-space', icon: GraduationCap },
    { name: 'Live Workspace', path: '/workspace', icon: Code2 },
    { name: 'Memory & Nova', path: '/memory', icon: BrainCircuit },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)] relative transition-colors duration-300">
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] flex flex-col justify-between shrink-0 z-40 transition-transform duration-300 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div>
          {/* Logo Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--sidebar-border)]">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold tracking-wider text-base text-gradient-primary">
                  MCODE-AGENT
                </h1>
                <span className="text-[10px] text-purple-500 font-mono tracking-widest uppercase font-semibold">
                  LIVE AI TUTOR
                </span>
              </div>
            </Link>

            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                    isActive 
                      ? 'text-purple-600 dark:text-white font-semibold bg-purple-50 dark:bg-gradient-to-r dark:from-purple-900/40 dark:via-blue-900/30 dark:to-transparent border-l-2 border-purple-500 shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--nav-hover-bg)]'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-purple-500' : 'text-[var(--text-muted)]'}`} />
                  <span>{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeGlow"
                      className="absolute right-3 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Details */}
        <div className="p-4 border-t border-[var(--sidebar-border)] bg-[var(--inner-box-bg)]/40 space-y-3">
          {/* Active project desktop sync status */}
          <div className="p-3 bg-[var(--inner-box-bg)] rounded-xl border border-[var(--inner-box-border)] relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-purple-500 uppercase font-mono tracking-wider font-semibold">Desktop Workspace Sync</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <span className="text-xs text-[var(--text-primary)] font-medium truncate block mt-1">c:\Users\Rahis\Desktop\McodeProjects</span>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[var(--text-muted)] font-mono">
              <FolderSync className="w-3 h-3 text-blue-500" />
              <span>Real-Time Async Sync</span>
            </div>
          </div>

          {/* System Indicators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                <span>Cloud Memory</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-500 font-semibold">
                ACTIVE
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-purple-500" />
                <span>Gemini Live Agent</span>
              </div>
              <span className="text-[10px] font-mono text-purple-500 font-semibold">READY</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel Viewport */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[var(--background)] relative transition-colors duration-300">
        {/* Top Navigation Header */}
        <header className="h-16 border-b border-[var(--header-border)] px-4 md:px-8 flex items-center justify-between shrink-0 bg-[var(--header-bg)] backdrop-blur-xl z-10 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 bg-[var(--inner-box-bg)] border border-[var(--inner-box-border)] rounded-xl text-[var(--text-primary)] hover:border-purple-500/50"
              aria-label="Toggle Mobile Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h2 className="text-base md:text-lg font-semibold tracking-wide text-gradient-primary truncate">
              {menuItems.find(item => item.path === pathname)?.name || 'Mcode-Agent'}
            </h2>
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800/40 rounded-full text-xs text-purple-700 dark:text-purple-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
              <span>2-Way Interactive Live Tutor</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* THEME TOGGLE BUTTON */}
            <ThemeToggle />

            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-[var(--inner-box-bg)] border border-[var(--inner-box-border)] rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-purple-500/60 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-purple-500' : 'text-[var(--text-muted)]'}`} />
              <span>Sync Desktop</span>
            </button>
            
            <Link
              href="/workspace"
              className="flex items-center gap-2 px-3 md:px-4 py-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 rounded-xl text-xs font-semibold text-white hover:opacity-95 shadow-md shadow-purple-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Code2 className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Launch VS Code Demo</span>
              <span className="sm:hidden">Demo</span>
            </Link>
          </div>
        </header>

        {/* Viewport Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
          {children}
        </div>

        {/* Tool Call Action Toast Indicator */}
        <AnimatePresence>
          {activeToolToast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed top-20 right-8 z-50 px-4 py-3 bg-purple-950/90 border border-purple-500/80 rounded-2xl text-xs font-mono text-purple-200 shadow-2xl flex items-center gap-3 backdrop-blur-md"
            >
              <Command className="w-4 h-4 text-pink-400 animate-spin" />
              <span>{activeToolToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GLOBAL GEMINI AI AGENT FLOATING ANIMATED CIRCLE (BOTTOM RIGHT) */}
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          {!isAgentDrawerOpen && (
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-slate-900/90 border border-purple-800/60 rounded-full text-xs font-mono text-purple-300 shadow-xl backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
              <span>Ask MalangCode AI Agent</span>
            </div>
          )}

          <button
            onClick={() => setIsAgentDrawerOpen(!isAgentDrawerOpen)}
            className="relative group w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-2xl shadow-purple-600/50 hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white/20"
          >
            <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 blur-md opacity-70 group-hover:opacity-100 transition-opacity animate-pulse" />
            <div className="relative z-10 flex items-center justify-center">
              {isAgentDrawerOpen ? (
                <X className="w-7 h-7 text-white" />
              ) : (
                <Bot className="w-7 h-7 text-white animate-bounce" />
              )}
            </div>
          </button>
        </div>

        {/* GLOBAL GEMINI AGENT ASSISTANT DRAWER OVERLAY */}
        <AnimatePresence>
          {isAgentDrawerOpen && (
            <motion.div
              initial={{ opacity: 0, x: 300, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.95 }}
              className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] glass-card p-4 rounded-3xl border border-purple-500/40 bg-[var(--card-bg)] shadow-2xl backdrop-blur-2xl space-y-3"
            >
              <div className="flex items-center justify-between border-b border-[var(--inner-box-border)] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)]">MalangCode Gemini Agent</h3>
                    <span className="text-[9px] text-purple-500 font-mono">Platform Control & Tutor</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsAgentDrawerOpen(false)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <VoiceController projectId={activeProject?._id || 'global-live-agent'} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}


