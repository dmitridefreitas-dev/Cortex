"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import type { Conversation, ChatMessage } from "@/types";
import { Radio, MessageSquare, User, Bot, RefreshCw, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConversationWithPatient extends Conversation {
  patientName?: string | null;
}

function getStatusIndicator(updatedAt: string) {
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  const diffMin = diffMs / 60_000;
  if (diffMin < 5) return { color: "bg-green-500", label: "Active" };
  return { color: "bg-yellow-500", label: "Idle" };
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export default function LiveMonitorPage() {
  const [conversations, setConversations] = useState<ConversationWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<ConversationWithPatient | null>(null);
  const [staffMessage, setStaffMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [takenOver, setTakenOver] = useState<Set<string>>(new Set());

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      const all: ConversationWithPatient[] = data.conversations || [];
      const cutoff = Date.now() - 30 * 60 * 1000;
      const active = all.filter(
        (c) => new Date(c.updatedAt).getTime() >= cutoff
      );
      setConversations(active);
    } catch {
      /* ignore polling errors */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10_000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  async function handleSendStaffReply() {
    if (!selectedConv || !staffMessage.trim()) return;
    setSending(true);
    try {
      await fetch("/api/chat/staff-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedConv.id,
          message: staffMessage.trim(),
          staffName: "Staff",
        }),
      });
      setStaffMessage("");
      await fetchConversations();
      const updated = conversations.find((c) => c.id === selectedConv.id);
      if (updated) setSelectedConv(updated);
    } finally {
      setSending(false);
    }
  }

  function handleTakeOver(convId: string) {
    setTakenOver((prev) => {
      const next = new Set(prev);
      if (next.has(convId)) {
        next.delete(convId);
      } else {
        next.add(convId);
      }
      return next;
    });
  }

  const lastMessage = (conv: ConversationWithPatient) => {
    const msg = conv.messages[conv.messages.length - 1];
    return msg ? truncate(msg.content, 80) : "No messages";
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radio className="h-5 w-5 text-green-600" />
          <h1 className="text-2xl font-bold">Live Conversations</h1>
          {conversations.length > 0 && (
            <Badge variant="secondary" className="text-sm">
              {conversations.length}
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true);
            fetchConversations();
          }}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && conversations.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          Loading active conversations…
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          No active conversations right now
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
          {conversations.map((conv) => {
            const status = getStatusIndicator(conv.updatedAt);
            return (
              <Card
                key={conv.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => setSelectedConv(conv)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      {conv.patientName || "Unknown"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${status.color}`} />
                      <span className="text-xs font-normal text-muted-foreground">
                        {status.label}
                      </span>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{conv.messages.length} messages</span>
                    <span className="ml-auto">
                      {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {lastMessage(conv)}
                  </p>
                  {conv.status === "needs_handoff" && (
                    <Badge variant="destructive" className="text-[10px]">
                      Needs Handoff
                    </Badge>
                  )}
                  {conv.status === "handed_off" && (
                    <Badge className="bg-blue-100 text-blue-700 text-[10px]">
                      Staff Handling
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Transcript Dialog */}
      <Dialog open={!!selectedConv} onOpenChange={(open) => !open && setSelectedConv(null)}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {selectedConv?.patientName || "Unknown Patient"}
              {selectedConv && (
                <Badge variant="outline" className="ml-2 text-xs font-normal">
                  {selectedConv.messages.length} messages
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 pr-4">
            <div className="flex flex-col gap-3 py-2">
              {selectedConv?.messages.map((m: ChatMessage, idx: number) => (
                <div
                  key={idx}
                  className={`flex w-max max-w-[85%] flex-col gap-1 rounded-xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : m.content.startsWith("[Staff")
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-white border shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    {m.role === "assistant" && !m.content.startsWith("[Staff") && (
                      <Bot className="h-3 w-3" />
                    )}
                    {m.content.startsWith("[Staff") && (
                      <User className="h-3 w-3 text-blue-600" />
                    )}
                    <span className="text-[10px] opacity-70 uppercase tracking-wider">
                      {m.content.startsWith("[Staff") ? "staff" : m.role}
                    </span>
                    <span className="text-[10px] opacity-50">
                      {formatDistanceToNow(new Date(m.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Staff Reply Controls */}
          {selectedConv && (
            <div className="border-t pt-3 space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  variant={takenOver.has(selectedConv.id) ? "destructive" : "default"}
                  size="sm"
                  onClick={() => handleTakeOver(selectedConv.id)}
                >
                  {takenOver.has(selectedConv.id) ? "Return to AI" : "Take Over"}
                </Button>
                {takenOver.has(selectedConv.id) && (
                  <span className="text-xs text-muted-foreground">
                    AI responses paused — you are handling this conversation
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type a staff reply…"
                  value={staffMessage}
                  onChange={(e) => setStaffMessage(e.target.value)}
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendStaffReply();
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleSendStaffReply}
                  disabled={sending || !staffMessage.trim()}
                  className="shrink-0 self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
