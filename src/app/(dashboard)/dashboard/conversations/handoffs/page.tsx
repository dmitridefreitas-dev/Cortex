"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import type { Conversation, ChatMessage } from "@/types";
import { AlertTriangle, MessageSquare, User, Clock, ArrowRight, Send } from "lucide-react";
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

export default function HandoffQueuePage() {
  const [handoffs, setHandoffs] = useState<ConversationWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<ConversationWithPatient | null>(null);
  const [staffMessage, setStaffMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchHandoffs = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      const all: ConversationWithPatient[] = data.conversations || [];
      setHandoffs(all.filter((c) => c.status === "needs_handoff"));
    } catch {
      /* ignore polling errors */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHandoffs();
    const interval = setInterval(fetchHandoffs, 15_000);
    return () => clearInterval(interval);
  }, [fetchHandoffs]);

  async function handleTakeOver(conv: ConversationWithPatient) {
    setSelectedConv(conv);
  }

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
      setSelectedConv(null);
      await fetchHandoffs();
    } finally {
      setSending(false);
    }
  }

  const lastUserMessage = (conv: ConversationWithPatient) => {
    const msg = [...conv.messages].reverse().find((m) => m.role === "user");
    return msg?.content || "No user messages";
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h1 className="text-2xl font-bold">Handoff Queue</h1>
          {handoffs.length > 0 && (
            <Badge variant="destructive" className="text-sm">
              {handoffs.length}
            </Badge>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          Loading…
        </div>
      ) : handoffs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
          <AlertTriangle className="h-10 w-10 opacity-30" />
          <p>No conversations awaiting handoff</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 overflow-y-auto">
          {handoffs.map((conv) => (
            <Card key={conv.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    {conv.patientName || "Unknown Patient"}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-normal text-amber-600">
                    <Clock className="h-3.5 w-3.5" />
                    Waiting {formatDistanceToNow(new Date(conv.updatedAt))}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {lastUserMessage(conv)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {conv.messages.length} messages in conversation
                  </span>
                  <Button size="sm" onClick={() => handleTakeOver(conv)}>
                    Take Over
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Staff Reply Dialog */}
      <Dialog open={!!selectedConv} onOpenChange={(open) => !open && setSelectedConv(null)}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {selectedConv?.patientName || "Unknown Patient"}
              <Badge variant="outline" className="ml-2 text-xs font-normal">
                {selectedConv?.messages.length} messages
              </Badge>
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
                    {m.role === "assistant" && (
                      <span className="text-[10px] opacity-70 uppercase tracking-wider">
                        {m.content.startsWith("[Staff") ? "staff" : "assistant"}
                      </span>
                    )}
                    {m.role === "user" && (
                      <span className="text-[10px] opacity-70 uppercase tracking-wider">patient</span>
                    )}
                    <span className="text-[10px] opacity-50">
                      {formatDistanceToNow(new Date(m.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="border-t pt-3">
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your reply to the patient…"
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
