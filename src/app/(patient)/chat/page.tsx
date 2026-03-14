"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Bot, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

function getSessionId() {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("cortex-session-id");
  if (!id) {
    id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem("cortex-session-id", id);
  }
  return id;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!hasGreeted) {
      setHasGreeted(true);
      sendMessage("Hello", true);
    }
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendMessage(text: string, isGreeting = false) {
    const sessionId = getSessionId();

    if (!isGreeting) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: text, timestamp: new Date().toISOString() },
      ]);
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm sorry, I'm having trouble connecting right now. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage(text);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-slate-50">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Cortex</h1>
          <p className="text-xs text-slate-500">AI Clinic Receptionist</p>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
      >
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
              <Bot className="mb-4 h-12 w-12" />
              <p className="text-lg font-medium">Starting conversation...</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:text-base",
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-white text-slate-800 border border-slate-200 rounded-bl-md shadow-sm"
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-2xl items-end gap-3"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-base"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700"
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
