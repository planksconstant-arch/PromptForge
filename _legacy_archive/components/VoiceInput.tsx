import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    isListening?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript }) => {
    const [listening, setListening] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new (window as any).webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                onTranscript(transcript);
                setListening(false);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setListening(false);
            };

            recognition.onend = () => {
                setListening(false);
            };

            setRecognition(recognition);
        }
    }, [onTranscript]);

    const toggleListening = () => {
        if (listening) {
            recognition?.stop();
        } else {
            recognition?.start();
            setListening(true);
        }
    };

    if (!recognition) {
        return null; // Browser doesn't support speech recognition
    }

    return (
        <button
            onClick={toggleListening}
            className={`p-2 rounded-lg transition-all duration-300 ${listening
                    ? 'bg-red-500/20 text-red-400 animate-pulse ring-1 ring-red-500/50'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
            title={listening ? "Stop Listening" : "Start Voice Input"}
        >
            {listening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
    );
};
