"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Stethoscope,
  MessageSquare,
  Phone,
  HeartHandshake,
  Mic,
  MicOff,
  PhoneOff,
  History,
  X,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  readConsultationHistoryFromStorage,
  writeConsultationHistoryToStorage,
  saveActiveSession,
  getActiveSession,
  clearActiveSession,
} from "@/lib/consultation-history-storage";

type ConsultationStage =
  | "intro"
  | "language"
  | "feeling"
  | "symptoms"
  | "duration"
  | "age"
  | "remedy"
  | "advice";

type PreferredLang = "en" | "hi" | "mr";

type RecommendedDoctorBrief = {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  yearsOfExperience: number;
};

interface ChatMessage {
  id: string;
  role: "ai" | "user";
  text: string;
  timestamp: number;
  recommendedDoctors?: RecommendedDoctorBrief[];
  consultAction?: "consult_now" | "consult_later";
}

const INTRO_AI = "Hello, I am your AYUSH AI health assistant. Which language do you prefer: English, Hindi, or Marathi?";

export default function MediSupportAyushUI() {
  const [inCall, setInCall] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stage, setStage] = useState<ConsultationStage>("intro");
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLang | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shouldAutoEnd, setShouldAutoEnd] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationContext, setConversationContext] = useState<{
    symptoms?: string;
    duration?: string;
    age?: string;
    remedy?: unknown;
    remedies?: unknown[];
  }>({});
  const [isRecording, setIsRecording] = useState(false);
  const [history, setHistory] = useState<
    { id: string; messages: ChatMessage[]; date: number }[]
  >([]);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;
  const introDone = useRef(false);
  const voicesReadyRef = useRef(false);
  const ttsTimeoutRef = useRef<number | null>(null);

  const addMessage = useCallback(
    (
      role: "ai" | "user",
      text: string,
      meta?: Pick<ChatMessage, "recommendedDoctors" | "consultAction">
    ) => {
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        role,
        text,
        timestamp: Date.now(),
        ...meta,
      };
      setMessages((prev) => [...prev, msg]);
      return msg;
    },
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    // Warm up voices early; some browsers only populate after this.
    synth.getVoices();
    const onChanged = () => {
      voicesReadyRef.current = synth.getVoices().length > 0;
    };
    synth.onvoiceschanged = onChanged;
    onChanged();
    return () => {
      // don't clear if other parts rely on it
      synth.onvoiceschanged = null;
    };
  }, []);

  // Restore active session on mount if exists
  useEffect(() => {
    const activeSession = getActiveSession();
    if (activeSession) {
      setMessages(activeSession.messages as ChatMessage[]);
      setStage(activeSession.stage as ConsultationStage);
      if (activeSession.preferredLanguage) setPreferredLanguage(activeSession.preferredLanguage as PreferredLang);
      if (activeSession.sessionId) setSessionId(activeSession.sessionId);
      setConversationContext(activeSession.conversationContext as Record<string, unknown>);
      setInCall(true);
      clearActiveSession(); // Clear once restored
    }
  }, []);

  const speak = useCallback((text: string, lang?: PreferredLang | null) => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    try {
      // Some browsers start paused until a user gesture; safe to call.
      synth.resume();
    } catch {
      // ignore
    }
    if (ttsTimeoutRef.current) {
      window.clearTimeout(ttsTimeoutRef.current);
      ttsTimeoutRef.current = null;
    }
    synth.cancel();
    setIsSpeaking(false);
    const utterance = new SpeechSynthesisUtterance(text);
    const finish = () => {
      if (ttsTimeoutRef.current) {
        window.clearTimeout(ttsTimeoutRef.current);
        ttsTimeoutRef.current = null;
      }
      setIsSpeaking(false);
    };

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = finish;
    utterance.onerror = finish;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    const useEn = lang === "en" || (!lang && !/[\u0900-\u097F]/.test(text));
    utterance.lang = useEn ? "en-IN" : lang === "mr" ? "mr-IN" : "hi-IN";

    const setVoiceAndSpeak = () => {
      const v = synth.getVoices();
      const mrVoice = v.find((x) => x.lang.toLowerCase().startsWith("mr"));
      const hiVoice = v.find((x) => x.lang.toLowerCase().startsWith("hi"));
      const enVoice =
        v.find((x) => x.lang.toLowerCase().startsWith("en-in")) ??
        v.find((x) => x.lang.toLowerCase().startsWith("en"));
      if (useEn) utterance.voice = enVoice ?? v[0];
      else if (lang === "mr" && mrVoice) utterance.voice = mrVoice;
      else utterance.voice = hiVoice ?? mrVoice ?? v[0];
      synth.speak(utterance);
    };

    // Retry a few times if voices are not ready (Chrome sometimes never fires onvoiceschanged).
    let attempts = 0;
    const trySpeak = () => {
      const voices = synth.getVoices();
      if (voices.length > 0 || voicesReadyRef.current) {
        setVoiceAndSpeak();
        // Failsafe: if browser doesn't fire `onend`, still unlock the mic.
        const maxMs = Math.min(20000, Math.max(4000, text.trim().length * 60));
        ttsTimeoutRef.current = window.setTimeout(() => {
          finish();
        }, maxMs);
        return;
      }
      attempts += 1;
      if (attempts <= 8) setTimeout(trySpeak, 200);
      else {
        setVoiceAndSpeak(); // fallback to default voice
        // Failsafe: if browser doesn't fire `onend`, still unlock the mic.
        const maxMs = Math.min(20000, Math.max(4000, text.trim().length * 60));
        ttsTimeoutRef.current = window.setTimeout(() => {
          finish();
        }, maxMs);
      }
    };
    trySpeak();
  }, []);

  const processUserInput = useCallback(
    async (userText: string) => {
      if (!userText.trim()) return;
      addMessage("user", userText);
      setIsProcessing(true);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch("/api/consultation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            stage,
            userInput: userText,
            language: preferredLanguage ?? undefined,
            sessionId: sessionId ?? undefined,
            conversationContext,
          }),
        });
        const data = (await res.json()) as {
          response?: string;
          nextStage?: ConsultationStage;
          remedy?: unknown;
          remedies?: unknown[];
          preferredLanguage?: PreferredLang;
          endChat?: boolean;
          action?: "consult_now" | "consult_later";
          recommendedDoctors?: RecommendedDoctorBrief[];
        };
        const aiText =
          data.response ?? "I did not understand. Could you repeat?";
        const doctorMeta =
          data.action === "consult_now"
            ? {
                recommendedDoctors: data.recommendedDoctors ?? [],
                consultAction: "consult_now" as const,
              }
            : data.action === "consult_later"
              ? { consultAction: "consult_later" as const }
              : undefined;
        addMessage("ai", aiText, doctorMeta);
        setStage((data.nextStage as ConsultationStage) ?? stage);
        if (data.preferredLanguage) setPreferredLanguage(data.preferredLanguage);
        if (data.remedy || data.remedies) {
          setConversationContext((prev) => ({
            ...prev,
            symptoms: userText,
            remedy: data.remedy,
            remedies: data.remedies ?? (data.remedy ? [data.remedy] : undefined),
          }));
        } else if (stage === "duration") {
          setConversationContext((prev) => ({ ...prev, duration: userText }));
        } else if (stage === "age") {
          setConversationContext((prev) => ({ ...prev, age: userText }));
        }
        if (!isMuted) speak(aiText, data.preferredLanguage ?? preferredLanguage);
        if (data.endChat) setShouldAutoEnd(true);
      } catch {
        addMessage(
          "ai",
          "Sorry, I couldn't get a response in time. Please try again."
        );
      } finally {
        window.clearTimeout(timeout);
        setIsProcessing(false);
      }
    },
    [stage, conversationContext, preferredLanguage, sessionId, isMuted, addMessage, speak]
  );

  // Persist active session whenever messages change during an active call
  useEffect(() => {
    if (inCall && messages.length > 0) {
      saveActiveSession({
        id: sessionId || "temp",
        messages,
        stage,
        preferredLanguage,
        sessionId,
        conversationContext: conversationContext as Record<string, unknown>,
        date: Date.now(),
      });
    }
  }, [messages, inCall, sessionId, stage, preferredLanguage, conversationContext]);

  const transcribeAndProcess = useCallback(
    async (blob: Blob) => {
      if (blob.size < 500) {
        addMessage(
          "ai",
          "That was too short. Please hold the mic for at least 2 seconds and speak clearly."
        );
        return;
      }
      // Guard against oversized recordings that can crash Node during `arrayBuffer()`
      const MAX_BLOB_BYTES = 10 * 1024 * 1024; // 10MB
      if (blob.size > MAX_BLOB_BYTES) {
        addMessage(
          "ai",
          "That recording was too long/large. Please speak for 2–3 seconds, then release the mic."
        );
        return;
      }
      const formData = new FormData();
      const isMp4 = blob.type.includes("mp4");
      const ext = isMp4 ? "m4a" : "webm";
      const file = new File([blob], `recording.${ext}`, {
        type: blob.type || (isMp4 ? "audio/mp4" : "audio/webm"),
      });
      formData.append("audio", file);
      if (preferredLanguage) formData.append("language", preferredLanguage);
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 20000);
        const res = await fetch("/api/whisper", { method: "POST", body: formData, signal: controller.signal });
        const data = (await res.json()) as { text?: string; error?: string };
        if (data.error) {
          addMessage("ai", `Transcription failed: ${data.error}. Please try again.`);
          return;
        }
        const text = (data.text ?? "").trim();
        if (!text) {
          addMessage(
            "ai",
            "I couldn't hear you clearly. Please hold the mic for 2–3 seconds, speak clearly, then release."
          );
          return;
        }
        await processUserInput(text);
      } catch {
        addMessage(
          "ai",
          "Could not connect to transcription service. Please try again."
        );
      } finally {
        // no-op: timeout is scoped; if aborted, fetch throws and we land here anyway
      }
    },
    [processUserInput, addMessage, preferredLanguage]
  );

  const startRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") return;
    if (typeof window !== "undefined") {
      if (!window.isSecureContext) {
        addMessage(
          "ai",
          "Microphone requires a secure context (HTTPS). For local testing, use http://localhost or enable HTTPS, then refresh."
        );
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        addMessage(
          "ai",
          "Microphone is not supported in this browser. Please try Chrome/Edge and allow microphone access."
        );
        return;
      }
    }
    navigator.mediaDevices
      .getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
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
            addMessage("ai", "No audio captured. Please allow microphone and try again.");
          }
        };
        recorder.onerror = () => {
          setIsRecording(false);
          stream.getTracks().forEach((t) => t.stop());
          addMessage("ai", "Recording failed. Please try again.");
        };
        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      })
      .catch((err) => {
        const msg =
          err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError"
            ? "Microphone permission is blocked. Click the lock icon in the address bar → Site settings → Microphone → Allow, then refresh."
            : err?.name === "NotFoundError"
              ? "No microphone device found. Please connect a mic/headset and try again."
              : err?.name === "NotReadableError"
                ? "Microphone is being used by another app. Close Teams/Zoom/Browser tabs using the mic and try again."
                : `Could not access microphone (${err?.name ?? "unknown error"}). Please check browser permissions and try again.`;
        addMessage("ai", msg);
      });
  }, [transcribeAndProcess, addMessage]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  const handleStartConsultation = useCallback(() => {
    setInCall(true);
    setMessages([]);
    setStage("intro");
    setPreferredLanguage(null);
    setSessionId(crypto.randomUUID());
    setConversationContext({});
    setTimerSeconds(0);
    introDone.current = false;
    // Speak immediately on user click so browsers allow audio playback.
    addMessage("ai", INTRO_AI);
    if (!isMuted) speak(INTRO_AI, "en");
    setStage("language");
  }, []);

  const handleEndCall = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (ttsTimeoutRef.current) {
      window.clearTimeout(ttsTimeoutRef.current);
      ttsTimeoutRef.current = null;
    }
    setIsSpeaking(false);
    setIsProcessing(false);
    stopRecording();
    if (messagesRef.current.length > 0) {
      const id = crypto.randomUUID();
      const date = Date.now();
      setHistory((prev) => {
        const updated = [{ id, messages: messagesRef.current, date }, ...prev].slice(0, 50);
        writeConsultationHistoryToStorage(updated);
        return updated;
      });
      // Clear active session when call ends
      clearActiveSession();
    }
    setInCall(false);
    setSessionId(null);
  }, [stopRecording]);

  useEffect(() => {
    const parsed = readConsultationHistoryFromStorage() as {
      id: string;
      messages: ChatMessage[];
      date: number;
    }[];
    setHistory(parsed);
  }, []);

  useEffect(() => {
    // Kept for backwards safety; start message is handled on button click.
    if (!inCall || introDone.current) return;
    introDone.current = true;
  }, [inCall]);

  useEffect(() => {
    if (!inCall) return;
    const t = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [inCall]);

  useEffect(() => {
    if (!shouldAutoEnd) return;
    handleEndCall();
    setShouldAutoEnd(false);
  }, [shouldAutoEnd, handleEndCall]);

  const userMessages = messages.filter((m) => m.role === "user");
  const aiMessages = messages.filter((m) => m.role === "ai");
  const viewingEntry = viewingHistoryId ? history.find((h) => h.id === viewingHistoryId) : null;

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function summaryForHistory(msgs: ChatMessage[]) {
    const firstUser = msgs.find((m) => m.role === "user")?.text;
    if (firstUser) return firstUser.length > 50 ? firstUser.slice(0, 50) + "…" : firstUser;
    return `${msgs.length} message${msgs.length !== 1 ? "s" : ""}`;
  }

  function renderTextWithLinks(text: string) {
    const parts = text.split(/(https?:\/\/\S+|\/patient\/appointments(?:\?[^\s]*)?)/g);
    return parts.map((part, idx) => {
      const isLink =
        /^https?:\/\/\S+$/.test(part) ||
        /^\/patient\/appointments(\?[^\s]*)?$/.test(part);
      if (!isLink) return <span key={`${idx}-${part.slice(0, 8)}`}>{part}</span>;
      const href = part;
      return (
        <Link
          key={`${idx}-${href}`}
          href={href}
          className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900"
        >
          {part.includes("doctorId=")
            ? "Book this doctor"
            : /^\/patient\/appointments$/.test(part)
              ? "Appointments"
              : part}
        </Link>
      );
    });
  }

  const introSteps = [
    {
      n: 1,
      icon: Phone,
      title: "Start consultation",
      body: 'Click "Start Health Consultation" in the right card',
    },
    {
      n: 2,
      icon: HeartHandshake,
      title: "Hold mic to speak",
      body: "Hold the mic for 2–3 seconds and describe how you feel or your symptoms",
    },
    {
      n: 3,
      icon: MessageSquare,
      title: "Get remedy & advice",
      body: "AI will ask symptoms, duration, age, then suggest an Ayurvedic remedy",
    },
  ] as const;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {/* LEFT: AI Health Consultant + AI messages */}
        <Card className="group overflow-hidden bg-white border-2 border-[#151616] shadow-[6px_6px_0px_0px_#151616] hover:shadow-[2px_2px_0px_0px_#151616] hover:translate-y-1 transition-[transform,box-shadow] duration-300 ease-out rounded-2xl flex flex-col min-h-[420px] ring-1 ring-[#151616]/5">
          <CardHeader className="text-black rounded-t-xl border-b-2 border-[#151616] bg-gradient-to-b from-[#FFFFF4] to-white px-6 pb-5 pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-[#151616] bg-[#f9c80e] shadow-[3px_3px_0px_0px_#151616]">
                <MessageSquare className="h-6 w-6 text-[#151616]" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 space-y-1 pt-0.5">
                <p className="text-[#151616]/80 font-poppins text-xs font-semibold uppercase tracking-[0.12em]">
                  How it works
                </p>
                <CardTitle className="font-poppins text-xl font-bold leading-tight tracking-tight text-[#151616]">
                  AI Health Consultant
                </CardTitle>
                <CardDescription className="text-[#151616]/75 font-poppins text-sm leading-relaxed">
                  {inCall
                    ? "AI responses with voice playback — follow the questions"
                    : "Experience step-by-step AYUSH health consultation"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-2 pt-6 flex-1 flex flex-col min-h-0">
            {!inCall ? (
              <div className="relative">
                <div
                  className="pointer-events-none absolute left-[21px] top-11 bottom-11 w-0.5 rounded-full bg-[#f9c80e]/35"
                  aria-hidden
                />
                <ul className="relative space-y-5">
                  {introSteps.map((step, i) => (
                    <motion.li
                      key={step.n}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.35 }}
                      className="flex gap-4"
                    >
                      <div className="relative z-10 shrink-0">
                        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border border-[#151616] bg-white px-1 font-poppins text-[10px] font-bold leading-none text-[#151616] shadow-sm">
                          {step.n}
                        </span>
                        <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#151616] bg-[#f9c80e] text-[#151616] shadow-[3px_3px_0px_0px_#151616]">
                          <step.icon className="h-5 w-5" strokeWidth={2.25} />
                        </span>
                      </div>
                      <div className="min-w-0 pb-0.5 pt-1">
                        <h3 className="font-poppins text-base font-bold leading-snug text-[#151616]">{step.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-[#151616]/70 font-poppins">{step.body}</p>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 min-h-[280px] max-h-[340px] pr-1">
                {aiMessages.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl px-3 py-2 bg-[#151616]/5 border border-[#151616]/20 text-[#151616] text-sm font-poppins max-w-[95%]"
                  >
                    <div className="whitespace-pre-wrap">{renderTextWithLinks(m.text)}</div>
                    {m.consultAction === "consult_now" && (
                        <div className="mt-3 flex flex-col gap-2 border-t border-[#151616]/15 pt-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#151616]/70">
                            Book a doctor
                          </p>
                          {(m.recommendedDoctors ?? []).map((d) => (
                            <Link
                              key={d.id}
                              href={`/patient/appointments?doctorId=${encodeURIComponent(d.id)}`}
                              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-[#151616] bg-[#f9c80e] px-3 py-2 text-center text-sm font-bold text-[#151616] shadow-[2px_2px_0px_0px_#151616] transition-all hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616]"
                            >
                              <Calendar className="h-4 w-4 shrink-0" />
                              <span className="text-left leading-tight">
                                Dr. {d.name.replace(/^Dr\.?\s*/i, "")} — {d.specialization}
                                <span className="mt-0.5 block text-xs font-semibold text-[#151616]/75">
                                  {d.rating.toFixed(1)}★ · {d.yearsOfExperience} yrs
                                </span>
                              </span>
                              <ExternalLink className="h-4 w-4 shrink-0 opacity-80" />
                            </Link>
                          ))}
                          <Link
                            href="/patient/appointments"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#151616]/40 bg-white px-3 py-2 text-center text-xs font-semibold text-[#151616] hover:bg-[#FFFFF4]"
                          >
                            Browse all doctors
                          </Link>
                        </div>
                      )}
                    {m.consultAction === "consult_later" && (
                      <div className="mt-3 flex flex-col gap-2 border-t border-[#151616]/15 pt-3">
                        <Link
                          href="/patient/appointments"
                          className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-[#151616] bg-[#f9c80e] px-3 py-2.5 text-sm font-bold text-[#151616] shadow-[2px_2px_0px_0px_#151616] transition-all hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616]"
                        >
                          <Calendar className="h-4 w-4" />
                          Open Appointments when you&apos;re ready
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex gap-1 rounded-xl bg-[#151616]/5 px-3 py-2 w-fit">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#151616]/60" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#151616]/60 [animation-delay:0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#151616]/60 [animation-delay:0.3s]" />
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t-2 border-[#151616] bg-[#FFFFF4] px-6 py-4 rounded-b-xl">
            {inCall && (
              <p className="text-sm text-[#151616]/60 font-poppins w-full leading-relaxed">
                AI responses are read aloud unless muted.
              </p>
            )}
          </CardFooter>
        </Card>

        {/* RIGHT: You + your messages + controls */}
        <Card className="group overflow-hidden bg-white border-2 border-[#151616] shadow-[6px_6px_0px_0px_#151616] hover:shadow-[2px_2px_0px_0px_#151616] hover:translate-y-1 transition-[transform,box-shadow] duration-300 ease-out rounded-2xl flex flex-col min-h-[420px] ring-1 ring-[#151616]/5">
          <CardHeader className="text-[#151616] rounded-t-xl border-b-2 border-[#151616] bg-gradient-to-b from-[#FFFFF4] to-white px-6 pb-5 pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-[#151616] bg-[#f9c80e] shadow-[3px_3px_0px_0px_#151616]">
                <Stethoscope className="h-6 w-6 text-[#151616]" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 space-y-1 pt-0.5">
                <p className="text-[#151616]/80 font-poppins text-xs font-semibold uppercase tracking-[0.12em]">
                  Voice session
                </p>
                <CardTitle className="font-poppins text-xl font-bold leading-tight tracking-tight text-[#151616]">
                  Start Health Consultation
                </CardTitle>
                <CardDescription className="text-[#151616]/75 font-poppins text-sm leading-relaxed">
                  {inCall
                    ? "Your messages — hold mic 2–3 sec to speak"
                    : "Start a voice consultation with the AYUSH AI"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-2 pt-2 flex-1 flex flex-col min-h-0">
            {!inCall ? (
              <div className="relative flex flex-1 flex-col items-center justify-center py-8">
                <div
                  className="pointer-events-none absolute inset-4 rounded-2xl bg-[radial-gradient(ellipse_at_50%_30%,rgba(249,200,14,0.12),transparent_55%)]"
                  aria-hidden
                />
                <div className="pointer-events-none absolute -right-6 -top-4 h-24 w-24 rounded-full border border-[#f9c80e]/20" aria-hidden />
                <div className="pointer-events-none absolute -bottom-2 -left-4 h-16 w-16 rounded-full border border-[#151616]/10" aria-hidden />
                <Button
                  onClick={handleStartConsultation}
                  className="relative z-10 h-auto w-full max-w-md bg-[#f9c80e] text-[#151616] border-2 border-[#151616] shadow-[5px_5px_0px_0px_#151616] hover:bg-[#f9c80e]/95 hover:shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 active:translate-y-1 active:shadow-none font-poppins font-bold rounded-2xl px-6 py-7 text-base transition-[transform,box-shadow,background-color] duration-200 focus-visible:ring-2 focus-visible:ring-[#151616] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <span className="flex items-center justify-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#151616]/20 bg-white/40">
                      <Stethoscope className="h-5 w-5" strokeWidth={2.25} />
                    </span>
                    <span className="text-left leading-tight">
                      Start Health Consultation
                      <span className="mt-0.5 block text-xs font-semibold text-[#151616]/70">
                        Tap to begin · English, Hindi & Marathi
                      </span>
                    </span>
                  </span>
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-2 min-h-[180px] max-h-[240px] pr-1">
                  {userMessages.length === 0 ? (
                    <p className="text-sm text-[#151616]/50 font-poppins">Your messages will appear here when you speak.</p>
                  ) : (
                    userMessages.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-xl px-3 py-2 bg-[#f9c80e]/20 border border-[#151616]/20 text-[#151616] text-sm font-poppins ml-auto max-w-[95%]"
                      >
                        {m.text}
                      </div>
                    ))
                  )}
                </div>
                <div className="flex items-center justify-center gap-3 pt-4 border-t-2 border-[#151616]/10 mt-4">
                  <Button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full border-2 border-[#151616] bg-white hover:bg-[#f9c80e]/20"
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                  <Button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); startRecording(); }}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                    onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                    onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                    disabled={isProcessing || isSpeaking}
                    className={`h-14 w-14 rounded-full border-2 border-[#151616] shadow-[3px_3px_0px_0px_#151616] ${
                      isRecording ? "bg-red-500 text-white animate-pulse" :
                      isProcessing ? "bg-[#151616]/20 text-[#151616]/50" :
                      "bg-[#f9c80e] text-[#151616] hover:bg-[#f9c80e]/90"
                    }`}
                  >
                    <Mic className="h-6 w-6" />
                  </Button>
                  <Button
                    type="button"
                    onClick={handleEndCall}
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full border-2 border-red-600 bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <PhoneOff className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-xs text-[#151616]/60 font-poppins text-center mt-2">
                  {isRecording
                    ? "Recording… release to send"
                    : isProcessing
                      ? "AI is responding…"
                      : isSpeaking
                        ? "AI is speaking…"
                        : `Call time: ${formatTime(timerSeconds)}`}
                </p>
              </>
            )}
          </CardContent>
          <CardFooter className="border-t-2 border-[#151616] bg-[#FFFFF4] px-6 py-4 text-sm text-[#151616]/65 font-poppins rounded-b-xl leading-relaxed">
            {inCall
              ? "Hold mic 2–3 sec to speak. Supports English, Hindi & Marathi."
              : "Your voice is sent to the AI for AYUSH-based guidance."}
          </CardFooter>
        </Card>
      </div>

      {/* Consultation History */}
      {history.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
          <Card className="bg-white border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] rounded-2xl overflow-hidden">
            <CardHeader className="border-b-2 border-[#151616] bg-[#FFFFF4]">
              <CardTitle className="flex items-center gap-2 font-poppins font-bold text-[#151616]">
                <History className="h-5 w-5" />
                Consultation History
              </CardTitle>
              <CardDescription className="text-[#151616]/70 font-poppins">
                Click a row to view full conversation
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                <AnimatePresence>
                  {history.slice(0, 10).map((h) => (
                    <motion.button
                      key={h.id}
                      type="button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setViewingHistoryId(h.id)}
                      className="w-full text-left rounded-xl bg-[#FFFFF4] border border-[#151616]/20 px-4 py-3 hover:bg-[#f9c80e]/10 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-poppins text-[#151616] line-clamp-2 flex-1 min-w-0">
                          {summaryForHistory(h.messages)}
                        </p>
                        <span className="text-xs font-poppins text-[#151616]/60 whitespace-nowrap">
                          {new Date(h.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                      </div>
                      <p className="text-xs text-[#151616]/50 font-poppins mt-1">Click to view full conversation</p>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      )}

      {/* Full conversation dialog */}
      <Dialog open={!!viewingHistoryId} onOpenChange={(open) => !open && setViewingHistoryId(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col bg-[#FFFFF4] border-2 border-[#151616]">
          <DialogHeader>
            <DialogTitle className="font-poppins text-[#151616]">
              Full consultation
              {viewingEntry && (
                <span className="block text-sm font-normal text-[#151616]/70 mt-1">
                  {new Date(viewingEntry.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-2">
            {viewingEntry?.messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-xl px-3 py-2 text-sm font-poppins ${
                  m.role === "user"
                    ? "bg-[#f9c80e]/20 border border-[#151616]/20 ml-4"
                    : "bg-[#151616]/5 border border-[#151616]/20 mr-4"
                }`}
              >
                <span className="text-xs font-semibold text-[#151616]/70 block mb-1">
                  {m.role === "user" ? "You" : "AI"}
                </span>
                <p className="text-[#151616] whitespace-pre-wrap">{m.text}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2 border-t border-[#151616]/20">
            <Button
              variant="outline"
              onClick={() => setViewingHistoryId(null)}
              className="border-2 border-[#151616] font-poppins"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
