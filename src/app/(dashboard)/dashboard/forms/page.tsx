"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Edit } from "lucide-react";
import type { IntakeForm, IntakeFormField } from "@/types";

export default function FormsPage() {
  const [forms, setForms] = useState<IntakeForm[]>([]);
  const [loading, setLoading] = useState(true);

  // Simple hardcoded form template for demo
  const handleCreateDefaultForm = async () => {
    const newForm = {
      name: "Standard New Patient Intake",
      description: "Basic medical history and demographics",
      isActive: true,
      fields: [
        { id: "f1", label: "Date of Birth", type: "date", required: true },
        { id: "f2", label: "Primary Reason for Visit", type: "textarea", required: true },
        { id: "f3", label: "Allergies", type: "text", required: false },
        { id: "f4", label: "Current Medications", type: "textarea", required: false },
        { id: "f5", label: "Emergency Contact Name", type: "text", required: true },
        { id: "f6", label: "Emergency Contact Phone", type: "text", required: true },
      ],
    };

    await fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    fetchForms();
  };

  async function fetchForms() {
    setLoading(true);
    const res = await fetch("/api/forms");
    const data = await res.json();
    setForms(data.forms || []);
    setLoading(false);
  }

  async function toggleStatus(form: IntakeForm) {
    await fetch("/api/forms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: form.id, isActive: !form.isActive }),
    });
    fetchForms();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this form? Responses will still be saved.")) return;
    await fetch(`/api/forms?id=${id}`, { method: "DELETE" });
    fetchForms();
  }

  useEffect(() => {
    fetchForms();
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Intake Forms</h1>
        <Button onClick={handleCreateDefaultForm}>
          <Plus className="mr-2 h-4 w-4" /> Create Default Form
        </Button>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div>Loading forms...</div>
        ) : forms.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground shadow-sm">
            No intake forms created yet. Click the button above to generate a standard template.
          </div>
        ) : (
          forms.map((form) => (
            <Card key={form.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle>{form.name}</CardTitle>
                  <CardDescription className="mt-1">{form.description}</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${form.id}`} className="text-sm">
                      {form.isActive ? "Active" : "Inactive"}
                    </Label>
                    <Switch
                      id={`active-${form.id}`}
                      checked={form.isActive}
                      onCheckedChange={() => toggleStatus(form)}
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(form.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-4">
                  <h4 className="mb-3 text-sm font-medium">Form Fields ({form.fields.length})</h4>
                  <div className="flex flex-col gap-2 rounded-md border p-3 bg-slate-50">
                    {form.fields.map((f: IntakeFormField, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0 border-slate-200">
                        <span className="font-medium text-slate-700">{f.label}</span>
                        <div className="flex gap-3 text-slate-500 text-xs">
                          <span className="uppercase">{f.type}</span>
                          {f.required ? <span className="text-red-500">Required</span> : <span>Optional</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
