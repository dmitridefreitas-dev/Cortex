"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import type { Conversation, ChatMessage } from "@/types";
import { MessageCircle, Bot } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/conversations")
      .then((res) => res.json())
      .then((data) => {
        setConversations(data.conversations || []);
        if (data.conversations?.length > 0) {
          setSelectedId(data.conversations[0].id);
        }
        setLoading(false);
      });
  }, []);

  const selectedConv = conversations.find((c) => c.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <h1 className="mb-6 text-2xl font-bold">AI Conversations</h1>

      <div className="grid flex-1 grid-cols-1 overflow-hidden rounded-xl border bg-background md:grid-cols-3">
        {/* Sidebar */}
        <div className="border-r bg-muted/20">
          <div className="p-4 border-b font-medium">Chat History</div>
          <ScrollArea className="h-[calc(100%-3rem)]">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No conversations yet</div>
            ) : (
              <div className="flex flex-col">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`flex flex-col items-start gap-1 border-b p-4 text-left transition-colors hover:bg-muted/50 ${
                      selectedId === conv.id ? "bg-muted font-medium" : ""
                    }`}
                  >
                    <div className="flex w-full items-center justify-between text-sm">
                      <span className="truncate pr-2">
                        {conv.messages.length} messages
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(conv.updatedAt), "h:mm a")}
                      </span>
                    </div>
                    <div className="w-full truncate text-xs text-muted-foreground">
                      {conv.summary || conv.messages.findLast((m) => m.role === "user")?.content || "No user messages"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat View */}
        <div className="col-span-2 flex flex-col bg-slate-50">
          {selectedConv ? (
            <>
              <div className="border-b bg-background p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Session: {selectedConv.id}</h3>
                  <p className="text-xs text-muted-foreground">
                    Started: {format(new Date(selectedConv.createdAt), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-4">
                  {selectedConv.messages.map((m: ChatMessage, idx) => (
                    <div
                      key={idx}
                      className={`flex w-max max-w-[80%] flex-col gap-1 rounded-xl px-4 py-2 text-sm ${
                        m.role === "user"
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "bg-white border shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {m.role === "assistant" && <Bot className="h-3 w-3" />}
                        <span className="text-[10px] opacity-70 uppercase tracking-wider">
                          {m.role}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      {m.toolCalls && m.toolCalls.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1">
                          {m.toolCalls.map((tc, tIdx) => (
                            <div key={tIdx} className="rounded bg-slate-100 p-2 text-xs font-mono text-slate-600">
                              <div className="font-semibold">{tc.name}()</div>
                              <div className="text-[10px] break-all">{JSON.stringify(tc.args)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              {conversations.length > 0 ? "Select a conversation to view" : "No conversations to display"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
