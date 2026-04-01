"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const HISTORY_KEY = "ayush-consultation-history";

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

interface ChatMessage {
  id: string;
  role: "ai" | "user";
  text: string;
  timestamp: number;
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
        };
        const aiText =
          data.response ?? "I did not understand. Could you repeat?";
        addMessage("ai", aiText);
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
        if (typeof window !== "undefined") {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        }
        return updated;
      });
    }
    setInCall(false);
    setSessionId(null);
  }, [stopRecording]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          id: string;
          messages: ChatMessage[];
          date: number;
        }[];
        setHistory(parsed);
      }
    } catch {
      setHistory([]);
    }
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
    const parts = text.split(/(https?:\/\/\S+|\/patient\/appointments)/g);
    return parts.map((part, idx) => {
      const isLink = /^https?:\/\/\S+$/.test(part) || part === "/patient/appointments";
      if (!isLink) return <span key={`${idx}-${part.slice(0, 8)}`}>{part}</span>;
      const href = part;
      return (
        <a
          key={`${idx}-${href}`}
          href={href}
          className="underline text-blue-700"
          onClick={() => setShouldAutoEnd(true)}
        >
          {part}
        </a>
      );
    });
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LEFT: AI Health Consultant + AI messages */}
        <Card className="bg-white shadow-lg border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] transition-all duration-200 rounded-2xl flex flex-col min-h-[420px]">
          <CardHeader className="text-black rounded-t-xl border-b-2 border-[#151616]">
            <CardTitle className="flex items-center gap-2 font-poppins font-bold">
              <MessageSquare className="h-5 w-5" />
              AI Health Consultant
            </CardTitle>
            <CardDescription className="text-black/80 font-poppins">
              {inCall
                ? "AI responses with voice playback — follow the questions"
                : "Experience step-by-step AYUSH health consultation"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col min-h-0">
            {!inCall ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-[#f9c80e]/20 rounded-full p-2 text-[#151616] border border-[#151616]/20">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-bold text-[#151616]">Start consultation</h3>
                    <p className="text-sm text-[#151616]/70 font-poppins">Click &quot;Start Health Consultation&quot; in the right card</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-[#f9c80e]/20 rounded-full p-2 text-[#151616] border border-[#151616]/20">
                    <HeartHandshake className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-bold text-[#151616]">Hold mic to speak</h3>
                    <p className="text-sm text-[#151616]/70 font-poppins">Hold the mic for 2–3 seconds and describe how you feel or your symptoms</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-[#f9c80e]/20 rounded-full p-2 text-[#151616] border border-[#151616]/20">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-bold text-[#151616]">Get remedy & advice</h3>
                    <p className="text-sm text-[#151616]/70 font-poppins">AI will ask symptoms, duration, age, then suggest an Ayurvedic remedy</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 min-h-[280px] max-h-[340px] pr-1">
                {aiMessages.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl px-3 py-2 bg-[#151616]/5 border border-[#151616]/20 text-[#151616] text-sm font-poppins max-w-[95%]"
                  >
                    {renderTextWithLinks(m.text)}
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
          <CardFooter className="border-t-2 border-[#151616] bg-[#FFFFF4] rounded-b-xl">
            {inCall && (
              <p className="text-sm text-[#151616]/60 font-poppins w-full">
                AI responses are read aloud unless muted.
              </p>
            )}
          </CardFooter>
        </Card>

        {/* RIGHT: You + your messages + controls */}
        <Card className="bg-white shadow-lg border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] transition-all duration-200 rounded-2xl flex flex-col min-h-[420px]">
          <CardHeader className="text-[#151616] rounded-t-xl border-b-2 border-[#151616]">
            <CardTitle className="flex items-center gap-2 font-poppins font-bold">
              <Stethoscope className="h-5 w-5" />
              Start Health Consultation
            </CardTitle>
            <CardDescription className="text-[#151616]/80 font-poppins">
              {inCall
                ? "Your messages — hold mic 2–3 sec to speak"
                : "Start a voice consultation with the AYUSH AI"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col min-h-0">
            {!inCall ? (
              <div className="flex flex-col items-center justify-center flex-1 py-8">
                <Button
                  onClick={handleStartConsultation}
                  className="w-full bg-[#f9c80e] text-[#151616] border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:bg-[#f9c80e]/90 hover:translate-y-0.5 font-poppins font-bold rounded-xl py-6"
                >
                  <Stethoscope className="h-5 w-5 mr-2" />
                  Start Health Consultation
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
          <CardFooter className="border-t-2 border-[#151616] bg-[#FFFFF4] text-sm text-[#151616]/60 font-poppins rounded-b-xl">
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
