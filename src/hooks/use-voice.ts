import { useEffect, useRef, useState } from "react";

interface Recognition {
  continuous: boolean; interimResults: boolean; lang: string;
  onresult: ((event: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
}
export function voiceError(code: string) {
  return code === "not-allowed" || code === "service-not-allowed" ? "Microphone access wasn't allowed. You can type your idea instead."
    : code === "no-speech" ? "I didn't catch any words. Try speaking again, or type your idea."
    : code === "audio-capture" ? "I couldn't find a microphone. You can type your idea instead."
    : "Speech capture isn't available just now. Your typed idea will still work.";
}
export function useVoice(onWords: (words: string) => void) {
  const [supported, setSupported] = useState(false), [listening, setListening] = useState(false), [error, setError] = useState<string | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const callback = useRef(onWords); callback.current = onWords;
  useEffect(() => {
    const browser = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Constructor) return;
    const r = new Constructor(); recognition.current = r; setSupported(true);
    r.continuous = false; r.interimResults = false; r.lang = navigator.language || "en-GB";
    r.onresult = (event) => {
      const words = Array.from(event.results).filter((result) => result.isFinal).map((result) => result[0].transcript).join(" ").trim();
      if (words) callback.current(words);
    };
    r.onerror = (event) => { setError(voiceError(event.error)); setListening(false); };
    r.onend = () => setListening(false);
    return () => { r.onresult = null; r.onerror = null; r.onend = null; r.abort(); recognition.current = null; };
  }, []);
  return { supported, listening, error, toggle: () => {
    setError(null);
    if (listening) { recognition.current?.stop(); return; }
    try { recognition.current?.start(); setListening(true); } catch { setError(voiceError("unavailable")); }
  } };
}