'use client';

import React, { useState, useEffect } from 'react';
import DashboardShell from '../../components/DashboardShell';
import { 
  FolderPlus, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  AlertTriangle,
  FolderGit2,
  GitBranch,
  Terminal,
  Activity
} from 'lucide-react';

interface Project {
  _id: string;
  name: string;
  path: string;
  framework: string;
  activeBranch: string;
  packageManager: string;
  buildTools: string;
  healthStatus: string;
  lastSync: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [newPath, setNewPath] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        const cachedId = localStorage.getItem('mc_active_project_id');
        if (cachedId) setActiveProjectId(cachedId);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Failed to connect to backend service.');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleRegisterProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPath.trim()) return;

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: newPath,
          name: newName || undefined
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(`Project '${data.name}' registered successfully! .nova working memory initialized.`);
        setNewPath('');
        setNewName('');
        fetchProjects();
        
        // Auto select if first project
        if (!localStorage.getItem('mc_active_project_id')) {
          localStorage.setItem('mc_active_project_id', data._id);
          setActiveProjectId(data._id);
          window.dispatchEvent(new Event('mc_project_changed'));
        }
      } else {
        setErrorMsg(data.error || 'Failed to register project.');
      }
    } catch (err) {
      setErrorMsg('Network error. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectActive = (id: string) => {
    localStorage.setItem('mc_active_project_id', id);
    setActiveProjectId(id);
    window.dispatchEvent(new Event('mc_project_changed'));
    setSuccessMsg('Active project workspace updated.');
  };

  const handleAnalyze = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${id}/analyze`, {
        method: 'POST'
      });
      if (res.ok) {
        setSuccessMsg('Project framework scanned and .nova synced successfully.');
        fetchProjects();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to analyze project.');
      }
    } catch (e) {
      setErrorMsg('Analysis failed due to server connection issues.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Alerts messages */}
        {errorMsg && (
          <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Register Form */}
          <div className="glass-card p-6 h-fit">
            <div className="flex items-center gap-2.5 border-b border-blue-900/20 pb-3 mb-4">
              <FolderPlus className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-white">Register Workspace</h3>
            </div>
            
            <form onSubmit={handleRegisterProject} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-mono">PROJECT DIR PATH (Absolute)</label>
                <input
                  type="text"
                  required
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  placeholder="e.g. C:\Users\Desktop\my-app"
                  className="w-full bg-slate-950 border border-blue-900/30 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-cyan-500/80 placeholder-slate-600"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-mono">PROJECT ALIAS (Optional)</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. My Nextjs Store"
                  className="w-full bg-slate-950 border border-blue-900/30 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-cyan-500/80 placeholder-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm py-2.5 rounded-lg hover:from-blue-500 hover:to-cyan-400 transition-all shadow-md shadow-blue-500/10 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Initialize & Register'}
              </button>
            </form>
          </div>

          {/* List of projects registered */}
          <div className="xl:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 border-b border-blue-900/20 pb-3 mb-5">
                <FolderGit2 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-white">Registered Workspaces</h3>
              </div>

              {projects.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">
                  <span>No workspace paths registered. Input a path to initialize MalangCode memory.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((p) => {
                    const isActive = p._id === activeProjectId;
                    return (
                      <div 
                        key={p._id} 
                        className={`p-4 rounded-xl border transition-all ${
                          isActive 
                            ? 'bg-blue-950/15 border-blue-500/40 shadow-lg shadow-blue-500/5' 
                            : 'bg-slate-900/40 border-blue-900/10'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2.5">
                              <h4 className="text-sm font-bold text-white">{p.name}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider ${
                                p.healthStatus === 'healthy' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {p.healthStatus.toUpperCase()}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 font-mono block mt-1">{p.path}</span>
                          </div>

                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => handleSelectActive(p._id)}
                              disabled={isActive}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                isActive 
                                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' 
                                  : 'bg-slate-900 border border-blue-900/30 text-slate-300 hover:text-white hover:border-blue-500/50'
                              }`}
                            >
                              {isActive ? 'Active' : 'Set Active'}
                            </button>

                            <button
                              onClick={() => handleAnalyze(p._id)}
                              disabled={isLoading}
                              className="p-1.5 bg-slate-900 border border-blue-900/30 text-slate-400 hover:text-white rounded-lg hover:border-blue-500/50 transition-all"
                              title="Rescan project framework"
                            >
                              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {/* Project Specs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-blue-900/10 text-xs text-slate-400">
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono block">FRAMEWORK</span>
                            <span className="text-slate-300 font-medium">{p.framework}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono block">BRANCH</span>
                            <div className="flex items-center gap-1 text-slate-300 font-medium">
                              <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{p.activeBranch}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono block">PACKAGE MANAGER</span>
                            <span className="text-slate-300 font-medium">{p.packageManager}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono block">LAST SYNCED</span>
                            <span className="text-slate-300 font-medium">
                              {p.lastSync ? new Date(p.lastSync).toLocaleTimeString() : 'N/A'}
                            </span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

// Small helper icon component
function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}
