"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Pencil,
  ArrowUp,
  ArrowDown,
  FileText,
  Eye,
  X,
} from "lucide-react";
import type { IntakeForm, IntakeFormField, IntakeResponse } from "@/types";

const FIELD_TYPES = ["text", "textarea", "select", "checkbox", "date"] as const;

function newField(): IntakeFormField {
  return {
    id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    label: "New Field",
    type: "text",
    required: false,
  };
}

export default function FormsPage() {
  const [forms, setForms] = useState<IntakeForm[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");

  const [editForm, setEditForm] = useState<IntakeForm | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editFields, setEditFields] = useState<IntakeFormField[]>([]);

  const [responsesOpen, setResponsesOpen] = useState(false);
  const [responsesForm, setResponsesForm] = useState<IntakeForm | null>(null);
  const [responses, setResponses] = useState<IntakeResponse[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);

  const fetchForms = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/forms");
    const data = await res.json();
    setForms(data.forms || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  async function toggleStatus(form: IntakeForm) {
    await fetch("/api/forms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: form.id, isActive: !form.isActive }),
    });
    fetchForms();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this form? Responses will still be saved."))
      return;
    await fetch(`/api/forms?id=${id}`, { method: "DELETE" });
    fetchForms();
  }

  async function handleCreate() {
    if (!createName.trim()) return;
    await fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: createName.trim(),
        description: createDesc.trim(),
        isActive: true,
        fields: [],
      }),
    });
    setCreateName("");
    setCreateDesc("");
    setCreateOpen(false);
    fetchForms();
  }

  function openEdit(form: IntakeForm) {
    setEditForm(form);
    setEditName(form.name);
    setEditDesc(form.description || "");
    setEditFields(form.fields.map((f) => ({ ...f })));
  }

  async function handleSaveEdit() {
    if (!editForm) return;
    await fetch("/api/forms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editForm.id,
        name: editName.trim(),
        description: editDesc.trim(),
        fields: editFields,
      }),
    });
    setEditForm(null);
    fetchForms();
  }

  function updateField(idx: number, patch: Partial<IntakeFormField>) {
    setEditFields((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, ...patch } : f))
    );
  }

  function removeField(idx: number) {
    setEditFields((prev) => prev.filter((_, i) => i !== idx));
  }

  function moveField(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= editFields.length) return;
    setEditFields((prev) => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function updateFieldOption(fieldIdx: number, optIdx: number, value: string) {
    setEditFields((prev) =>
      prev.map((f, i) => {
        if (i !== fieldIdx) return f;
        const opts = [...(f.options || [])];
        opts[optIdx] = value;
        return { ...f, options: opts };
      })
    );
  }

  function addFieldOption(fieldIdx: number) {
    setEditFields((prev) =>
      prev.map((f, i) => {
        if (i !== fieldIdx) return f;
        return { ...f, options: [...(f.options || []), ""] };
      })
    );
  }

  function removeFieldOption(fieldIdx: number, optIdx: number) {
    setEditFields((prev) =>
      prev.map((f, i) => {
        if (i !== fieldIdx) return f;
        const opts = [...(f.options || [])];
        opts.splice(optIdx, 1);
        return { ...f, options: opts };
      })
    );
  }

  async function openResponses(form: IntakeForm) {
    setResponsesForm(form);
    setResponsesOpen(true);
    setResponsesLoading(true);
    try {
      const res = await fetch(`/api/forms/responses?formId=${form.id}`);
      const data = await res.json();
      setResponses(data.responses || []);
    } catch {
      setResponses([]);
    } finally {
      setResponsesLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Intake Forms</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Form
        </Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            Loading forms...
          </div>
        ) : forms.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground shadow-sm">
            <FileText className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p>No intake forms yet. Create one to get started.</p>
          </div>
        ) : (
          forms.map((form) => (
            <Card key={form.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="truncate">{form.name}</CardTitle>
                    <Badge variant={form.isActive ? "default" : "secondary"}>
                      {form.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {form.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {form.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {form.fields.length} field
                    {form.fields.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={() => toggleStatus(form)}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openResponses(form)}
                    title="View Responses"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEdit(form)}
                    title="Edit Form"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500"
                    onClick={() => handleDelete(form.id)}
                    title="Delete Form"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              {form.fields.length > 0 && (
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {form.fields.map((f) => (
                      <Badge key={f.id} variant="outline" className="text-xs">
                        {f.label}
                        <span className="ml-1 opacity-50">{f.type}</span>
                        {f.required && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Create Form Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Intake Form</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Name</Label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. New Patient Intake"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="Optional description"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!createName.trim()}>
              Create Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Form Builder Dialog */}
      <Dialog
        open={!!editForm}
        onOpenChange={(open) => {
          if (!open) setEditForm(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Form</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Form Name</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Fields ({editFields.length})
              </Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setEditFields((prev) => [...prev, newField()])
                }
              >
                <Plus className="mr-1 h-3 w-3" /> Add Field
              </Button>
            </div>

            <ScrollArea className="max-h-[50vh] overflow-y-auto">
              <div className="space-y-3 pr-2">
                {editFields.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No fields yet. Click "Add Field" to start building.
                  </p>
                )}
                {editFields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="rounded-lg border bg-muted/30 p-3"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col gap-1 pt-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={idx === 0}
                          onClick={() => moveField(idx, -1)}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={idx === editFields.length - 1}
                          onClick={() => moveField(idx, 1)}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex-1 grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                        <Input
                          value={field.label}
                          onChange={(e) =>
                            updateField(idx, { label: e.target.value })
                          }
                          placeholder="Field label"
                          className="h-8"
                        />

                        <Select
                          value={field.type}
                          onValueChange={(v) =>
                            updateField(idx, {
                              type: v as IntakeFormField["type"],
                              options:
                                v === "select" ? field.options || [""] : undefined,
                            })
                          }
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                          <Checkbox
                            checked={field.required}
                            onCheckedChange={(checked) =>
                              updateField(idx, { required: !!checked })
                            }
                          />
                          Required
                        </label>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500"
                          onClick={() => removeField(idx)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {field.type === "select" && (
                      <div className="mt-2 ml-10 space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Options
                        </Label>
                        {(field.options || []).map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-1">
                            <Input
                              value={opt}
                              onChange={(e) =>
                                updateFieldOption(idx, oi, e.target.value)
                              }
                              placeholder={`Option ${oi + 1}`}
                              className="h-7 text-xs"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-400"
                              onClick={() => removeFieldOption(idx, oi)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => addFieldOption(idx)}
                        >
                          <Plus className="mr-1 h-3 w-3" /> Add Option
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditForm(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Responses Viewer Dialog */}
      <Dialog open={responsesOpen} onOpenChange={setResponsesOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Responses — {responsesForm?.name}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-y-auto">
            {responsesLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading responses...
              </div>
            ) : responses.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No responses submitted yet.
              </div>
            ) : (
              <div className="space-y-4 pr-2">
                {responses.map((resp) => (
                  <Card key={resp.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Patient: {resp.patientId}</span>
                        <span>
                          {new Date(resp.submittedAt).toLocaleString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        {responsesForm?.fields.map((field) => {
                          const value = resp.responses[field.id];
                          return (
                            <div
                              key={field.id}
                              className="flex justify-between gap-4 border-b py-1 last:border-0 text-sm"
                            >
                              <span className="font-medium text-muted-foreground">
                                {field.label}
                              </span>
                              <span className="text-right">
                                {value === true
                                  ? "Yes"
                                  : value === false
                                    ? "No"
                                    : Array.isArray(value)
                                      ? value.join(", ")
                                      : String(value ?? "—")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  );
}
