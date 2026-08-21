'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import DashboardShell from '../components/DashboardShell';
import { 
  Sparkles, 
  Code2, 
  Terminal, 
  GraduationCap, 
  Zap, 
  FolderSync, 
  CheckCircle2, 
  Play, 
  Bot, 
  ArrowRight,
  MessageSquare,
  Activity,
  Layers,
  Cpu
} from 'lucide-react';

export default function LandingPage() {
  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto space-y-16 py-4">
        
        {/* HERO SECTION */}
        <section className="relative text-center py-12 space-y-6 overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-500/20 blur-3xl -z-10 rounded-full pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--header-bg)] border border-purple-800/50 text-purple-300 text-xs font-mono mb-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className='text-[var(--text-primary)]'>Introducing Mcode-Agent 2.0 • Live Interactive Code Tutor</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] max-w-4xl mx-auto leading-tight"
          >
            Stop Watching Videos. <br />
            <span className="text-gradient-purple-pink">Learn Code Live With Your AI Co-Developer.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-[var(--text-secondary)] text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Two-way interactive practical learning. Mcode-Agent controls VS Code, runs live terminal commands, detects your manual edits in real time, and discusses concepts line by line.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <Link
              href="/learning-space"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 font-semibold text-sm text-white shadow-lg shadow-purple-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Explore Courses</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/workspace"
              className="px-6 py-3.5 rounded-xl bg-[var(--inner-box-bg)] border border-[var(--inner-box-border)] font-semibold text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-purple-500/50 transition-all flex items-center gap-2"
            >
              <Code2 className="w-4 h-4 text-purple-400" />
              <span>Open Live VS Code Demo</span>
            </Link>
          </motion.div>
        </section>

        {/* LIVE DEMO PREVIEW CARD */}
        <motion.section
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="glass-card p-6 md:p-8 rounded-2xl relative overflow-hidden border-purple-900/40"
        >
          <div className="flex items-center justify-between border-b border-[var(--inner-box-border)] pb-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-3 text-xs font-mono text-[var(--text-muted)]">mcode-agent-live-workspace // App.tsx</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-950/60 border border-purple-800/50 rounded-lg text-[10px] font-mono text-purple-300">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Student Manual Edit Detector: ACTIVE</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Editor Code Preview */}
            <div className="bg-[var(--inner-box-bg)] p-4 rounded-xl border border-[var(--inner-box-border)] font-mono text-xs text-[var(--text-secondary)] space-y-2">
              <div className="flex items-center justify-between text-[var(--text-muted)] border-b border-[var(--inner-box-border)] pb-2">
                <span>React 19 Server Component Lesson</span>
                <span className="text-purple-400 font-semibold">Live Diff</span>
              </div>
              <p className="text-[var(--text-muted)]"><span className="text-pink-400">import</span> React, &#123; useActionState &#125; <span className="text-pink-400">from</span> <span className="text-emerald-400">&apos;react&apos;</span>;</p>
              <p className="text-[var(--text-muted)]"><span className="text-purple-400">export default function</span> <span className="text-blue-400">InteractiveCounter</span>() &#123;</p>
              <p className="pl-4 text-emerald-500 dark:text-emerald-300 bg-emerald-500/10 py-1 border-l-2 border-emerald-400">
                + <span className="text-[var(--text-muted)]">// Student added manual state handler</span>
              </p>
              <p className="pl-4 text-[var(--text-primary)]">const [state, formAction, isPending] = useActionState(updateScore, 0);</p>
              <p className="pl-4 text-[var(--text-primary)]"><span className="text-purple-400">return</span> (</p>
              <p className="pl-8 text-blue-400">&lt;<span className="text-pink-400">button</span> action=&#123;formAction&#125; disabled=&#123;isPending&#125;&gt;</p>
              <p className="pl-12 text-[var(--text-primary)]">Increment Score</p>
              <p className="pl-8 text-blue-400">&lt;/<span className="text-pink-400">button</span>&gt;</p>
              <p className="pl-4 text-[var(--text-primary)]">);</p>
              <p className="text-[var(--text-muted)]">&#125;</p>
            </div>

            {/* Live Tutor Discussion Panel */}
            <div className="glass-panel p-5 rounded-xl flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--inner-box-border)] pb-2">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-[var(--text-primary)]">Mcode-Agent Live Tutor</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="wave-bar" />
                    <span className="wave-bar" />
                    <span className="wave-bar" />
                    <span className="wave-bar" />
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg border border-purple-200 dark:border-purple-900/40 text-xs text-purple-800 dark:text-purple-200 leading-relaxed">
                  <p className="font-semibold text-purple-700 dark:text-purple-300 mb-1">💡 Live Feedback on your edit:</p>
                  &quot;Great job adding <code className="text-pink-600 dark:text-pink-300 font-mono">useActionState</code>! Notice how <code className="text-pink-600 dark:text-pink-300 font-mono">isPending</code> automatically handles loading UI without explicit <code className="text-pink-600 dark:text-pink-300 font-mono">useState</code> setters. Shall we run the live test server?&quot;
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] border-t border-[var(--inner-box-border)] pt-3">
                <span>Async Terminal Execution: ready</span>
                <span className="text-emerald-400 font-semibold">WS Async Connected</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* CORE FEATURES GRID */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
              Why Learn With <span className="text-gradient-purple-pink">Mcode-Agent</span>?
            </h2>
            <p className="text-[var(--text-secondary)] text-sm max-w-xl mx-auto">
              Built for practical mastery. Real two-way developer collaboration with live code execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              whileHover={{ y: -4 }}
              className="glass-card p-6 space-y-3 border-purple-900/30"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">2-Way Live Discussion</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                No boring pre-recorded videos. Discuss topics, clear doubts instantly, and interrupt whenever you want.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="glass-card p-6 space-y-3 border-blue-900/30"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Live VS Code Control</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Mcode-Agent creates files, writes clean code, runs terminal commands, and debugs errors alongside you.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="glass-card p-6 space-y-3 border-pink-900/30"
            >
              <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-950/60 border border-pink-300 dark:border-pink-800/40 flex items-center justify-center text-pink-600 dark:text-pink-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Student Edit Detector</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Whenever you modify code manually, the agent instantly detects the changes and assists you on the spot.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="glass-card p-6 space-y-3 border-violet-900/30"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/60 border border-violet-300 dark:border-violet-800/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <FolderSync className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Desktop Folder Sync master master Master</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Every course is saved as a root project folder directly on your local desktop machine for full ownership.
              </p>
            </motion.div>
          </div>
        </section>

        {/* FEATURED COURSES TEASER */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">Featured Practical Courses</h2>
              <p className="text-[var(--text-secondary)] text-xs mt-1">Enroll and sync directly to your desktop workspace.</p>
            </div>
            <Link
              href="/learning-space"
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-mono font-semibold flex items-center gap-1"
            >
              <span>View All Courses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-semibold">
                    REACT 19
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">24 Lessons • Live Workspace</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">React 19 & Server Components Live Mastery</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Learn useActionState, optimistic UI, Server Actions, and concurrent rendering through hands-on coding demos.
                </p>
              </div>
              <Link
                href="/learning-space"
                className="w-full py-2.5 rounded-xl bg-[var(--inner-box-bg)] border border-[var(--inner-box-border)] text-center text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              >
                Enroll & Launch Workspace
              </Link>
            </div>

            <div className="glass-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 text-[10px] font-mono font-semibold">
                    PYTHON AI AGENTS
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">28 Lessons • Live Workspace</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Python AI Agents & Autonomous Workflows</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Build multi-agent autonomous orchestrators, custom tool calling, and WebSocket audio streaming.
                </p>
              </div>
              <Link
                href="/learning-space"
                className="w-full py-2.5 rounded-xl bg-[var(--inner-box-bg)] border border-[var(--inner-box-border)] text-center text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              >
                Enroll & Launch Workspace
              </Link>
            </div>
          </div>
        </section>

      </div>
    </DashboardShell>
  );
}
