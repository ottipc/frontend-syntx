'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, Download, RotateCcw, Settings, Trash2, Check, Plus, MessageSquare, X,
  Search, Pin, Mic, Moon, Sun, BarChart3, ThumbsUp, ThumbsDown, Command,
  Edit2, Save, Zap, Activity, TrendingUp, Upload, MicOff
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reaction?: 'up' | 'down' | null;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  pinned: boolean;
}

const ParticleBackground = ({ intensity = 50 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
    }> = [];
    
    for (let i = 0; i < intensity; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2
      });
    }
    
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 14, 26, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.5)';
        ctx.fill();
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [intensity]);
  
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

const ResonanceIndicator = ({ messageCount }: { messageCount: number }) => {
  const level = Math.min(messageCount / 10, 1);
  const color = level > 0.7 ? 'bg-green-500' : level > 0.4 ? 'bg-yellow-500' : 'bg-cyan-500';
  
  return (
    <div className="flex items-center gap-2">
      <Activity size={14} className="text-cyan-400" />
      <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${level * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className="text-xs text-gray-500">{Math.round(level * 100)}%</span>
    </div>
  );
};

const ParallaxLogo = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
      style={{
        x: mousePosition.x,
        y: mousePosition.y
      }}
      className="relative"
    >
      <motion.div
        animate={{
          boxShadow: [
            '0 0 20px rgba(6, 182, 212, 0.3)',
            '0 0 40px rgba(6, 182, 212, 0.6)',
            '0 0 20px rgba(6, 182, 212, 0.3)',
          ]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="rounded-2xl p-4 bg-[#0f1419]/50 backdrop-blur-sm border border-cyan-400/20"
      >
        <Image 
          src="/Logo1.png" 
          alt="SYNTX Logo" 
          width={140} 
          height={140}
          className="drop-shadow-[0_0_30px_rgba(6,182,212,0.8)]"
        />
      </motion.div>
    </motion.div>
  );
};

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  
  const [maxTokens, setMaxTokens] = useState(500);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [particleIntensity, setParticleIntensity] = useState(50);
  
  const chatRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const currentConv = conversations.find(c => c.id === currentConvId);
    if (currentConv && currentConv.messages.length > 0) {
      document.title = `${currentConv.title} - SYNTX`;
    } else {
      document.title = 'SYNTX - Resonance System';
    }
  }, [currentConvId, conversations]);

  useEffect(() => {
    const stored = localStorage.getItem('syntx-conversations');
    const storedDarkMode = localStorage.getItem('syntx-darkmode');
    
    if (storedDarkMode !== null) {
      setDarkMode(storedDarkMode === 'true');
    }
    
    if (stored) {
      const parsed = JSON.parse(stored);
      const withDates = parsed.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        tags: conv.tags || [],
        pinned: conv.pinned || false,
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          reaction: msg.reaction || null
        }))
      }));
      setConversations(withDates);
      if (withDates.length > 0) {
        setCurrentConvId(withDates[0].id);
      }
    } else {
      const newConv = createNewConversation();
      setConversations([newConv]);
      setCurrentConvId(newConv.id);
    }
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('syntx-conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('syntx-darkmode', darkMode.toString());
  }, [darkMode]);

  const createNewConversation = (): Conversation => ({
    id: Date.now().toString(),
    title: 'Neue Konversation',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    pinned: false
  });

  const currentConv = conversations.find(c => c.id === currentConvId);
  const messages = currentConv?.messages || [];

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey)) {
        switch(e.key) {
          case 'k':
            e.preventDefault();
            newChat();
            break;
          case '/':
            e.preventDefault();
            setShowSidebar(prev => !prev);
            break;
          case 'f':
            e.preventDefault();
            setShowSearch(prev => !prev);
            break;
          case ',':
            e.preventDefault();
            setShowSettings(prev => !prev);
            break;
          case '?':
            e.preventDefault();
            setShowShortcuts(prev => !prev);
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [prompt]);

  const handleSubmit = async () => {
    if (!prompt.trim() || !currentConv) return;
    
    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: new Date(),
      reaction: null
    };
    
    const updatedMessages = [...currentConv.messages, userMessage];
    
    const newTitle = currentConv.messages.length === 0 
      ? prompt.slice(0, 30) + (prompt.length > 30 ? '...' : '')
      : currentConv.title;
    
    const newTags = [...currentConv.tags];
    const lowerPrompt = prompt.toLowerCase();
    
    if ((lowerPrompt.includes('code') || lowerPrompt.includes('programming') || lowerPrompt.includes('bug')) && !newTags.includes('Coding')) {
      newTags.push('Coding');
    }
    if ((lowerPrompt.includes('idea') || lowerPrompt.includes('brainstorm')) && !newTags.includes('Ideas')) {
      newTags.push('Ideas');
    }
    if ((lowerPrompt.includes('help') || lowerPrompt.includes('problem')) && !newTags.includes('Support')) {
      newTags.push('Support');
    }
    
    setConversations(prev => prev.map(conv => 
      conv.id === currentConvId 
        ? { ...conv, messages: updatedMessages, updatedAt: new Date(), title: newTitle, tags: newTags }
        : conv
    ));
    
    setPrompt('');
    setLoading(true);
    
    try {
      const res = await fetch('https://dev.syntx-system.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          max_new_tokens: maxTokens,
          temperature: temperature,
          top_p: topP,
          do_sample: true
        })
      });

      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'Keine Antwort erhalten.',
        timestamp: new Date(),
        reaction: null
      };
      
      setConversations(prev => prev.map(conv => 
        conv.id === currentConvId 
          ? { ...conv, messages: [...conv.messages, assistantMessage], updatedAt: new Date() }
          : conv
      ));
      
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        timestamp: new Date(),
        reaction: null
      };
      setConversations(prev => prev.map(conv => 
        conv.id === currentConvId 
          ? { ...conv, messages: [...conv.messages, errorMessage] }
          : conv
      ));
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const newChat = () => {
    const newConv = createNewConversation();
    setConversations(prev => [newConv, ...prev]);
    setCurrentConvId(newConv.id);
    setShowSidebar(false);
  };

  const togglePin = (id: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === id ? { ...conv, pinned: !conv.pinned } : conv
    ));
  };

  const deleteConversation = (id: string) => {
    if (conversations.length === 1) return;
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConvId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      if (remaining.length > 0) setCurrentConvId(remaining[0].id);
    }
  };

  const startEditTitle = (conv: Conversation) => {
    setEditingTitle(conv.id);
    setEditTitle(conv.title);
  };

  const saveTitle = (id: string) => {
    if (editTitle.trim()) {
      setConversations(prev => prev.map(conv => 
        conv.id === id ? { ...conv, title: editTitle.trim() } : conv
      ));
    }
    setEditingTitle(null);
    setEditTitle('');
  };

  const reactToMessage = (msgIndex: number, reaction: 'up' | 'down') => {
    setConversations(prev => prev.map(conv => 
      conv.id === currentConvId
        ? { 
            ...conv, 
            messages: conv.messages.map((msg, idx) => 
              idx === msgIndex 
                ? { ...msg, reaction: msg.reaction === reaction ? null : reaction }
                : msg
            )
          }
        : conv
    ));
  };

  const startVoiceInput = () => {
    setVoiceError(null);
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setVoiceError('Speech Recognition nicht unterstützt in diesem Browser. Nutze Chrome, Edge oder Safari.');
      setTimeout(() => setVoiceError(null), 5000);
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
        setVoiceError(null);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setPrompt(prev => prev ? `${prev} ${finalTranscript}` : finalTranscript);
        }
      };
      
      recognition.onerror = (event: any) => {
        if (event.error === 'aborted') return;
        
        setIsRecording(false);
        let errorMsg = 'Fehler bei Spracherkennung';
        
        switch(event.error) {
          case 'not-allowed':
          case 'permission-denied':
            errorMsg = 'Mikrofon-Zugriff verweigert. Bitte erlaube Mikrofon-Zugriff in den Browser-Einstellungen.';
            break;
          case 'no-speech':
            errorMsg = 'Keine Sprache erkannt. Bitte versuche es erneut.';
            break;
          case 'network':
            errorMsg = 'Netzwerkfehler. Nutze Chrome/Edge für beste Ergebnisse.';
            break;
          default:
            errorMsg = `Spracherkennung Fehler: ${event.error}`;
        }
        
        setVoiceError(errorMsg);
        setTimeout(() => setVoiceError(null), 5000);
      };
      
      recognition.start();
    } catch (error) {
      setIsRecording(false);
      setVoiceError('Fehler beim Starten der Spracherkennung.');
      setTimeout(() => setVoiceError(null), 5000);
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const filteredConversations = conversations
    .filter(conv => tagFilter ? conv.tags.includes(tagFilter) : true)
    .filter(conv => 
      searchQuery ? 
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
    )
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const allTags = Array.from(new Set(conversations.flatMap(c => c.tags)));
  
  const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
  const avgResponseLength = conversations.reduce((sum, conv) => {
    const assistantMsgs = conv.messages.filter(m => m.role === 'assistant');
    return sum + assistantMsgs.reduce((s, m) => s + m.content.length, 0);
  }, 0) / conversations.reduce((sum, conv) => 
    sum + conv.messages.filter(m => m.role === 'assistant').length, 0
  ) || 0;

  const positiveReactions = conversations.reduce((sum, conv) => 
    sum + conv.messages.filter(m => m.reaction === 'up').length, 0
  );
  const negativeReactions = conversations.reduce((sum, conv) => 
    sum + conv.messages.filter(m => m.reaction === 'down').length, 0
  );

  const copyLastResponse = () => {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistant) {
      navigator.clipboard.writeText(lastAssistant.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const exportChat = () => {
    if (!currentConv) return;
    const markdown = currentConv.messages.map(m => 
      `### ${m.role === 'user' ? '👤 User' : '🤖 SYNTX'} - ${m.timestamp.toLocaleTimeString()}\n\n${m.content}\n\n---\n\n`
    ).join('');
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syntx-${currentConv.title.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.md`;
    a.click();
  };

  const clearChat = () => {
    if (confirm('Chat-Verlauf wirklich löschen?')) {
      setConversations(prev => prev.map(conv => 
        conv.id === currentConvId ? { ...conv, messages: [], updatedAt: new Date() } : conv
      ));
    }
  };

  const regenerateLastResponse = async () => {
    if (!currentConv) return;
    const lastUser = [...currentConv.messages].reverse().find(m => m.role === 'user');
    if (!lastUser) return;
    setConversations(prev => prev.map(conv => 
      conv.id === currentConvId ? { ...conv, messages: conv.messages.slice(0, -1) } : conv
    ));
    setPrompt(lastUser.content);
    setTimeout(handleSubmit, 100);
  };

  const exportAllData = () => {
    const dataStr = JSON.stringify(conversations, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syntx-backup-${Date.now()}.json`;
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        const withDates = imported.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setConversations(withDates);
        if (withDates.length > 0) setCurrentConvId(withDates[0].id);
        alert('Import erfolgreich!');
      } catch (error) {
        alert('Import fehlgeschlagen. Bitte überprüfe die Datei.');
      }
    };
    reader.readAsText(file);
  };

  const bgClass = darkMode 
    ? 'bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a]'
    : 'bg-gradient-to-br from-gray-50 via-white to-gray-100';

  return (
    <main className={`min-h-screen ${bgClass} flex relative transition-colors duration-500`}>
      <ParticleBackground intensity={particleIntensity} />
      
      <AnimatePresence>
        {voiceError && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-md"
          >
            <p className="text-sm font-medium">{voiceError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className={`${darkMode ? 'bg-[#1a2332]' : 'bg-white'} rounded-2xl p-6 max-w-md w-full border ${darkMode ? 'border-cyan-400/20' : 'border-gray-300'}`}
              onClick={e => e.stopPropagation()}
            >
              <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                ⌨️ Keyboard Shortcuts
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  ['Cmd/Ctrl + K', 'Neuer Chat'],
                  ['Cmd/Ctrl + /', 'Toggle Sidebar'],
                  ['Cmd/Ctrl + F', 'Suche'],
                  ['Cmd/Ctrl + ,', 'Settings'],
                  ['Cmd/Ctrl + ?', 'Diese Hilfe'],
                  ['Cmd/Ctrl + Enter', 'Nachricht senden']
                ].map(([key, desc]) => (
                  <div key={key} className="flex justify-between">
                    <kbd className={`px-2 py-1 rounded ${darkMode ? 'bg-gray-700 text-cyan-400' : 'bg-gray-200 text-gray-700'}`}>
                      {key}
                    </kbd>
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{desc}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAnalytics(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className={`${darkMode ? 'bg-[#1a2332]' : 'bg-white'} rounded-2xl p-6 max-w-2xl w-full border ${darkMode ? 'border-cyan-400/20' : 'border-gray-300'} max-h-[80vh] overflow-y-auto`}
              onClick={e => e.stopPropagation()}
            >
              <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <TrendingUp className="text-cyan-400" />
                Resonance Analytics
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#0f1419]' : 'bg-gray-100'}`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Messages</p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{totalMessages}</p>
                </div>
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#0f1419]' : 'bg-gray-100'}`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Conversations</p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{conversations.length}</p>
                </div>
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#0f1419]' : 'bg-gray-100'}`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Response</p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{Math.round(avgResponseLength)}</p>
                </div>
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#0f1419]' : 'bg-gray-100'}`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tags</p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{allTags.length}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className={`text-sm font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Reactions</h4>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <ThumbsUp size={16} className="text-green-400" />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{positiveReactions}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ThumbsDown size={16} className="text-red-400" />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{negativeReactions}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={exportAllData}
                  className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Download size={16} />
                  Export All Data
                </button>
                <label className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer">
                  <Upload size={16} />
                  Import Data
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                  />
                </label>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setShowSidebar(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className={`fixed left-0 top-0 h-full w-80 ${darkMode ? 'bg-[#0f1419]' : 'bg-white'} border-r ${darkMode ? 'border-cyan-400/20' : 'border-gray-300'} z-50 flex flex-col`}
            >
              <div className={`p-4 border-b ${darkMode ? 'border-cyan-400/20' : 'border-gray-300'} flex justify-between items-center`}>
                <h2 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Konversationen</h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className={`md:hidden p-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <X size={20} />
                </button>
              </div>
              
              {showSearch && (
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Suche..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg ${darkMode ? 'bg-[#1a2332] text-white border-cyan-400/20' : 'bg-gray-100 text-gray-900 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-cyan-400`}
                    autoFocus
                  />
                </div>
              )}
              
              {allTags.length > 0 && (
                <div className="p-2 flex flex-wrap gap-1">
                  <button
                    onClick={() => setTagFilter(null)}
                    className={`px-2 py-1 rounded text-xs ${
                      !tagFilter 
                        ? 'bg-cyan-600 text-white' 
                        : darkMode ? 'bg-[#1a2332] text-gray-400' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    All
                  </button>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setTagFilter(tag)}
                      className={`px-2 py-1 rounded text-xs ${
                        tagFilter === tag 
                          ? 'bg-cyan-600 text-white' 
                          : darkMode ? 'bg-[#1a2332] text-gray-400' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto p-2">
                {filteredConversations.map(conv => (
                  <div
                    key={conv.id}
                    className={`group p-3 rounded-lg mb-2 cursor-pointer transition-all ${
                      conv.id === currentConvId 
                        ? darkMode 
                          ? 'bg-cyan-600/20 border border-cyan-400/30' 
                          : 'bg-cyan-100 border border-cyan-300'
                        : darkMode 
                          ? 'bg-[#1a2332] hover:bg-[#243447]' 
                          : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    onClick={() => {
                      setCurrentConvId(conv.id);
                      setShowSidebar(false);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        {conv.pinned && <Pin size={12} className="text-cyan-400" />}
                        {editingTitle === conv.id ? (
                          <div className="flex-1 flex gap-1" onClick={e => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveTitle(conv.id);
                                if (e.key === 'Escape') setEditingTitle(null);
                              }}
                              className={`flex-1 px-2 py-1 text-xs rounded ${
                                darkMode ? 'bg-[#0f1419] text-white' : 'bg-white text-gray-900'
                              } border border-cyan-400/30 focus:outline-none`}
                              autoFocus
                            />
                            <button
                              onClick={() => saveTitle(conv.id)}
                              className="p-1 text-green-400 hover:text-green-300"
                            >
                              <Save size={14} />
                            </button>
                          </div>
                        ) : (
                          <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {conv.title}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditTitle(conv);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(conv.id);
                          }}
                          className={`opacity-0 group-hover:opacity-100 p-1 ${
                            conv.pinned ? 'text-cyan-400' : darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          <Pin size={14} />
                        </button>
                        {conversations.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conv.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className={`text-xs mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                      {conv.messages.length} Messages · {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                    {conv.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {conv.tags.map(tag => (
                          <span
                            key={tag}
                            className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-cyan-600/30 text-cyan-300' : 'bg-cyan-200 text-cyan-700'}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className={`p-4 border-t ${darkMode ? 'border-cyan-400/20' : 'border-gray-300'}`}>
                <button
                  onClick={newChat}
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Plus size={18} />
                  Neue Konversation
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col items-center px-4 py-6 relative z-10">
        <div className="w-full max-w-6xl flex flex-col h-screen">
          
          <div className="flex flex-col items-center mb-4 md:mb-8">
            <div className="flex items-center gap-3 mb-4 md:mb-8 w-full justify-between">
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSidebar(true)}
                  className={`p-2.5 ${darkMode ? 'bg-[#1a2332] hover:bg-[#243447] text-cyan-400' : 'bg-white hover:bg-gray-100 text-cyan-600'} rounded-xl transition-all backdrop-blur-sm border ${darkMode ? 'border-cyan-400/20' : 'border-gray-300'} shadow-lg hover:shadow-cyan-500/20`}
                >
                  <MessageSquare size={20} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSearch(prev => !prev)}
                  className={`p-2.5 ${darkMode ? 'bg-[#1a2332] hover:bg-[#243447] text-cyan-400' : 'bg-white hover:bg-gray-100 text-cyan-600'} rounded-xl transition-all backdrop-blur-sm border ${darkMode ? 'border-cyan-400/20' : 'border-gray-300'} shadow-lg hover:shadow-cyan-500/20`}
                >
                  <Search size={20} />
                </motion.button>
              </div>
              
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDarkMode(prev => !prev)}
                  className={`p-2.5 ${darkMode ? 'bg-[#1a2332] hover:bg-[#243447] text-cyan-400' : 'bg-white hover:bg-gray-100 text-cyan-600'} rounded-xl transition-all backdrop-blur-sm border ${darkMode ? 'border-cyan-400/20' : 'border-gray-300'} shadow-lg hover:shadow-cyan-500/20`}
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={newChat}
                  className={`p-2.5 ${darkMode ? 'bg-[#1a2332] hover:bg-[#243447] text-cyan-400' : 'bg-white hover:bg-gray-100 text-cyan-600'} rounded-xl transition-all backdrop-blur-sm border ${darkMode ? 'border-cyan-400/20' : 'border-gray-300'} shadow-lg hover:shadow-cyan-500/20`}
                >
                  <Plus size={20} />
                </motion.button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 mb-3 md:gap-6 md:mb-6">
              <ParallaxLogo />
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-center"
              >
                <h1 className={`text-4xl md:text-6xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'} tracking-tight`}
                    style={{
                      textShadow: darkMode ? '0 0 30px rgba(6, 182, 212, 0.3)' : 'none'
                    }}>
                  SYNTX
                </h1>
                <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-medium mb-4`}>
                  SYNTX isn't AI.
                </p>
                <motion.p 
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="text-cyan-400 text-base italic font-light"
                >
                  It's the resonance that governs it
                </motion.p>
              </motion.div>
            </div>
            
            {messages.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4"
              >
                <ResonanceIndicator messageCount={messages.length} />
              </motion.div>
            )}
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex gap-3 flex-wrap justify-center"
            >
              {[
                { icon: Settings, onClick: () => setShowSettings(!showSettings), title: 'Settings' },
                { icon: BarChart3, onClick: () => setShowAnalytics(true), title: 'Analytics' },
                { icon: Command, onClick: () => setShowShortcuts(true), title: 'Shortcuts' },
                { icon: copied ? Check : Copy, onClick: copyLastResponse, title: 'Copy Last' },
                { icon: RotateCcw, onClick: regenerateLastResponse, title: 'Regenerate', disabled: messages.length === 0 },
                { icon: Download, onClick: exportChat, title: 'Export', disabled: messages.length === 0 },
                { icon: Trash2, onClick: clearChat, title: 'Clear', disabled: messages.length === 0, danger: true },
              ].map(({ icon: Icon, onClick, title, disabled, danger }, idx) => (
                <motion.button
                  key={title}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + idx * 0.05 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClick}
                  disabled={disabled}
                  className={`p-3 rounded-xl transition-all backdrop-blur-sm border shadow-lg disabled:opacity-30 ${
                    danger 
                      ? darkMode 
                        ? 'bg-[#1a2332] hover:bg-red-900 text-red-400 border-red-400/20 hover:shadow-red-500/20' 
                        : 'bg-white hover:bg-red-100 text-red-500 border-red-300 hover:shadow-red-500/20'
                      : darkMode 
                        ? 'bg-[#1a2332] hover:bg-[#243447] text-cyan-400 border-cyan-400/20 hover:shadow-cyan-500/20' 
                        : 'bg-white hover:bg-gray-100 text-cyan-600 border-gray-300 hover:shadow-cyan-500/20'
                  }`}
                  title={title}
                >
                  <Icon size={18} />
                </motion.button>
              ))}
            </motion.div>
          </div>

          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`${darkMode ? 'bg-[#1a2332]' : 'bg-white'} rounded-xl p-4 mb-4 border ${darkMode ? 'border-cyan-400/20' : 'border-gray-300'} backdrop-blur-sm`}
              >
                <h3 className={`font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Zap className="text-cyan-400" size={18} />
                  Settings
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className={`text-sm block mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Max Tokens: {maxTokens}
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="2000"
                      step="50"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(Number(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                  <div>
                    <label className={`text-sm block mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Temperature: {temperature}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(Number(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                  <div>
                    <label className={`text-sm block mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Top P: {topP}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={topP}
                      onChange={(e) => setTopP(Number(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                  <div>
                    <label className={`text-sm block mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Particles: {particleIntensity}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      value={particleIntensity}
                      onChange={(e) => setParticleIntensity(Number(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-hidden min-h-0">
            <div 
              ref={chatRef}
              className="h-full overflow-y-auto custom-scrollbar px-2"
            >
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className={`text-lg mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                      Noch keine Konversation
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-600' : 'text-gray-500'}`}>
                      Starte eine Unterhaltung mit SYNTX...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pb-4">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                        <div className={`text-xs mb-1 flex items-center gap-2 ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className={darkMode ? 'text-gray-500' : 'text-gray-600'}>
                            {msg.role === 'user' ? '👤 You' : '🤖 SYNTX'} · {msg.timestamp.toLocaleTimeString()}
                          </span>
                          {msg.role === 'assistant' && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => reactToMessage(idx, 'up')}
                                className={`p-1 rounded ${
                                  msg.reaction === 'up' 
                                    ? 'text-green-400' 
                                    : darkMode ? 'text-gray-500 hover:text-green-400' : 'text-gray-400 hover:text-green-500'
                                }`}
                              >
                                <ThumbsUp size={14} />
                              </button>
                              <button
                                onClick={() => reactToMessage(idx, 'down')}
                                className={`p-1 rounded ${
                                  msg.reaction === 'down' 
                                    ? 'text-red-400' 
                                    : darkMode ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
                                }`}
                              >
                                <ThumbsDown size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className={`rounded-2xl p-4 ${
                          msg.role === 'user' 
                            ? 'bg-cyan-600 text-white' 
                            : darkMode 
                              ? 'bg-[#1a2332] text-gray-200 border border-cyan-400/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                              : 'bg-white text-gray-900 border border-gray-300 shadow-md'
                        } backdrop-blur-sm`}>
                          {msg.role === 'assistant' ? (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({node, inline, className, children, ...props}: any) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  return !inline && match ? (
                                    <SyntaxHighlighter
                                      style={vscDarkPlus}
                                      language={match[1]}
                                      PreTag="div"
                                      {...props}
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code className={`px-1.5 py-0.5 rounded text-sm ${
                                      darkMode ? 'bg-gray-700 text-cyan-300' : 'bg-gray-200 text-cyan-700'
                                    }`} {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                p: ({children}) => <p className="leading-relaxed mb-2 last:mb-0">{children}</p>,
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          ) : (
                            <p className="leading-relaxed">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className={`rounded-2xl p-4 backdrop-blur-sm ${
                        darkMode 
                          ? 'bg-[#1a2332] border border-cyan-400/20' 
                          : 'bg-white border border-gray-300'
                      }`}>
                        <div className="flex gap-2">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-none mt-4">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nachricht an SYNTX... (Cmd/Ctrl+Enter zum Senden)"
                className={`w-full min-h-[60px] max-h-[200px] rounded-xl px-6 py-4 pr-36 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400 text-base leading-relaxed border backdrop-blur-sm ${
                  darkMode 
                    ? 'bg-[#1a2332] text-white placeholder-gray-500 border-cyan-400/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                    : 'bg-white text-gray-900 placeholder-gray-400 border-gray-300 shadow-md'
                }`}
                disabled={loading || isRecording}
                rows={1}
              />
              
              <div className="absolute bottom-4 right-4 flex gap-2">
                {isRecording ? (
                  <button
                    onClick={stopVoiceInput}
                    className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all font-medium text-sm flex items-center gap-2 animate-pulse shadow-lg shadow-red-500/50"
                    title="Stop Recording"
                  >
                    <MicOff size={18} />
                    <span className="hidden sm:inline">Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={startVoiceInput}
                    disabled={loading}
                    className="px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all disabled:opacity-30 font-medium text-sm flex items-center gap-2"
                    title="Voice Input (Continuous)"
                  >
                    <Mic size={18} />
                    <span className="hidden sm:inline">Sprechen</span>
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={loading || !prompt.trim() || isRecording}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed font-medium text-sm shadow-lg shadow-cyan-500/50"
                >
                  {loading ? 'Sendet...' : 'Senden'}
                </button>
              </div>
            </div>
            
            <p className={`text-xs mt-2 text-center ${darkMode ? 'text-gray-600' : 'text-gray-500'}`}>
              Cmd/Ctrl+Enter zum Senden · {messages.length} Messages · {conversations.length} Konversationen
              {isRecording && <span className="ml-2 text-red-400 animate-pulse">● Aufnahme läuft...</span>}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
