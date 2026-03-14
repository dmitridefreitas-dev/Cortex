"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, ArrowLeft } from "lucide-react";
import type { FAQEntry } from "@/types";
import Link from "next/link";

export default function FAQSettingsPage() {
  const [faqs, setFaqs] = useState<FAQEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [adding, setAdding] = useState(false);

  async function fetchFaqs() {
    const res = await fetch("/api/clinic/faq");
    const data = await res.json();
    return data.faqEntries || [];
  }

  useEffect(() => {
    let active = true;

    void fetchFaqs().then((entries) => {
      if (!active) return;
      setFaqs(entries);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  async function refreshFaqs() {
    setLoading(true);
    const entries = await fetchFaqs();
    setFaqs(entries);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    setAdding(true);
    const res = await fetch("/api/clinic/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: newQuestion, answer: newAnswer }),
    });
    if (res.ok) {
      setNewQuestion("");
      setNewAnswer("");
      await refreshFaqs();
    }
    setAdding(false);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;
    await fetch(`/api/clinic/faq?id=${id}`, { method: "DELETE" });
    await refreshFaqs();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Manage FAQ</h1>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* List of current FAQs */}
        <div className="md:col-span-2 space-y-4">
          {loading ? (
            <div className="text-muted-foreground p-8 bg-white border rounded-lg">Loading FAQs...</div>
          ) : faqs.length === 0 ? (
            <div className="text-muted-foreground p-8 bg-white border rounded-lg text-center">
              No FAQs added yet.
            </div>
          ) : (
            faqs.map((faq) => (
              <Card key={faq.id}>
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 -mt-2 -mr-2 shrink-0"
                    onClick={() => handleDelete(faq.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{faq.answer}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Add new FAQ form */}
        <div className="md:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Add New FAQ</CardTitle>
              <CardDescription>
                When patients ask similar questions in chat, the AI will use these to answer accurately.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Question</label>
                  <Input
                    placeholder="e.g. Do you have parking?"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Answer</label>
                  <Textarea
                    placeholder="Provide a clear, helpful answer."
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={adding || !newQuestion || !newAnswer}>
                  {adding ? "Adding..." : (
                    <>
                      <Plus className="mr-2 h-4 w-4" /> Add FAQ
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
