import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { HealthRecord, Livestock } from '@/types/database';

type Message = { role: 'user' | 'assistant'; content: string };

interface UseAIChatOptions {
  type?: 'chat' | 'health-analysis';
  healthRecords?: HealthRecord[];
  animalInfo?: Partial<Livestock>;
}

interface FarmAssistantRequestBody {
  messages: Message[];
  type: 'chat' | 'health-analysis';
  healthRecords?: HealthRecord[];
  animalInfo?: Partial<Livestock>;
}

export function useAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/farm-assistant`;

  const sendMessage = useCallback(async (
    input: string, 
    options: UseAIChatOptions = {}
  ) => {
    const userMsg: Message = { role: 'user', content: input };
    
    if (options.type !== 'health-analysis') {
      setMessages(prev => [...prev, userMsg]);
    }
    
    setIsLoading(true);

    let assistantSoFar = '';

    const upsertAssistant = (nextChunk: string) => {
      assistantSoFar += nextChunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      const body: FarmAssistantRequestBody = {
        messages: options.type === 'health-analysis' ? [] : [...messages, userMsg],
        type: options.type || 'chat',
      };

      if (options.healthRecords) {
        body.healthRecords = options.healthRecords;
      }
      if (options.animalInfo) {
        body.animalInfo = options.animalInfo;
      }

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${resp.status}`);
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get AI response');
      // Remove the user message if it failed
      if (options.type !== 'health-analysis') {
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
    }

    return assistantSoFar;
  }, [messages, CHAT_URL]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}
