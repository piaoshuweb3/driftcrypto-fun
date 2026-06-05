'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Sparkles, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useI18n } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ---------------------------------------------------------------------------
// Helper: generate unique ID
// ---------------------------------------------------------------------------

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Message Bubble
// ---------------------------------------------------------------------------

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <Avatar className="size-7 shrink-0 mt-0.5">
        <AvatarFallback
          className={
            isUser
              ? 'bg-gold/20 text-gold text-xs'
              : 'bg-card border border-border/50 text-foreground text-xs'
          }
        >
          {isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
        </AvatarFallback>
      </Avatar>

      {/* Bubble */}
      <div
        className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-gold/15 border border-gold/20 text-foreground rounded-tr-md'
            : 'bg-card border border-border/50 text-foreground rounded-tl-md'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <span
          className={`block text-[10px] mt-1.5 ${
            isUser ? 'text-gold/50 text-right' : 'text-muted-foreground'
          }`}
        >
          {message.timestamp.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Typing Indicator
// ---------------------------------------------------------------------------

function TypingIndicator({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-start gap-2.5"
    >
      <Avatar className="size-7 shrink-0 mt-0.5">
        <AvatarFallback className="bg-card border border-border/50 text-foreground text-xs">
          <Bot className="size-3.5" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-card border border-border/50 rounded-2xl rounded-tl-md px-3.5 py-2.5">
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            <span className="size-1.5 rounded-full bg-gold/60 animate-bounce [animation-delay:0ms]" />
            <span className="size-1.5 rounded-full bg-gold/60 animate-bounce [animation-delay:150ms]" />
            <span className="size-1.5 rounded-full bg-gold/60 animate-bounce [animation-delay:300ms]" />
          </div>
          <span className="text-xs text-muted-foreground ml-1">{text}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AIChatSection() {
  const { t, locale } = useI18n();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);

  // Add welcome message on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setMessages([
      {
        id: uid(),
        role: 'assistant',
        content: t('aiChat.welcomeMessage'),
        timestamp: new Date(),
      },
    ]);
  }, [t]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Send message handler
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setError(null);

    const userMessage: ChatMessage = {
      id: uid(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Build history from messages (exclude welcome message if desired)
      const history = messages
        .filter((m) => m.id !== messages[0]?.id || messages.length > 1)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history,
          locale,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const data = await res.json();

      const aiMessage: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: data.message || (locale === 'zh' ? '抱歉，未能获取回复。' : 'Sorry, no response received.'),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('AI Chat error:', err);
      setError(locale === 'zh' ? '请求失败，请重试。' : 'Request failed. Please try again.');

      const errorMessage: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content:
          locale === 'zh'
            ? '抱歉，我暂时无法回复您的消息。请稍后再试。这并非投资建议。'
            : 'I apologize, but I am currently unable to respond. Please try again later. This is not financial advice.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, locale]);

  // Keyboard handler: Enter to send, Shift+Enter for newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Retry last user message
  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      setInput(lastUserMsg.content);
      // Remove the last error AI message and the user message for retry
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === lastUserMsg.id);
        return prev.slice(0, idx);
      });
    }
  };

  return (
    <Card className="bg-card border-border/50 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <div className="size-7 rounded-lg bg-gold/10 flex items-center justify-center">
            <Bot className="size-4 text-gold" />
          </div>
          <span>{t('aiChat.title')}</span>
          <span className="text-muted-foreground font-normal text-xs">
            {t('aiChat.subtitle')}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-4">
        {/* Chat area */}
        <div
          ref={scrollRef}
          className="max-h-[400px] overflow-y-auto pr-1 custom-scrollbar space-y-3 mb-3"
        >
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>

          {isLoading && (
            <TypingIndicator text={t('aiChat.thinking')} />
          )}
        </div>

        {/* Error + Retry */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-2 px-2 py-1.5 rounded-lg bg-bearish/10 border border-bearish/20"
          >
            <span className="text-xs text-bearish">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              className="h-6 px-2 text-xs text-bearish hover:text-bearish hover:bg-bearish/10"
            >
              <RotateCcw className="size-3 mr-1" />
              {t('common.retry')}
            </Button>
          </motion.div>
        )}

        {/* Input area */}
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('aiChat.placeholder')}
              disabled={isLoading}
              rows={1}
              className="min-h-[40px] max-h-[120px] resize-none bg-background/50 border-border/50 focus-visible:border-gold/40 focus-visible:ring-gold/20 text-sm pr-2 placeholder:text-muted-foreground/60"
            />
          </div>
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="sm"
            className="h-10 px-3 bg-gold hover:bg-gold/90 text-primary-foreground shrink-0 shadow-md shadow-gold/20 transition-all duration-200 disabled:opacity-40 disabled:shadow-none"
          >
            <Send className="size-4" />
            <span className="sr-only">{t('aiChat.send')}</span>
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="flex items-center gap-1 mt-2.5">
          <Sparkles className="size-2.5 text-gold/40" />
          <span className="text-[10px] text-muted-foreground/60">
            {locale === 'zh'
              ? 'AI 生成内容仅供参考，不构成投资建议'
              : 'AI-generated content for reference only. Not financial advice.'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
