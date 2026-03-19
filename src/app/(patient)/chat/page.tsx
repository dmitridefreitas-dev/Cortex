"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const starterPrompts = [
  "I need the earliest appointment this week.",
  "What insurance do you accept?",
  "Help me prepare for my intake visit.",
];

function getSessionId() {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("cortex-session-id");
  if (!id) {
    id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem("cortex-session-id", id);
  }
  return id;
}

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
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
      void sendMessage("Hello", true);
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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId }),
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to fetch response");
      }

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
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error("Chat error:", detail);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I'm sorry, I'm having trouble connecting right now. (${detail})`,
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
    void sendMessage(text);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleStarterPrompt(prompt: string) {
    if (isLoading) return;
    setInput("");
    void sendMessage(prompt);
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(191,219,254,0.45),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(219,234,254,0.65),transparent_26%)]" />

      <header className="relative border-b border-blue-100/80 bg-white/85 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-950">Cortex</h1>
              <p className="text-sm text-slate-500">
                Secure AI receptionist for patient support
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-6">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
          <section className="flex flex-1 flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white/85 shadow-[0_30px_90px_-50px_rgba(37,99,235,0.45)] backdrop-blur">
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6"
            >
              <div className="mx-auto max-w-3xl space-y-5">
                {messages.length <= 1 && (
                  <div className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-white to-blue-50/70 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                        <Bot className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-950">
                          Start with a common request
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Use one of these prompts or type your own question.
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {starterPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => handleStarterPrompt(prompt)}
                          className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.length === 0 && isLoading && (
                  <div className="flex items-center justify-center py-20 text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                      <p className="text-sm font-medium">Starting conversation...</p>
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={`${message.timestamp}-${index}`}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div className="max-w-[86%] sm:max-w-[78%]">
                      <div
                        className={cn(
                          "rounded-[24px] px-4 py-3.5 text-sm leading-7 shadow-sm sm:px-5 sm:text-[15px]",
                          message.role === "user"
                            ? "rounded-br-lg bg-blue-600 text-white shadow-blue-500/20"
                            : "rounded-bl-lg border border-blue-100 bg-white text-slate-800"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <p
                        className={cn(
                          "mt-2 text-xs",
                          message.role === "user"
                            ? "text-right text-blue-500/80"
                            : "text-slate-400"
                        )}
                      >
                        {formatTimestamp(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && messages.length > 0 && (
                  <div className="flex justify-start gap-3">
                    <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="rounded-[24px] rounded-bl-lg border border-blue-100 bg-white px-4 py-3 shadow-sm">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-blue-100/80 bg-white/90 px-4 py-4 sm:px-6">
              <form
                onSubmit={handleSubmit}
                className="mx-auto flex max-w-3xl items-end gap-3"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  rows={1}
                  className="min-h-12 flex-1 resize-none rounded-[24px] border border-blue-100 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 sm:text-base"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-12 w-12 shrink-0 rounded-2xl shadow-lg shadow-blue-500/20"
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
