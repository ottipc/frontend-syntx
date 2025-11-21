'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setResponse('');
    
    try {
      const res = await fetch('https://dev.syntx-system.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          max_new_tokens: 200,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true
        })
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.response || JSON.stringify(data, null, 2));
      
    } catch (error) {
      setResponse(`Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl flex flex-col items-center space-y-8">
        
        {/* Logo */}
        <div className="flex flex-col items-center space-y-4">
          <Image 
            src="/Logo1.png" 
            alt="SYNTX Logo" 
            width={120} 
            height={120}
            className="mb-2"
          />
          
          {/* Titel */}
          <h1 className="text-5xl font-bold text-white">SYNTX</h1>
          
          {/* Subline */}
          <p className="text-xl text-gray-400">SYNTX isn't AI.</p>
          
          {/* Claim */}
          <p className="text-lg text-cyan-400">It's the resonance that governs it</p>
        </div>

        {/* Input Textarea */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Schreib deinen Prompt hier rein..."
          className="w-full h-32 bg-[#1a2332] text-white rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder-gray-500"
        />

        {/* Senden Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-8 py-2 border-2 border-cyan-400 text-cyan-400 rounded-lg hover:bg-cyan-400 hover:text-[#0a0e1a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Wird gesendet...' : 'Senden'}
        </button>

        {/* Response Textarea */}
        <textarea
          value={response}
          readOnly
          placeholder=""
          className="w-full h-64 bg-[#1a2332] text-white rounded-lg px-4 py-3 resize-none focus:outline-none placeholder-gray-500"
        />
      </div>
    </main>
  );
}
