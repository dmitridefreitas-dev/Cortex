"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { IntakeForm, IntakeFormField } from "@/types";
import { CheckCircle2 } from "lucide-react";

type IntakeResponseValue = string | boolean;

export default function PatientIntakePageWrapper() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <PatientIntakePage />
    </Suspense>
  );
}

function PatientIntakePage() {
  const searchParams = useSearchParams();
  const formId = searchParams.get("formId");
  const appointmentId = searchParams.get("appointmentId");
  const patientId = searchParams.get("patientId") ?? undefined;

  const [form, setForm] = useState<IntakeForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [responses, setResponses] = useState<Record<string, IntakeResponseValue>>({});
  const [error, setError] = useState("");

  const getTextResponse = (fieldId: string) =>
    typeof responses[fieldId] === "string" ? responses[fieldId] : "";

  useEffect(() => {
    if (!formId) {
      setError("No form ID provided.");
      setLoading(false);
      return;
    }

    fetch(`/api/forms/${formId}`)
      .then(res => res.json())
      .then(data => {
        if (data.form) {
          setForm(data.form);
        } else {
          setError("Form not found or is no longer active.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load intake form.");
        setLoading(false);
      });
  }, [formId]);

  const handleChange = (fieldId: string, value: IntakeResponseValue) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !formId) return;

    for (const field of form.fields) {
      if (field.required && !responses[field.id]) {
        alert(`Please complete the required field: ${field.label}`);
        return;
      }
    }

    setSubmitting(true);

    try {
      await fetch('/api/forms/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          appointmentId: appointmentId || undefined,
          patientId: patientId ?? "anonymous",
          responses
        })
      });
      setSubmitted(true);
    } catch {
      alert("Failed to submit form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen p-8 mt-12 text-center">Loading your intake form...</div>;

  if (error) return (
    <div className="min-h-screen p-8 mt-12 flex justify-center">
      <Card className="w-full max-w-md border-red-200">
        <CardContent className="pt-6 text-center text-red-600">
          {error}
        </CardContent>
      </Card>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center pt-24">
      <Card className="w-full max-w-lg shadow-md border-green-100">
        <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-6" />
          <h2 className="text-2xl font-bold mb-2">Form Submitted Successfully!</h2>
          <p className="text-muted-foreground mb-8">
            Thank you for completing your intake form. Your responses have been saved securely to your patient record.
          </p>
          <Button onClick={() => window.close()}>Close Window</Button>
        </CardContent>
      </Card>
    </div>
  );

  if (!form) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex justify-center">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-primary mb-2">Cortex Medical Clinic</h1>
          <p className="text-muted-foreground">Patient Intake &amp; Registration</p>
        </div>

        <Card className="shadow-md">
          <CardHeader className="bg-slate-50 border-b pb-6">
            <CardTitle className="text-xl">{form.name}</CardTitle>
            {form.description && (
              <CardDescription className="text-base mt-2">{form.description}</CardDescription>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              <span className="text-red-500">*</span> Indicates a required field
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {form.fields.map((field: IntakeFormField) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id} className="text-sm font-medium">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </Label>

                  {field.type === 'text' && (
                    <Input
                      id={field.id}
                      value={getTextResponse(field.id)}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      required={field.required}
                    />
                  )}

                  {field.type === 'textarea' && (
                    <Textarea
                      id={field.id}
                      rows={3}
                      value={getTextResponse(field.id)}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      required={field.required}
                    />
                  )}

                  {field.type === 'date' && (
                    <Input
                      id={field.id}
                      type="date"
                      value={getTextResponse(field.id)}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      required={field.required}
                    />
                  )}

                  {field.type === 'select' && field.options && (
                    <select
                      id={field.id}
                      value={getTextResponse(field.id)}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      required={field.required}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select an option...</option>
                      {field.options.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {field.type === 'checkbox' && (
                    <div className="flex items-center space-x-2 mt-2">
                      <Checkbox
                        id={field.id}
                        checked={!!responses[field.id]}
                        onCheckedChange={(checked) => handleChange(field.id, checked === true)}
                      />
                      <label htmlFor={field.id} className="text-sm cursor-pointer">
                        Yes, I confirm
                      </label>
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-6 border-t mt-8">
                <Button type="submit" className="w-full text-lg py-6" disabled={submitting}>
                  {submitting ? "Securely Submitting..." : "Submit Intake Form"}
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Your information is encrypted securely and transmitted safely to your health provider.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
