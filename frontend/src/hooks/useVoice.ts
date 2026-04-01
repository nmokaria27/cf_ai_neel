import { useState, useCallback, useRef } from "react";

type VoiceError = "not-allowed" | "no-speech" | "network" | "unsupported" | null;

export function useVoice(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceError, setVoiceError] = useState<VoiceError>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    (window.SpeechRecognition != null || window.webkitSpeechRecognition != null);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setVoiceError("unsupported");
      return;
    }

    setVoiceError(null);
    setInterimTranscript("");

    const SpeechRecognitionAPI = window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setVoiceError("unsupported");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);

      if (final.trim()) {
        onTranscript(final.trim());
        setInterimTranscript("");
        setIsListening(false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("[useVoice] error:", event.error);
      if (event.error === "not-allowed") setVoiceError("not-allowed");
      else if (event.error === "no-speech") setVoiceError("no-speech");
      else if (event.error === "network") setVoiceError("network");
      setIsListening(false);
      setInterimTranscript("");
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isSupported, onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  return {
    isListening,
    interimTranscript,
    voiceError,
    startListening,
    stopListening,
    isSupported,
  };
}
