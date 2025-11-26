'use client';

import { useState, useRef } from 'react';

export const useVoiceInput = (onTranscript: (text: string) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const startRecording = () => {
    setError(null);
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech Recognition nicht unterstützt in diesem Browser.');
      setTimeout(() => setError(null), 5000);
      return;
    }
    
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.lang = 'de-DE';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setIsRecording(true);
        setError(null);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }
        
        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      };
      
      recognition.onerror = (event: any) => {
        if (event.error === 'aborted') return;
        
        setIsRecording(false);
        let errorMsg = 'Fehler bei Spracherkennung';
        
        switch(event.error) {
          case 'not-allowed':
          case 'permission-denied':
            errorMsg = 'Mikrofon-Zugriff verweigert.';
            break;
          case 'no-speech':
            errorMsg = 'Keine Sprache erkannt.';
            break;
          case 'network':
            errorMsg = 'Netzwerkfehler. Nutze Chrome/Edge.';
            break;
        }
        
        setError(errorMsg);
        setTimeout(() => setError(null), 5000);
      };
      
      recognition.start();
    } catch (error) {
      setIsRecording(false);
      setError('Fehler beim Starten der Spracherkennung.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  return {
    isRecording,
    error,
    startRecording,
    stopRecording
  };
};
