"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ConsultationStage =
  | "intro"
  | "symptoms"
  | "duration"
  | "age"
  | "remedy"
  | "advice";

export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  text: string;
  timestamp: number;
}

const INTRO_AI =
  "Hello, I am your AYUSH AI health assistant. How are you feeling today?";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function detectLanguage(text: string): "en" | "hi" | "mr" {
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  return "en";
}

export default function ConsultationCall({
  onEnd,
  onSaveHistory,
}: {
  onEnd: () => void;
  onSaveHistory: (messages: ChatMessage[]) => void;
}) {
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stage, setStage] = useState<ConsultationStage>("intro");
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationContext, setConversationContext] = useState<{
    symptoms?: string;
    duration?: string;
    age?: string;
    remedy?: unknown;
  }>({});
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const addMessage = useCallback((role: "ai" | "user", text: string) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role,
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const hindiVoice = voices.find(
      (v) => v.lang.includes("hi") || v.lang.includes("mr")
    );
    const enVoice = voices.find((v) => v.lang.startsWith("en"));
    utterance.voice =
      detectLanguage(text) === "en"
        ? enVoice ?? voices[0]
        : hindiVoice ?? voices[0];
    utterance.rate = 0.9;
    utterance.pitch = 1;
    synth.speak(utterance);
  }, []);

  const processUserInput = useCallback(
    async (userText: string) => {
      if (!userText.trim()) return;
      addMessage("user", userText);
      setIsProcessing(true);

      try {
        const res = await fetch("/api/consultation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stage,
            userInput: userText,
            language: detectLanguage(userText),
            conversationContext,
          }),
        });

        const data = (await res.json()) as {
          response?: string;
          nextStage?: ConsultationStage;
          remedy?: unknown;
        };

        const aiText =
          data.response ?? "I did not understand. Could you repeat?";
        addMessage("ai", aiText);
        setStage((data.nextStage as ConsultationStage) ?? stage);

        if (stage === "symptoms" && data.remedy) {
          setConversationContext((prev) => ({
            ...prev,
            symptoms: userText,
            remedy: data.remedy,
          }));
        } else if (stage === "duration") {
          setConversationContext((prev) => ({ ...prev, duration: userText }));
        } else if (stage === "age") {
          setConversationContext((prev) => ({ ...prev, age: userText }));
        }

        if (!isMuted) speak(aiText);
      } catch {
        addMessage(
          "ai",
          "Sorry, something went wrong. Please try again or consult a doctor."
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [stage, conversationContext, isMuted, addMessage, speak]
  );

  const transcribeAndProcess = useCallback(
    async (blob: Blob) => {
      if (blob.size < 1000) {
        addMessage(
          "ai",
          "That was too short. Please hold the mic button and speak for at least 2 seconds."
        );
        return;
      }
      const formData = new FormData();
      const ext = blob.type.includes("mp4") ? "m4a" : "webm";
      formData.append("audio", blob, `recording.${ext}`);

      try {
        const res = await fetch("/api/whisper", {
          method: "POST",
          body: formData,
        });
        const data = (await res.json()) as {
          text?: string;
          error?: string;
          details?: string;
        };
        if (data.error) {
          addMessage("ai", `Transcription failed: ${data.error}. Please try again.`);
          return;
        }
        if (!data.text || !data.text.trim()) {
          addMessage(
            "ai",
            "I couldn't hear you clearly. Please hold the mic, speak for 2–3 seconds, then release."
          );
          return;
        }
        await processUserInput(data.text);
      } catch {
        addMessage(
          "ai",
          "Could not connect to transcription service. Please try again."
        );
      }
    },
    [processUserInput, addMessage]
  );

  const startRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") return;
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "audio/mp4";
        const recorder = new MediaRecorder(stream, { mimeType });
        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          setIsRecording(false);
          stream.getTracks().forEach((t) => t.stop());
          if (chunksRef.current.length) {
            const blob = new Blob(chunksRef.current, {
              type: recorder.mimeType || "audio/webm",
            });
            transcribeAndProcess(blob);
          } else {
            addMessage(
              "ai",
              "No audio captured. Please allow microphone access and try again."
            );
          }
        };
        recorder.onerror = () => {
          setIsRecording(false);
          stream.getTracks().forEach((t) => t.stop());
          addMessage("ai", "Recording failed. Please try again.");
        };
        recorder.start(250);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      })
      .catch((err) => {
        const msg =
          err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
            ? "Microphone access was denied. Please allow mic access and refresh."
            : err.name === "NotFoundError"
              ? "No microphone found. Please connect a mic and try again."
              : "Could not access microphone. Please check permissions.";
        addMessage("ai", msg);
      });
  }, [transcribeAndProcess, addMessage]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const introDone = useRef(false);
  useEffect(() => {
    if (introDone.current) return;
    introDone.current = true;
    addMessage("ai", INTRO_AI);
    speak(INTRO_AI);
    setStage("symptoms");
  }, [addMessage, speak]);

  useEffect(() => {
    const t = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const handleEndCall = useCallback(() => {
    window.speechSynthesis?.cancel();
    stopRecording();
    onSaveHistory(messagesRef.current);
    onEnd();
  }, [onEnd, onSaveHistory, stopRecording]);

  return (
    <div className="flex h-[calc(100vh-2rem)] max-h-[900px] flex-col rounded-2xl bg-gradient-to-b from-emerald-950/95 to-teal-950/95 shadow-2xl">
      <div className="flex items-center justify-between border-b border-emerald-800/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
          <span className="font-mono text-lg text-emerald-100">
            {formatTime(timerSeconds)}
          </span>
        </div>
        <span className="text-sm text-emerald-200/80">AYUSH AI Consultation</span>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 items-center justify-center gap-8 p-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 ring-2 ring-amber-400/40">
              <span className="text-3xl">🤖</span>
            </div>
            <span className="text-xs text-emerald-200/70">AI Assistant</span>
          </div>
          <div className="h-px w-8 flex-shrink-0 bg-emerald-600/40" />
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/20 to-teal-500/20 ring-2 ring-cyan-400/40">
              <span className="text-3xl">👤</span>
            </div>
            <span className="text-xs text-emerald-200/70">You</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border-t border-emerald-800/30 px-4 py-3">
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-cyan-500/30 text-cyan-50"
                      : "bg-emerald-800/40 text-emerald-50"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-2xl bg-emerald-800/40 px-4 py-2.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-300" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-300 [animation-delay:0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-300 [animation-delay:0.3s]" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center border-t border-emerald-800/50 px-6 py-5">
        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
              isMuted
                ? "bg-amber-500/40 text-amber-200"
                : "bg-emerald-600/60 text-emerald-100 hover:bg-emerald-500/70"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            <svg
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
              {isMuted ? (
                <>
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                </>
              ) : (
                <>
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </>
              )}
            </svg>
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              startRecording();
            }}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchStart={(e) => {
              e.preventDefault();
              startRecording();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              stopRecording();
            }}
            disabled={isProcessing}
            className={`flex h-16 w-16 items-center justify-center rounded-full transition ${
              isRecording
                ? "bg-red-500 text-white animate-pulse"
                : isProcessing
                  ? "bg-zinc-600/50 text-zinc-400 cursor-not-allowed"
                  : "bg-emerald-500 text-white hover:bg-emerald-400"
            }`}
            title="Hold to talk (2–3 seconds)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleEndCall}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/80 text-white transition hover:bg-red-500"
            title="End call"
          >
            <svg
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
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-emerald-300/70 select-none">
          Hold mic 2–3 sec to speak •{" "}
          {isRecording ? "Recording…" : "Release when done"}
        </p>
      </div>
    </div>
  );
}
