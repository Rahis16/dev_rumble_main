"use client";

import React, { useState } from "react";
import { Mic, MicOff, Send, Volume2, VolumeX, Radio, Sparkles, Command } from "lucide-react";
import { useGeminiLive } from "@/context/GeminiLiveContext";

interface VoiceControllerProps {
  projectId: string;
  onNewMessage?: (msg: { role: "user" | "assistant"; text: string }) => void;
}

export default function VoiceController({
  projectId,
  onNewMessage,
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

  return (
    <div className="glass-card p-6 flex flex-col gap-4 border border-purple-500/20 bg-[#0c0d14]/90 rounded-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio
            className={`w-4 h-4 ${isConnected ? "text-purple-400 animate-pulse" : "text-slate-500"}`}
          />
          <span className="text-sm font-semibold text-white">
            Mcode-Agent Voice Loop & Automation
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono bg-slate-900/85 px-2.5 py-1 rounded-lg border border-purple-900/30">
          {statusMsg}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center py-6 bg-[#090a10] rounded-xl border border-slate-800/80 relative overflow-hidden">
        <div className="flex items-center justify-center gap-1.5 h-10 mb-3">
          {isRecording || isPlayingBack ? (
            <div className="flex items-center gap-2 text-xs font-mono text-purple-300">
              <Sparkles className="w-4 h-4 text-pink-400 animate-spin" />
              <span>Voice Control & Audio Streaming Active</span>
            </div>
          ) : (
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
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
                ? "border-purple-800/40 bg-slate-900 text-purple-300"
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
          className="flex-1 bg-[#090a10] border border-slate-800 text-white text-xs rounded-xl px-4 py-2.5 outline-none focus:border-purple-500 placeholder-slate-500 disabled:opacity-50 font-mono"
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
