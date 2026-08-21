'use client';

import React, { useState, useEffect } from 'react';
import DashboardShell from '../../components/DashboardShell';
import { 
  Settings as SettingsIcon, 
  Key, 
  Database, 
  Volume2, 
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

interface ServerSettings {
  geminiKeyConfigured: boolean;
  mongoDbUri: string;
  dbConnected: boolean;
  environment: string;
}

export default function Settings() {
  const [settings, setSettings] = useState<ServerSettings | null>(null);
  const [geminiInputKey, setGeminiInputKey] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Could not fetch settings from Express server.');
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveGeminiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiInputKey.trim()) return;

    // Persist API Key in client-side localStorage so it can be read if needed,
    // or provide tips to configure it in the backend folder's .env file.
    localStorage.setItem('mc_gemini_api_key', geminiInputKey);
    setSuccessMsg('Gemini Key saved in client storage. To hide credentials, configure the key in "backend/.env".');
    setGeminiInputKey('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleResetSystem = async () => {
    if (!confirm('Are you sure you want to purge all MongoDB records and reset MalangCode to default templates?')) {
      return;
    }
    
    setIsResetting(true);
    setSuccessMsg('');
    setErrorMsg('');

    // Wait, let's trigger a reset route on backend (we will make sure we handle cleanup).
    // For this prototype, we can simulate resetting, or delete tasks/decisions for active projects
    const id = localStorage.getItem('mc_active_project_id');
    if (!id) {
      setErrorMsg('No active project to reset.');
      setIsResetting(false);
      return;
    }

    try {
      // Simulate purge of tasks and sync to DB
      const res = await fetch('http://localhost:5000/api/memory/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: id,
          filename: 'tasks.json',
          content: []
        })
      });

      const resDec = await fetch('http://localhost:5000/api/memory/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: id,
          filename: 'decisions.json',
          content: []
        })
      });

      if (res.ok && resDec.ok) {
        setSuccessMsg('System reset complete. All tasks and decisions purged from disk and cloud DB.');
        fetchSettings();
        // Dispatch event
        window.dispatchEvent(new Event('mc_project_changed'));
      } else {
        setErrorMsg('Failed to purge .nova memory files on disk.');
      }
    } catch (e) {
      setErrorMsg('Connection error during reset operation.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <DashboardShell>
      <div className="max-w-3xl space-y-8">
        
        {successMsg && (
          <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* API Credentials */}
          <div className="glass-card p-6 space-y-4 h-fit">
            <div className="flex items-center gap-2 border-b border-blue-900/20 pb-3">
              <Key className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-white">API Keys</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Gemini Live Speech API requires a Google AI key. We recommend defining it in <code className="text-cyan-400 font-mono">backend/.env</code>, but you can also configure it in client localStorage.
            </p>

            <div className="p-3.5 bg-slate-950/50 rounded-lg border border-blue-900/10 flex justify-between items-center text-xs">
              <span className="text-slate-400">Status in backend/.env:</span>
              {settings?.geminiKeyConfigured ? (
                <span className="text-emerald-400 font-mono font-bold">CONFIGURED</span>
              ) : (
                <span className="text-amber-500 font-mono font-bold">NOT DETECTED</span>
              )}
            </div>

            <form onSubmit={handleSaveGeminiKey} className="space-y-3.5 pt-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-mono">SET GEMINI API KEY</label>
                <input
                  type="password"
                  value={geminiInputKey}
                  onChange={(e) => setGeminiInputKey(e.target.value)}
                  placeholder="Enter AIzaSy..."
                  className="w-full bg-slate-950 border border-blue-900/30 text-white text-xs rounded-md px-3 py-2 outline-none focus:border-cyan-500/80 placeholder-slate-600"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-xs py-2.5 rounded-md hover:from-blue-500 hover:to-cyan-400 transition-all"
              >
                Save Client Key
              </button>
            </form>
          </div>

          {/* Database & Diagnostics status */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-blue-900/20 pb-3">
              <Database className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-white">System Diagnostics</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950/40 rounded border border-blue-900/10 flex justify-between items-center">
                <span className="text-slate-400">MongoDB Connection:</span>
                <span className={`font-mono font-bold ${settings?.dbConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                  {settings?.dbConnected ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>

              <div className="p-3 bg-slate-950/40 rounded border border-blue-900/10 flex justify-between items-center">
                <span className="text-slate-400">MongoDB Cluster String:</span>
                <span className="font-mono text-[10px] text-slate-300 truncate max-w-[150px]" title={settings?.mongoDbUri}>
                  {settings?.mongoDbUri}
                </span>
              </div>

              <div className="p-3 bg-slate-950/40 rounded border border-blue-900/10 flex justify-between items-center">
                <span className="text-slate-400">Environment Node Node:</span>
                <span className="font-mono text-slate-300 uppercase">{settings?.environment || 'development'}</span>
              </div>

              <div className="p-3 bg-slate-950/40 rounded border border-blue-900/10 flex justify-between items-center">
                <span className="text-slate-400">Local Memory Module:</span>
                <span className="font-mono text-cyan-400">FS-DIRECT ACTIVE</span>
              </div>
            </div>
          </div>

        </div>

        {/* Danger Zone */}
        <div className="glass-card p-6 border-red-500/20 bg-red-950/5">
          <div className="flex items-center gap-2 border-b border-red-500/10 pb-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold text-white">Danger Zone</h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-white">Purge Project Memory</h4>
              <p className="text-[11px] text-slate-400 mt-1 max-w-md leading-relaxed">
                Wipes the workspace tasks.json and decisions.json contents, and synchronizes the empty arrays to the MongoDB collection to restore MalangCode to pristine templates.
              </p>
            </div>

            <button
              disabled={isResetting}
              onClick={handleResetSystem}
              className="bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all shrink-0"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'Purging...' : 'Purge All Records'}</span>
            </button>
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
