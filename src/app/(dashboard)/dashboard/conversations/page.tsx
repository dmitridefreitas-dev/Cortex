"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { Conversation, ChatMessage } from "@/types";
import { Bot, Trash2, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConversationWithPatient extends Conversation {
  patientName?: string | null;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function handleDeleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this conversation? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/conversations?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (selectedId === id) {
          setSelectedId(conversations.find((c) => c.id !== id)?.id ?? null);
        }
      }
    } finally {
      setDeletingId(null);
    }
  }

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
                    className={`group flex flex-col items-start gap-1 border-b p-4 text-left transition-colors hover:bg-muted/50 ${
                      selectedId === conv.id ? "bg-muted font-medium" : ""
                    }`}
                  >
                    {/* Patient name row */}
                    <div className="flex w-full items-center gap-2 text-sm">
                      <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate font-medium text-slate-800">
                        {conv.patientName || "Unknown Patient"}
                      </span>
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        disabled={deletingId === conv.id}
                        className="ml-auto shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        title="Delete conversation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {/* Message count + time */}
                    <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                      <span>{conv.messages.length} messages</span>
                      <span className="whitespace-nowrap">
                        {format(new Date(conv.updatedAt), "h:mm a")}
                      </span>
                    </div>
                    {/* Preview */}
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
        <div className="col-span-2 flex flex-col min-h-0 bg-slate-50">
          {selectedConv ? (
            <>
              <div className="border-b bg-background p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    {(selectedConv as ConversationWithPatient).patientName || "Unknown Patient"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Session: {selectedConv.id} &middot; Started: {format(new Date(selectedConv.createdAt), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
              </div>
              <ScrollArea className="flex-1 min-h-0 p-4">
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
