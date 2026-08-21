'use client';

import React, { useState, useEffect } from 'react';
import DashboardShell from '../../components/DashboardShell';
import { 
  BrainCircuit, 
  Files, 
  Database, 
  FileText, 
  ArrowLeftRight, 
  Save, 
  PlusCircle,
  FileCheck,
  Cpu
} from 'lucide-react';

interface Decision {
  _id?: string;
  title: string;
  content: string;
  rationale: string;
  impact: string;
  timestamp: string;
}

interface LocalFile {
  filename: string;
  size: number;
}

export default function Memory() {
  const [projectId, setProjectId] = useState<string>('');
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [selectedFilename, setSelectedFilename] = useState<string>('project.json');
  const [fileContent, setFileContent] = useState<string>('');
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [isEditingFile, setIsEditingFile] = useState<boolean>(false);
  const [newDecision, setNewDecision] = useState<Omit<Decision, 'timestamp'>>({
    title: '', content: '', rationale: '', impact: ''
  });
  const [statusMsg, setStatusMsg] = useState<string>('');

  const loadMemoryDetails = async () => {
    const id = localStorage.getItem('mc_active_project_id');
    if (!id) return;
    setProjectId(id);

    try {
      // 1. Fetch Local Files status
      const resFiles = await fetch(`http://localhost:5000/api/memory/status?projectId=${id}`);
      if (resFiles.ok) {
        const data = await resFiles.json();
        setLocalFiles(data.files || []);
      }

      // 2. Fetch Decisions
      const resDec = await fetch(`http://localhost:5000/api/memory/decisions?projectId=${id}`);
      if (resDec.ok) {
        const data = await resDec.json();
        setDecisions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSelectedFileContent = async (filename: string) => {
    const id = localStorage.getItem('mc_active_project_id');
    if (!id) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/memory/file?projectId=${id}&filename=${filename}`);
      if (res.ok) {
        const data = await res.json();
        setFileContent(typeof data.content === 'object' ? JSON.stringify(data.content, null, 2) : data.content);
        setSelectedFilename(filename);
        setIsEditingFile(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadMemoryDetails();
    fetchSelectedFileContent('project.json');

    window.addEventListener('mc_project_changed', () => {
      loadMemoryDetails();
      fetchSelectedFileContent('project.json');
    });
    return () => window.removeEventListener('mc_project_changed', loadMemoryDetails);
  }, []);

  const handleFileSave = async () => {
    if (!projectId) return;
    try {
      // Check if it is JSON
      let contentToSend: any = fileContent;
      if (selectedFilename.endsWith('.json')) {
        try {
          contentToSend = JSON.parse(fileContent);
        } catch (e) {
          setStatusMsg('Error: Invalid JSON syntax.');
          return;
        }
      }

      const res = await fetch('http://localhost:5000/api/memory/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          filename: selectedFilename,
          content: contentToSend
        })
      });

      if (res.ok) {
        setStatusMsg('Local memory file saved and synced successfully.');
        setIsEditingFile(false);
        loadMemoryDetails();
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
      setStatusMsg('Error saving file contents.');
    }
  };

  const handleCreateDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !newDecision.title || !newDecision.content) return;

    try {
      const res = await fetch('http://localhost:5000/api/memory/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ...newDecision
        })
      });

      if (res.ok) {
        setNewDecision({ title: '', content: '', rationale: '', impact: '' });
        loadMemoryDetails();
        // Refresh file content if currently looking at decisions.json
        if (selectedFilename === 'decisions.json') {
          fetchSelectedFileContent('decisions.json');
        }
        setStatusMsg('Architectural Decision logged and pushed to local .nova memory.');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardShell>
      {!projectId ? (
        <div className="text-center py-12 text-slate-500">
          <span>Please select a project to view its memory index.</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Diagnostic Sync indicator */}
          <div className="glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-dashed border border-blue-500/20 bg-blue-950/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Active Synchronizer</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  Syncing local workspace disk & cloud database clusters.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded border border-blue-900/20">
                <Files className="w-3.5 h-3.5 text-blue-400" />
                <span>Local: .nova/ directory</span>
              </div>
              <ArrowLeftRight className="w-4 h-4 text-cyan-500" />
              <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded border border-blue-900/20">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cloud: MongoDB tables</span>
              </div>
            </div>
          </div>

          {statusMsg && (
            <div className={`p-4 rounded-lg text-xs font-medium border ${
              statusMsg.startsWith('Error') 
                ? 'bg-red-950/20 border-red-500/25 text-red-400' 
                : 'bg-emerald-950/15 border-emerald-500/20 text-emerald-400'
            }`}>
              {statusMsg}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Left: Files Browser panel */}
            <div className="xl:col-span-2 space-y-6">
              <div className="glass-card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-900/20 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-semibold text-white">Local Memory Workspace (.nova)</h3>
                  </div>

                  {/* Browser selector */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {localFiles.map((file) => (
                      <button
                        key={file.filename}
                        onClick={() => fetchSelectedFileContent(file.filename)}
                        className={`px-2.5 py-1.5 rounded text-[10px] font-mono border transition-all ${
                          selectedFilename === file.filename
                            ? 'bg-blue-600/10 border-blue-500/40 text-blue-400'
                            : 'bg-slate-950/50 border-blue-900/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {file.filename}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Editor */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-cyan-400">{selectedFilename}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditingFile(!isEditingFile)}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-blue-900/20 text-slate-300 hover:text-white rounded"
                      >
                        {isEditingFile ? 'Cancel' : 'Edit File'}
                      </button>
                      
                      {isEditingFile && (
                        <button
                          onClick={handleFileSave}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <textarea
                    disabled={!isEditingFile}
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    className="w-full h-80 bg-slate-950 text-slate-300 font-mono text-xs p-4 rounded-lg border border-blue-900/30 outline-none focus:border-cyan-500/80 resize-none disabled:opacity-85"
                  />
                </div>
              </div>

              {/* Decision history list */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 border-b border-blue-900/20 pb-3 mb-4">
                  <FileCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-semibold text-white">Cloud Decisions Database</h3>
                </div>

                {decisions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    <span>No architectural choices documented yet. Use the panel on the right to log one.</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {decisions.map((dec, idx) => (
                      <div key={idx} className="p-4 bg-slate-900/40 rounded-lg border border-blue-900/10 text-xs">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="font-bold text-white text-sm">{dec.title}</h4>
                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(dec.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-300 mt-2 leading-relaxed">{dec.content}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-blue-900/10 text-[10px] text-slate-400 leading-relaxed">
                          <div>
                            <span className="font-semibold text-slate-500 block uppercase font-mono mb-0.5">RATIONALE</span>
                            <span>{dec.rationale}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500 block uppercase font-mono mb-0.5">IMPACT</span>
                            <span>{dec.impact}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Record Decisions form panel */}
            <div className="glass-card p-6 h-fit">
              <div className="flex items-center gap-2.5 border-b border-blue-900/20 pb-3 mb-4">
                <PlusCircle className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-white">Log Decision</h3>
              </div>

              <form onSubmit={handleCreateDecision} className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 font-mono">CHOICE TITLE</label>
                  <input
                    type="text"
                    required
                    value={newDecision.title}
                    onChange={(e) => setNewDecision({ ...newDecision, title: e.target.value })}
                    placeholder="e.g. Use Next.js App Router"
                    className="w-full bg-slate-950 border border-blue-900/30 text-white text-xs rounded-md px-3 py-2 outline-none focus:border-cyan-500/80 placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 font-mono">DECISION DETAILS</label>
                  <textarea
                    required
                    rows={3}
                    value={newDecision.content}
                    onChange={(e) => setNewDecision({ ...newDecision, content: e.target.value })}
                    placeholder="Describe exactly what architecture choice was made..."
                    className="w-full bg-slate-950 border border-blue-900/30 text-white text-xs rounded-md px-3 py-2 outline-none focus:border-cyan-500/80 placeholder-slate-600 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 font-mono">TECHNICAL RATIONALE</label>
                  <textarea
                    rows={2}
                    value={newDecision.rationale}
                    onChange={(e) => setNewDecision({ ...newDecision, rationale: e.target.value })}
                    placeholder="Explain why this decision was made over alternatives..."
                    className="w-full bg-slate-950 border border-blue-900/30 text-white text-xs rounded-md px-3 py-2 outline-none focus:border-cyan-500/80 placeholder-slate-600 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 font-mono">ARCHITECTURAL IMPACT</label>
                  <input
                    type="text"
                    value={newDecision.impact}
                    onChange={(e) => setNewDecision({ ...newDecision, impact: e.target.value })}
                    placeholder="e.g. Clean separation, faster layouts, strict TS types."
                    className="w-full bg-slate-950 border border-blue-900/30 text-white text-xs rounded-md px-3 py-2 outline-none focus:border-cyan-500/80 placeholder-slate-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-xs py-2.5 rounded-md hover:from-blue-500 hover:to-cyan-400 transition-all shadow-md shadow-blue-500/10"
                >
                  Document Choice
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </DashboardShell>
  );
}
