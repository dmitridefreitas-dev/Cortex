"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
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
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);
      // Fetch greeting from AI
      sendMessage("Hello", true);
    }
    if (isOpen) {
      inputRef.current?.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
          content: "I'm sorry, I'm having trouble connecting right now. Please try again.",
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
    <>
      {/* Chat toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-105",
          "bg-primary text-primary-foreground",
          isOpen && "rotate-90"
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[600px] w-[400px] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl max-sm:bottom-0 max-sm:right-0 max-sm:h-full max-sm:w-full max-sm:rounded-none">
          {/* Header */}
          <div className="flex items-center gap-3 border-b bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20 text-lg font-bold">
              C
            </div>
            <div>
              <h3 className="font-semibold">Cortex</h3>
              <p className="text-xs opacity-80">AI Receptionist</p>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 border-t p-3"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 resize-none rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl"
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
