'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import DashboardShell from '../../components/DashboardShell';
import VoiceController from '../../components/VoiceController';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Code2, 
  FolderSync, 
  Flame, 
  Clock, 
  CheckCircle2, 
  Play, 
  Activity, 
  Zap, 
  Bot, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

interface EnrolledCourse {
  id: string;
  title: string;
  category: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  desktopFolder: string;
}

export default function StudentDashboard() {
  const [courses, setCourses] = useState<EnrolledCourse[]>([
    {
      id: 'react-19-mastery',
      title: 'React 19 & Server Components Live Mastery',
      category: 'Frontend',
      progress: 65,
      completedLessons: 15,
      totalLessons: 24,
      desktopFolder: 'c:\\Users\\Rahis\\Desktop\\mcode-agent\\sandbox-project\\react-19-mastery'
    },
    {
      id: 'nextjs-15-fullstack',
      title: 'Next.js 15 App Router & API Architecture',
      category: 'Fullstack',
      progress: 30,
      completedLessons: 10,
      totalLessons: 32,
      desktopFolder: 'c:\\Users\\Rahis\\Desktop\\mcode-agent\\sandbox-project\\nextjs-15-fullstack'
    }
  ]);

  const [tutorLog, setTutorLog] = useState([
    {
      time: '10 mins ago',
      title: 'Student Code Edit Detected in App.tsx',
      detail: 'Added formAction handler to useActionState button. Tutor recommended optimistic UI feedback.'
    },
    {
      time: '2 hours ago',
      title: 'Terminal Test Execution Passed',
      detail: 'Mcode-Agent ran npx vitest. 4 unit tests passed in React 19 workspace.'
    }
  ]);

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto space-y-8 py-2">
        
        {/* WELCOME BANNER */}
        <div className="glass-card p-6 md:p-8 rounded-2xl relative overflow-hidden border-purple-900/40">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-purple-600/10 via-pink-500/10 to-transparent pointer-events-none rounded-full blur-2xl" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800/40 rounded-full text-xs font-mono text-purple-700 dark:text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>Student Learning Hub</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)]">
                Welcome Back, <span className="text-gradient-purple-pink">Developer</span>
              </h1>
              <p className="text-[var(--text-secondary)] text-xs md:text-sm">
                Your Mcode-Agent live workspace is synced with your local desktop machine.
              </p>
            </div>

            <Link
              href="/workspace"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 font-semibold text-xs text-white shadow-lg shadow-purple-500/20 hover:scale-105 transition-all flex items-center gap-2"
            >
              <Code2 className="w-4 h-4 text-white" />
              <span>Resume Active Live Session</span>
            </Link>
          </div>
        </div>

        {/* STATS METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-card p-5 space-y-2">
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span className="text-xs font-mono uppercase tracking-wider">Learning Streak</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[var(--text-primary)]">7 Days</span>
              <span className="text-[10px] text-emerald-400 font-mono">+2 today</span>
            </div>
          </div>

          <div className="glass-card p-5 space-y-2">
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span className="text-xs font-mono uppercase tracking-wider">Live Tutor Time</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[var(--text-primary)]">18.5 Hrs</span>
              <span className="text-[10px] text-purple-400 font-mono">Interactive</span>
            </div>
          </div>

          <div className="glass-card p-5 space-y-2">
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span className="text-xs font-mono uppercase tracking-wider">Completed Lessons</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[var(--text-primary)]">25 / 56</span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">45% total</span>
            </div>
          </div>

          <div className="glass-card p-5 space-y-2">
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span className="text-xs font-mono uppercase tracking-wider">Desktop Sync</span>
              <FolderSync className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-[var(--text-primary)] truncate">sandbox-project</span>
              <span className="text-[10px] text-emerald-400 font-mono">ONLINE</span>
            </div>
          </div>
        </div>

        {/* ACTIVE COURSES & TUTOR TIMELINE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Enrolled Courses */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--inner-box-border)] pb-3">
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-400" />
                <span>My Active Enrolled Courses</span>
              </h2>
              <Link href="/learning-space" className="text-xs text-purple-500 hover:underline font-mono">
                + Browse Catalog
              </Link>
            </div>

            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course.id} className="glass-card p-6 space-y-4 border-purple-900/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800/40 text-[10px] font-mono text-purple-700 dark:text-purple-300">
                        {course.category}
                      </span>
                      <h3 className="text-lg font-bold text-[var(--text-primary)] mt-1">{course.title}</h3>
                      <p className="text-xs font-mono text-[var(--text-muted)] mt-1">Desktop Folder: {course.desktopFolder}</p>
                    </div>

                    <Link
                      href="/workspace"
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 rounded-xl text-xs font-semibold text-white hover:opacity-95 transition-all shadow-md shadow-purple-500/20 shrink-0 text-center"
                    >
                      Continue Live Lesson
                    </Link>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-[var(--text-muted)] font-mono">
                      <span>Course Progress</span>
                      <span>{course.completedLessons} / {course.totalLessons} Lessons ({course.progress}%)</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--inner-box-bg)] rounded-full overflow-hidden border border-[var(--inner-box-border)]">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500" 
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Recent Live Tutor Interventions */}
          <div className="space-y-6">
            <div className="border-b border-[var(--inner-box-border)] pb-3">
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Activity className="w-4 h-4 text-pink-400" />
                <span>Live Tutor Interventions</span>
              </h2>
            </div>

            <div className="glass-card p-5 space-y-4">
              {tutorLog.map((log, index) => (
                <div key={index} className="p-3 bg-[var(--inner-box-bg)] rounded-xl border border-[var(--inner-box-border)] space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-purple-400 font-semibold">{log.title}</span>
                    <span className="text-[var(--text-muted)]">{log.time}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{log.detail}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </DashboardShell>
  );
}
