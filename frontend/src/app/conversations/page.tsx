'use client';

import React, { useState, useEffect } from 'react';
import DashboardShell from '../../components/DashboardShell';
import { 
  MessageSquareCode, 
  Search, 
  Play, 
  Clock, 
  User, 
  Volume2, 
  VolumeX, 
  Calendar,
  Speech
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface ConversationSession {
  id: string;
  title: string;
  date: string;
  duration: string;
  summary: string;
  messages: Message[];
}

export default function Conversations() {
  const [activeSession, setActiveSession] = useState<ConversationSession | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPlayingText, setIsPlayingText] = useState<string | null>(null);

  // High fidelity mock data for engineering conversation archives
  const mockSessions: ConversationSession[] = [
    {
      id: 'session-1',
      title: 'Database Schema & Prisma Setup',
      date: 'Aug 06, 2026',
      duration: '4m 32s',
      summary: 'Discussed migrating to Prisma schema layout, configuring PostgreSQL connection keys, and setting up initial data model seed structures.',
      messages: [
        { role: 'user', text: 'I need to setup PostgreSQL with Prisma client in this node project. How do we configure it?', timestamp: '10:02 AM' },
        { role: 'assistant', text: 'To configure Prisma, we must specify the provider as "postgresql" inside your schema.prisma file. I will generate a plan to create the database schemas and initialize the client seed configuration.', timestamp: '10:02 AM' },
        { role: 'user', text: 'Is it better to store JWT secrets in a .env file or DB configuration?', timestamp: '10:04 AM' },
        { role: 'assistant', text: 'Always store JWT secret keys in the environment .env file rather than a database table. Hardcoded keys in codebase present severe security risks. I will add this to decisions.json in memory.', timestamp: '10:04 AM' }
      ]
    },
    {
      id: 'session-2',
      title: 'Voice Session: REST Endpoint Design',
      date: 'Aug 05, 2026',
      duration: '6m 12s',
      summary: 'Design session mapping Express route definitions, controller modularity, and error validation structures.',
      messages: [
        { role: 'user', text: 'MalangCode, plan the new REST routes for project dashboard data.', timestamp: '2:15 PM' },
        { role: 'assistant', text: 'I will write a subtask roadmap separating projects, tasks, memory sync logs, and settings endpoints. This enforces clean separation of concerns and SOLID controller designs.', timestamp: '2:16 PM' },
        { role: 'user', text: 'Which model will the coder agent use for this task?', timestamp: '2:18 PM' },
        { role: 'assistant', text: 'I recommend assigning CoderAgent using the qwen2.5-coder:7b model, as it performs exceptionally well on TypeScript router syntaxes.', timestamp: '2:18 PM' }
      ]
    },
    {
      id: 'session-3',
      title: 'Memory Sync Resolution Alignment',
      date: 'Aug 03, 2026',
      duration: '3m 15s',
      summary: 'Debugging file locked issues during synchronizations of tasks.json between local workspaces and remote databases.',
      messages: [
        { role: 'user', text: 'The local tasks.json file seems out of sync with MongoDB records.', timestamp: '11:45 AM' },
        { role: 'assistant', text: 'Let me execute MemorySyncService. We will read the local tasks.json file, merge any conflict states, and push the updated parameters to the MongoDB collection.', timestamp: '11:45 AM' }
      ]
    }
  ];

  useEffect(() => {
    if (mockSessions.length > 0 && !activeSession) {
      setActiveSession(mockSessions[0]);
    }
  }, []);

  const handleSpeak = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (isPlayingText === text) {
        window.speechSynthesis.cancel();
        setIsPlayingText(null);
        return;
      }
      
      window.speechSynthesis.cancel();
      setIsPlayingText(text);
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira'));
      if (femaleVoice) utterance.voice = femaleVoice;
      
      utterance.onend = () => setIsPlayingText(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  const filteredSessions = mockSessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardShell>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Session Archives list */}
        <div className="space-y-6">
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-blue-900/20 pb-3">
              <MessageSquareCode className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-white">Archives</h3>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transcripts..."
                className="w-full bg-slate-950/80 border border-blue-900/30 text-white text-xs rounded-lg pl-9 pr-4 py-2.5 outline-none focus:border-cyan-500/80 placeholder-slate-600"
              />
            </div>

            {/* Sessions Scroll list */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {filteredSessions.map((s) => {
                const isActive = activeSession?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSession(s)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all ${
                      isActive 
                        ? 'bg-blue-600/15 border-blue-500/40' 
                        : 'bg-slate-900/30 border-blue-900/10 hover:border-blue-900/30'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        {s.date}
                      </span>
                      <span>{s.duration}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate">{s.title}</h4>
                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">{s.summary}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Conversation Viewer Details */}
        <div className="lg:col-span-2">
          {activeSession ? (
            <div className="glass-card p-6 flex flex-col justify-between min-h-[500px]">
              <div>
                {/* Header title */}
                <div className="flex items-center justify-between border-b border-blue-900/20 pb-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">{activeSession.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{activeSession.date} • Session duration: {activeSession.duration}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-blue-600/10 px-3 py-1.5 rounded-lg border border-blue-500/20 text-blue-400 font-mono text-[10px]">
                    <Speech className="w-3.5 h-3.5" />
                    <span>AUDIO LOGGED</span>
                  </div>
                </div>

                {/* Message items list */}
                <div className="space-y-5">
                  {activeSession.messages.map((m, index) => (
                    <div key={index} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-xl border text-sm leading-relaxed relative group ${
                        m.role === 'user'
                          ? 'bg-blue-600/15 border-blue-500/30 text-white rounded-br-none'
                          : 'bg-slate-900/60 border-blue-900/15 text-slate-300 rounded-bl-none'
                      }`}>
                        <div className="flex items-center justify-between gap-6 mb-1 text-[10px] font-mono text-cyan-400/80">
                          <span>{m.role === 'user' ? 'DEVELOPER' : 'MALANGCODE CTO'}</span>
                          <span>{m.timestamp}</span>
                        </div>
                        <p>{m.text}</p>
                        
                        {/* Playback Voice Synthesizer icon */}
                        {m.role === 'assistant' && (
                          <button
                            onClick={() => handleSpeak(m.text)}
                            className="absolute -right-9 top-1/2 -translate-y-1/2 p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg border border-blue-900/20 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                            title="Play Speech Audio"
                          >
                            {isPlayingText === m.text ? (
                              <VolumeX className="w-3.5 h-3.5 text-cyan-400" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom session summary */}
              <div className="mt-8 pt-4 border-t border-blue-900/20 text-xs text-slate-500 leading-relaxed bg-slate-950/20 p-4 rounded-lg">
                <span className="font-semibold block text-slate-400 font-mono text-[10px] uppercase mb-1">Session Summary Output</span>
                {activeSession.summary}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full glass-card text-slate-500 text-sm">
              <span>Select a conversation session to review details.</span>
            </div>
          )}
        </div>

      </div>
    </DashboardShell>
  );
}
