"use client";

import React, { useState } from "react";
import { Mic, MicOff, Send, Volume2, VolumeX, Radio, Sparkles, Command } from "lucide-react";
import { useGeminiLive } from "@/context/GeminiLiveContext";

interface VoiceControllerProps {
  projectId: string;
  onNewMessage?: (msg: { role: "user" | "assistant"; text: string }) => void;
  compact?: boolean;
}

export default function VoiceController({
  projectId,
  onNewMessage,
  compact = false
}: VoiceControllerProps) {
  const {
    isConnected,
    isRecording,
    isPlayingBack,
    statusMsg,
    startRecording,
    stopRecording,
    sendTextMessage,
    speechEnabled,
    setSpeechEnabled
  } = useGeminiLive();

  const [inputText, setInputText] = useState<string>("");

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sendTextMessage(inputText);
    if (onNewMessage) {
      onNewMessage({ role: "user", text: inputText });
    }
    setInputText("");
  };

  if (compact) {
    return (
      <div className="p-2.5 bg-[var(--inner-box-bg)] rounded-xl border border-[var(--inner-box-border)] flex items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Radio
            className={`w-3.5 h-3.5 shrink-0 ${isConnected ? "text-purple-400 animate-pulse" : "text-[var(--text-muted)]"}`}
          />
          <div className="min-w-0">
            <span className="text-xs font-bold text-[var(--text-primary)] block truncate">
              {isRecording ? "Listening Voice Command..." : isPlayingBack ? "Streaming Audio..." : "Voice Controller"}
            </span>
            <span className="text-[9px] text-[var(--text-muted)] font-mono block truncate">{statusMsg}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              isRecording
                ? "bg-rose-600 text-white animate-pulse"
                : "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white hover:scale-105 shadow-sm"
            }`}
            title={isRecording ? "Stop Voice Input" : "Start Voice Input"}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`p-2 rounded-lg border transition-all ${
              speechEnabled
                ? "border-purple-800/40 bg-purple-950/40 text-purple-400"
                : "border-rose-950/40 text-rose-400"
            }`}
            title={speechEnabled ? "Mute Speech Output" : "Enable Speech Output"}
          >
            {speechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 flex flex-col gap-4 border border-purple-500/20 bg-[var(--card-bg)] rounded-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio
            className={`w-4 h-4 ${isConnected ? "text-purple-400 animate-pulse" : "text-[var(--text-muted)]"}`}
          />
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            Mcode-Agent Voice Loop & Automation
          </span>
        </div>
        <span className="text-xs text-[var(--text-muted)] font-mono bg-[var(--inner-box-bg)] px-2.5 py-1 rounded-lg border border-[var(--inner-box-border)]">
          {statusMsg}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center py-6 bg-[var(--inner-box-bg)] rounded-xl border border-[var(--inner-box-border)] relative overflow-hidden">
        <div className="flex items-center justify-center gap-1.5 h-10 mb-3">
          {isRecording || isPlayingBack ? (
            <div className="flex items-center gap-2 text-xs font-mono text-purple-400">
              <Sparkles className="w-4 h-4 text-pink-400 animate-spin" />
              <span>Voice Control & Audio Streaming Active</span>
            </div>
          ) : (
            <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest">
              Tap Microphone or Speak Voice Commands
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
              isRecording
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 scale-105"
                : "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white shadow-purple-600/30 hover:scale-105"
            }`}
          >
            {isRecording ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>

          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`p-3 rounded-xl border transition-all ${
              speechEnabled
                ? "border-purple-800/40 bg-[var(--inner-box-bg)] text-purple-400"
                : "border-rose-950/40 bg-rose-950/10 text-rose-400"
            }`}
          >
            {speechEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleTextSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder='Try "open vs code", "go to learning space", or "search react"...'
          disabled={!isConnected}
          className="flex-1 bg-[var(--inner-box-bg)] border border-[var(--inner-box-border)] text-[var(--text-primary)] text-xs rounded-xl px-4 py-2.5 outline-none focus:border-purple-500 placeholder-slate-400 disabled:opacity-50 font-mono"
        />
        <button
          type="submit"
          disabled={!isConnected || !inputText.trim()}
          className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md shadow-purple-500/20 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
