'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Download, RotateCcw, Settings, Trash2, Check, Plus, MessageSquare, X } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Settings
  const [maxTokens, setMaxTokens] = useState(500);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  
  const chatRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // LocalStorage Persistenz-Strom
  useEffect(() => {
    const stored = localStorage.getItem('syntx-conversations');
    if (stored) {
      const parsed = JSON.parse(stored);
      const withDates = parsed.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
      setConversations(withDates);
      if (withDates.length > 0) {
        setCurrentConvId(withDates[0].id);
      }
    } else {
      // Initialer Strom
      const newConv = createNewConversation();
      setConversations([newConv]);
      setCurrentConvId(newConv.id);
    }
  }, []);

  // Speicher-Strom bei Änderungen
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('syntx-conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  const createNewConversation = (): Conversation => ({
    id: Date.now().toString(),
    title: 'Neue Konversation',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const currentConv = conversations.find(c => c.id === currentConvId);
  const messages = currentConv?.messages || [];

  // Auto-Scroll Resonanz
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-Resize Textarea
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
      timestamp: new Date()
    };
    
    const updatedMessages = [...currentConv.messages, userMessage];
    
    // Titel-Generierung aus erstem Prompt
    const newTitle = currentConv.messages.length === 0 
      ? prompt.slice(0, 30) + (prompt.length > 30 ? '...' : '')
      : currentConv.title;
    
    setConversations(prev => prev.map(conv => 
      conv.id === currentConvId 
        ? { ...conv, messages: updatedMessages, updatedAt: new Date(), title: newTitle }
        : conv
    ));
    
    setPrompt('');
    setLoading(true);
    
    try {
      const res = await fetch('https://dev.syntx-system.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          max_new_tokens: maxTokens,
          temperature: temperature,
          top_p: topP,
          do_sample: true
        })
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'Keine Antwort erhalten.',
        timestamp: new Date()
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
        timestamp: new Date()
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

  const deleteConversation = (id: string) => {
    if (conversations.length === 1) return;
    
    setConversations(prev => prev.filter(c => c.id !== id));
    
    if (currentConvId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      if (remaining.length > 0) {
        setCurrentConvId(remaining[0].id);
      }
    }
  };

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
        conv.id === currentConvId 
          ? { ...conv, messages: [], updatedAt: new Date() }
          : conv
      ));
    }
  };

  const regenerateLastResponse = async () => {
    if (!currentConv) return;
    const lastUser = [...currentConv.messages].reverse().find(m => m.role === 'user');
    if (!lastUser) return;
    
    setConversations(prev => prev.map(conv => 
      conv.id === currentConvId 
        ? { ...conv, messages: conv.messages.slice(0, -1) }
        : conv
    ));
    
    setPrompt(lastUser.content);
    setTimeout(handleSubmit, 100);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a] flex">
      
      {/* Sidebar */}
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
              className="fixed left-0 top-0 h-full w-80 bg-[#0f1419] border-r border-cyan-400/20 z-50 flex flex-col"
            >
              <div className="p-4 border-b border-cyan-400/20 flex justify-between items-center">
                <h2 className="text-white font-bold">Konversationen</h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="md:hidden p-2 text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2">
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    className={`group p-3 rounded-lg mb-2 cursor-pointer transition-all ${
                      conv.id === currentConvId 
                        ? 'bg-cyan-600/20 border border-cyan-400/30' 
                        : 'bg-[#1a2332] hover:bg-[#243447]'
                    }`}
                    onClick={() => {
                      setCurrentConvId(conv.id);
                      setShowSidebar(false);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{conv.title}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {conv.messages.length} Messages · {new Date(conv.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
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
                ))}
              </div>
              
              <div className="p-4 border-t border-cyan-400/20">
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-4 py-6">
        <div className="w-full max-w-6xl flex flex-col h-[calc(100vh-3rem)]">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-4 relative">
            <div className="flex items-center gap-4 mb-3 w-full justify-between">
              <button
                onClick={() => setShowSidebar(true)}
                className="p-2 bg-[#1a2332] hover:bg-[#243447] text-cyan-400 rounded-lg transition-all"
              >
                <MessageSquare size={18} />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Image 
                    src="/Logo1.png" 
                    alt="SYNTX Logo" 
                    width={80} 
                    height={80}
                    className="drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                  />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">SYNTX</h1>
                  <p className="text-sm text-gray-400">SYNTX isn't AI.</p>
                </div>
              </div>
              
              <button
                onClick={newChat}
                className="p-2 bg-[#1a2332] hover:bg-[#243447] text-cyan-400 rounded-lg transition-all"
                title="Neue Konversation"
              >
                <Plus size={18} />
              </button>
            </div>
            
            <p className="text-cyan-400 text-sm mb-3 italic">It's the resonance that governs it</p>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-[#1a2332] hover:bg-[#243447] text-cyan-400 rounded-lg transition-all"
                title="Settings"
              >
                <Settings size={18} />
              </button>
              <button
                onClick={copyLastResponse}
                className="p-2 bg-[#1a2332] hover:bg-[#243447] text-cyan-400 rounded-lg transition-all"
                title="Copy Last Response"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
              <button
                onClick={regenerateLastResponse}
                disabled={messages.length === 0}
                className="p-2 bg-[#1a2332] hover:bg-[#243447] text-cyan-400 rounded-lg transition-all disabled:opacity-30"
                title="Regenerate"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={exportChat}
                disabled={messages.length === 0}
                className="p-2 bg-[#1a2332] hover:bg-[#243447] text-cyan-400 rounded-lg transition-all disabled:opacity-30"
                title="Export Chat"
              >
                <Download size={18} />
              </button>
              <button
                onClick={clearChat}
                disabled={messages.length === 0}
                className="p-2 bg-[#1a2332] hover:bg-red-900 text-red-400 rounded-lg transition-all disabled:opacity-30"
                title="Clear Chat"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#1a2332] rounded-xl p-4 mb-4 border border-cyan-400/20"
              >
                <h3 className="text-white font-bold mb-3">Settings</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Max Tokens: {maxTokens}</label>
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
                    <label className="text-gray-400 text-sm block mb-1">Temperature: {temperature}</label>
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
                    <label className="text-gray-400 text-sm block mb-1">Top P: {topP}</label>
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Area */}
          <div className="flex-1 overflow-hidden">
            <div 
              ref={chatRef}
              className="h-full overflow-y-auto custom-scrollbar px-2"
            >
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-gray-500 text-lg mb-2">Noch keine Konversation</p>
                    <p className="text-gray-600 text-sm">Starte eine Unterhaltung mit SYNTX...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pb-4">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                        <div className={`text-xs text-gray-500 mb-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                          {msg.role === 'user' ? '👤 You' : '🤖 SYNTX'} · {msg.timestamp.toLocaleTimeString()}
                        </div>
                        <div className={`rounded-2xl p-4 ${
                          msg.role === 'user' 
                            ? 'bg-cyan-600 text-white' 
                            : 'bg-[#1a2332] text-gray-200 border border-cyan-400/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                        }`}>
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
                                    <code className="bg-gray-700 px-1.5 py-0.5 rounded text-cyan-300 text-sm" {...props}>
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
                      <div className="bg-[#1a2332] rounded-2xl p-4 border border-cyan-400/20">
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

          {/* Input Area */}
          <div className="flex-none mt-4">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nachricht an SYNTX... (Cmd/Ctrl+Enter zum Senden)"
                className="w-full min-h-[60px] max-h-[200px] bg-[#1a2332] text-white rounded-xl px-6 py-4 pr-28 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder-gray-500 text-base leading-relaxed border border-cyan-400/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                disabled={loading}
                rows={1}
              />
              
              <button
                onClick={handleSubmit}
                disabled={loading || !prompt.trim()}
                className="absolute bottom-4 right-4 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed font-medium text-sm shadow-lg shadow-cyan-500/50"
              >
                {loading ? 'Sendet...' : 'Senden'}
              </button>
            </div>
            
            <p className="text-gray-600 text-xs mt-2 text-center">
              Cmd/Ctrl+Enter zum Senden · {messages.length} Messages · {conversations.length} Konversationen
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
