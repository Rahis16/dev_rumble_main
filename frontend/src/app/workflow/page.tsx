'use client';

import React, { useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import { 
  Play, 
  HelpCircle, 
  Settings, 
  Info,
  Mic,
  Brain,
  Sliders,
  Terminal,
  Cpu,
  FileCheck,
  Speech
} from 'lucide-react';

interface Step {
  id: number;
  name: string;
  service: string;
  icon: any;
  status: 'active' | 'pending' | 'success';
  description: string;
  details: string;
}

export default function Workflow() {
  const [selectedStep, setSelectedStep] = useState<number>(1);

  const steps: Step[] = [
    {
      id: 1,
      name: 'Developer Prompt',
      service: 'Voice / Text Input',
      icon: Mic,
      status: 'success',
      description: 'Captures speech through 16kHz PCM streams or text inputs over WebSocket.',
      details: 'Converts base64 input chunks dynamically or routes text content into the core MalangCode controller. Utilizes Web Audio API and fallback SpeechSynthesis.'
    },
    {
      id: 2,
      name: 'Context Router',
      service: 'Memory & RAG Pipeline',
      icon: Sliders,
      status: 'success',
      description: 'Determines active task, retrieves local .nova/ memory, and merges Git histories.',
      details: 'Builds a dense prompt context by prioritizing local storage first, fallback to remote cloud databases. Only relevant dependencies are inserted into the prompt to limit latency.'
    },
    {
      id: 3,
      name: 'MalangCode Planning',
      service: 'Planning & Architect Brain',
      icon: Brain,
      status: 'success',
      description: 'Outlines roadmap updates and constructs structured implementation tasks.',
      details: 'Analyzes user requests, detects dependencies between subtasks, estimates work hours, and creates tasks with specific model recommendations in MongoDB.'
    },
    {
      id: 4,
      name: 'Agent Orchestration',
      service: 'Ollama Coding Agent',
      icon: Cpu,
      status: 'active',
      description: 'Dispatches granular payloads to local models like Qwen2.5-Coder.',
      details: 'Generates specific implementation tasks, packages the target folder context, and monitors execution reports returned from external Ollama pipelines (Mock Interface in prototype).'
    },
    {
      id: 5,
      name: 'Terminal Controller',
      service: 'Command Execution Shell',
      icon: Terminal,
      status: 'pending',
      description: 'Executes builds, verifies syntax compilations, and runs test commands.',
      details: 'Launches terminal sessions inside the target project workspace to validate that changes compile cleanly and do not break existing modules.'
    },
    {
      id: 6,
      name: 'Review & Verify',
      service: 'Review & SOLID Brain',
      icon: FileCheck,
      status: 'pending',
      description: 'Examines file diffs, checks single responsibility design, and ranks code quality.',
      details: 'Verifies files against hardcoded secrets, SRP violations, lint warnings, and outputs a Review Report grading the task implementation.'
    },
    {
      id: 7,
      name: 'Voice Explanation',
      service: 'Gemini Live Speech Out',
      icon: Speech,
      status: 'pending',
      description: 'Streams explanation of review results back to the developer with a female voice.',
      details: 'Encodes outputs into PCM audio streams which are sent back over the WebSocket proxy and played back seamlessly, updating the session logs.'
    }
  ];

  return (
    <DashboardShell>
      <div className="space-y-8">
        
        {/* Top Info Banner */}
        <div className="glass-card p-5 flex items-start gap-4 border-cyan-500/20 bg-cyan-950/5">
          <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-white">Interactive Workflow Engine</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Below is the operational sequence of MalangCode. During interaction, tasks progress through these seven checkpoints to orchestrate code modifications, run test frameworks, and speak summaries. Click on any step node below to inspect details.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left / Center Grid Column: Visual flow chart mapping */}
          <div className="xl:col-span-2 glass-card p-6 flex flex-col justify-center min-h-[500px]">
            <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest border-b border-blue-900/20 pb-3 mb-8">
              System Pipeline Visualizer
            </h3>

            {/* SVG and Nodes Grid Flow */}
            <div className="relative flex flex-col items-center gap-8 py-4 max-w-lg mx-auto w-full">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isSelected = selectedStep === step.id;
                
                return (
                  <React.Fragment key={step.id}>
                    {/* SVG Connector Line */}
                    {idx > 0 && (
                      <div className="w-0.5 h-8 bg-gradient-to-b from-blue-500 to-cyan-400 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></div>
                      </div>
                    )}

                    {/* Step Card Node */}
                    <button
                      onClick={() => setSelectedStep(step.id)}
                      className={`w-full max-w-sm flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-300 relative group ${
                        isSelected 
                          ? 'bg-blue-600/15 border-blue-400 shadow-lg shadow-blue-500/10 scale-105' 
                          : 'bg-slate-900/40 border-blue-900/10 hover:border-blue-900/30'
                      }`}
                    >
                      {/* Step Number Badge */}
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold shrink-0 ${
                        isSelected 
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' 
                          : 'bg-slate-950 text-slate-500 border border-blue-900/20'
                      }`}>
                        {step.id}
                      </span>

                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${
                        isSelected 
                          ? 'bg-blue-600/10 border-blue-400 text-blue-400' 
                          : 'bg-slate-950 border-blue-900/20 text-slate-400'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Text details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {step.name}
                        </h4>
                        <span className="text-[10px] text-slate-500 block truncate mt-0.5">{step.service}</span>
                      </div>

                      {/* Status indicator */}
                      <span className={`w-2 h-2 rounded-full absolute right-4 top-1/2 -translate-y-1/2 ${
                        step.status === 'success' 
                          ? 'bg-emerald-500' 
                          : step.status === 'active'
                          ? 'bg-blue-500 animate-pulse'
                          : 'bg-slate-700'
                      }`} />
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Right Grid Column: Node detail inspector card */}
          <div>
            <div className="glass-card p-6 space-y-6 sticky top-6">
              <div className="border-b border-blue-900/20 pb-4">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block mb-1">Step Details</span>
                <h3 className="text-lg font-bold text-white">
                  {steps[selectedStep - 1].name}
                </h3>
                <span className="text-xs text-slate-400 font-mono block mt-1">
                  Handler: {steps[selectedStep - 1].service}
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-500 font-mono block uppercase mb-1">Functional Description</span>
                  <p className="text-slate-300 leading-relaxed bg-slate-950/30 p-3 rounded-lg border border-blue-900/5">
                    {steps[selectedStep - 1].description}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-mono block uppercase mb-1">Under the hood implementation</span>
                  <p className="text-slate-400 leading-relaxed bg-slate-950/30 p-3 rounded-lg border border-blue-900/5">
                    {steps[selectedStep - 1].details}
                  </p>
                </div>

                <div className="pt-4 border-t border-blue-900/10 flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500">PIPELINE STATUS</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    steps[selectedStep - 1].status === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : steps[selectedStep - 1].status === 'active'
                      ? 'bg-blue-600/10 text-blue-400 animate-pulse'
                      : 'bg-slate-950 text-slate-500'
                  }`}>
                    {steps[selectedStep - 1].status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}
