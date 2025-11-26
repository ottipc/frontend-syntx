'use client';

import { useState, useEffect } from 'react';
import { Conversation } from '@/types';

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string>('');

  const createNewConversation = (): Conversation => ({
    id: Date.now().toString(),
    title: 'Neue Konversation',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    pinned: false
  });

  useEffect(() => {
    const stored = localStorage.getItem('syntx-conversations');
    
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

  const newChat = () => {
    const newConv = createNewConversation();
    setConversations(prev => [newConv, ...prev]);
    setCurrentConvId(newConv.id);
  };

  const deleteConversation = (id: string) => {
    if (conversations.length === 1) return;
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConvId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      if (remaining.length > 0) setCurrentConvId(remaining[0].id);
    }
  };

  const togglePin = (id: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === id ? { ...conv, pinned: !conv.pinned } : conv
    ));
  };

  const updateTitle = (id: string, title: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === id ? { ...conv, title: title.trim() } : conv
    ));
  };

  return {
    conversations,
    setConversations,
    currentConvId,
    setCurrentConvId,
    newChat,
    deleteConversation,
    togglePin,
    updateTitle
  };
};
