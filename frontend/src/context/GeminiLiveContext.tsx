"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useRouter, usePathname } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface GeminiLiveContextType {
  isConnected: boolean;
  isRecording: boolean;
  isPlayingBack: boolean;
  statusMsg: string;
  messages: Message[];
  isAgentDrawerOpen: boolean;
  setIsAgentDrawerOpen: (open: boolean) => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  sendTextMessage: (text: string) => void;
  speechEnabled: boolean;
  setSpeechEnabled: (enabled: boolean) => void;
  activeToolToast: string | null;
}

const GeminiLiveContext = createContext<GeminiLiveContextType | undefined>(
  undefined,
);

export function GeminiLiveProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlayingBack, setIsPlayingBack] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>(
    "Initializing Voice Gate...",
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAgentDrawerOpen, setIsAgentDrawerOpen] = useState<boolean>(false);
  const [speechEnabled, setSpeechEnabled] = useState<boolean>(true);
  const [activeToolToast, setActiveToolToast] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackTimeRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);

  const pathnameRef = useRef(pathname);
  const isMountedRef = useRef<boolean>(true);
  const reconnectAttemptsRef = useRef<number>(0); // Tracks reconnect loops

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    isMountedRef.current = true;
    connectWebSocket();

    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcript =
            event.results[event.results.length - 1][0].transcript.trim();
          parseAndSendVoiceIntent(transcript);
        };
        recognitionRef.current = recognition;
      }
    }

    return () => {
      isMountedRef.current = false;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (processorRef.current) processorRef.current.disconnect();
      if (mediaStreamRef.current)
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const connectWebSocket = () => {
    if (!isMountedRef.current) return;
    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    setStatusMsg("Connecting to Voice Gate...");
    const ws = new WebSocket("ws://localhost:5000/api/live");
    socketRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) {
        ws.close();
        return;
      }
      setIsConnected(true);
      setStatusMsg("Gateway Connected");
      reconnectAttemptsRef.current = 0; // Reset attempts on successful connection
    };

    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "status") {
          setStatusMsg(message.message);

          if (message.message === "Gemini connection lost") {
            setIsConnected(false);
            setIsRecording(false);
          }
        } else if (message.type === "error") {
          setStatusMsg(`Error: ${message.message}`);
        } else if (message.type === "STUDENT_CODE_EDIT_DETECTED") {
          window.dispatchEvent(
            new CustomEvent("mcode_student_edit_detected", {
              detail: message.payload,
            }),
          );
        } else if (message.type === "tool_call_action") {
          setActiveToolToast(`Executing: ${message.action.toUpperCase()}`);
          setTimeout(() => setActiveToolToast(null), 4000);

          if (message.action === "navigate_page" && message.payload?.path) {
            router.push(message.payload.path);
          } else if (
            message.action === "search_courses" ||
            message.action === "enroll_course"
          ) {
            if (pathnameRef.current !== "/learning-space")
              router.push("/learning-space");
            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent(
                  message.action === "search_courses"
                    ? "mcode_voice_search"
                    : "mcode_voice_enroll",
                  {
                    detail: message.payload,
                  },
                ),
              );
            }, 100);
          } else if (message.action === "vscode_opened") {
            window.dispatchEvent(
              new CustomEvent("mcode_voice_vscode", {
                detail: message.payload,
              }),
            );
          }
        } else if (message.serverContent?.modelTurn?.parts) {
          const parts = message.serverContent.modelTurn.parts;

          let newTextString = "";

          for (const part of parts) {
            // Process audio without locking thread
            if (
              part.inlineData &&
              part.inlineData.mimeType?.startsWith("audio/pcm")
            ) {
              playPCMChunk(part.inlineData.data);
            }
            // Group text chunks together to prevent React state flooding
            if (part.text) {
              newTextString += part.text;
            }
          }

          // Safely append streamed text
          if (newTextString) {
            setMessages((prev) => {
              if (prev.length === 0)
                return [{ role: "assistant", text: newTextString }];
              const lastMsg = prev[prev.length - 1];

              if (lastMsg.role === "assistant") {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...lastMsg,
                  text: lastMsg.text + newTextString,
                };
                return updated;
              }
              return [...prev, { role: "assistant", text: newTextString }];
            });
          }
        }
      } catch (e) {
        console.error("Error handling WebSocket message", e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsRecording(false);
      socketRef.current = null; // Clean up dead socket reference

      if (!isMountedRef.current) return;

      // Hard limit on reconnects to prevent API ban / Quota exhaustion
      if (reconnectAttemptsRef.current >= 3) {
        setStatusMsg(
          "Connection blocked by API Quota. Please refresh the page.",
        );
        return;
      }

      reconnectAttemptsRef.current += 1;
      setStatusMsg(
        `Disconnected. Retrying (Attempt ${reconnectAttemptsRef.current}/3)...`,
      );

      // Exponential backoff: Wait 3s, then 6s, then 9s
      setTimeout(connectWebSocket, 3000 * reconnectAttemptsRef.current);
    };

    ws.onerror = () => {
      setIsConnected(false);
      setStatusMsg("Connection Error.");
    };
  };

  const parseAndSendVoiceIntent = async (text: string) => {
    const lower = text.toLowerCase();
    if (
      lower.includes("open vs code") ||
      lower.includes("launch vs code") ||
      lower.includes("show vs code")
    ) {
      try {
        await fetch("http://localhost:5000/api/projects/open-vscode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "c:\\Users\\Rahis\\Desktop\\McodeProjects",
          }),
        });
        window.dispatchEvent(
          new CustomEvent("mcode_voice_vscode", {
            detail: { path: "c:\\Users\\Rahis\\Desktop\\McodeProjects" },
          }),
        );
      } catch (err) {}
    }
  };

  const playPCMChunk = async (base64Data: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )({
          sampleRate: 24000,
        });
      }

      const audioCtx = audioContextRef.current;
      if (audioCtx.state === "suspended") await audioCtx.resume();

      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const dataView = new DataView(bytes.buffer);
      const float32Array = new Float32Array(bytes.length / 2);
      for (let i = 0; i < float32Array.length; i++) {
        float32Array[i] = dataView.getInt16(i * 2, true) / 32768.0;
      }

      const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      setIsPlayingBack(true);

      const currentTime = audioCtx.currentTime;
      const startTime = Math.max(playbackTimeRef.current, currentTime);
      source.start(startTime);
      playbackTimeRef.current = startTime + audioBuffer.duration;

      source.onended = () => {
        if (audioCtx.currentTime >= playbackTimeRef.current - 0.1) {
          setIsPlayingBack(false);
        }
      };
    } catch (err) {
      console.error("Playback failed", err);
    }
  };

  const startRecording = async () => {
    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }
      const audioCtx = audioContextRef.current;
      if (audioCtx.state === "suspended") await audioCtx.resume();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      mediaStreamRef.current = stream;
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const silentGain = audioCtx.createGain();
      silentGain.gain.value = 0;

      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(audioCtx.destination);

      const inputSampleRate = audioCtx.sampleRate;
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBuffer = downsampleAndConvertToInt16(
          inputData,
          inputSampleRate,
          16000,
        );
        const base64 = arrayBufferToBase64(pcmBuffer);

        if (
          socketRef.current &&
          socketRef.current.readyState === WebSocket.OPEN
        ) {
          socketRef.current.send(
            JSON.stringify({
              type: "audio_chunk",
              mimeType: "audio/pcm;rate=16000",
              data: base64,
            }),
          );
        }
      };

      setIsRecording(true);
      setStatusMsg("Listening...");
    } catch (err) {
      setStatusMsg("Mic access denied");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setStatusMsg(isConnected ? "Gateway Connected" : "Disconnected");

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const sendTextMessage = (text: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "text", text }));
      setMessages((prev) => [...prev, { role: "user", text }]);
    }
  };

  const downsampleAndConvertToInt16 = (
    buffer: Float32Array,
    inputRate: number,
    outputRate: number,
  ): ArrayBuffer => {
    if (inputRate === outputRate) {
      const result = new Int16Array(buffer.length);
      for (let i = 0; i < buffer.length; i++) {
        const s = Math.max(-1, Math.min(1, buffer[i]));
        result[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      return result.buffer;
    }
    const ratio = inputRate / outputRate;
    const result = new Int16Array(Math.round(buffer.length / ratio));
    let offsetResult = 0,
      offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      let accum = 0,
        count = 0;
      for (
        let i = offsetBuffer;
        i < nextOffsetBuffer && i < buffer.length;
        i++
      ) {
        accum += buffer[i];
        count++;
      }
      const val = Math.max(-1, Math.min(1, count > 0 ? accum / count : 0));
      result[offsetResult] = val < 0 ? val * 0x8000 : val * 0x7fff;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result.buffer;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++)
      binary += String.fromCharCode(bytes[i]);
    return window.btoa(binary);
  };

  return (
    <GeminiLiveContext.Provider
      value={{
        isConnected,
        isRecording,
        isPlayingBack,
        statusMsg,
        messages,
        isAgentDrawerOpen,
        setIsAgentDrawerOpen,
        startRecording,
        stopRecording,
        sendTextMessage,
        speechEnabled,
        setSpeechEnabled,
        activeToolToast,
      }}
    >
      {children}
    </GeminiLiveContext.Provider>
  );
}

export function useGeminiLive() {
  const context = useContext(GeminiLiveContext);
  if (!context)
    throw new Error("useGeminiLive must be used within a GeminiLiveProvider");
  return context;
}
