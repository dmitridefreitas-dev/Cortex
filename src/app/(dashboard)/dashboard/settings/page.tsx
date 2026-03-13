"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Clinic } from "@/types";
import { Save } from "lucide-react";

export default function SettingsPage() {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/clinic")
      .then((r) => r.json())
      .then((d) => setClinic(d.clinic));
  }, []);

  async function handleSave() {
    if (!clinic) return;
    setSaving(true);
    await fetch("/api/clinic", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clinic),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!clinic) {
    return <div className="p-8 text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clinic Settings</h1>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Clinic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Clinic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Clinic Name</Label>
                <Input
                  value={clinic.name}
                  onChange={(e) =>
                    setClinic({ ...clinic, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={clinic.email}
                  onChange={(e) =>
                    setClinic({ ...clinic, email: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={clinic.phone}
                  onChange={(e) =>
                    setClinic({ ...clinic, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Timezone</Label>
                <Input
                  value={clinic.timezone}
                  onChange={(e) =>
                    setClinic({ ...clinic, timezone: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={clinic.address}
                onChange={(e) =>
                  setClinic({ ...clinic, address: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Settings */}
        <Card>
          <CardHeader>
            <CardTitle>AI Receptionist Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>AI Name</Label>
                <Input
                  value={clinic.settings.aiName}
                  onChange={(e) =>
                    setClinic({
                      ...clinic,
                      settings: { ...clinic.settings, aiName: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label>Tone</Label>
                <Select
                  value={clinic.settings.aiTone}
                  onValueChange={(v) =>
                    setClinic({
                      ...clinic,
                      settings: {
                        ...clinic.settings,
                        aiTone: v as "formal" | "friendly" | "casual",
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Greeting Message</Label>
              <Textarea
                value={clinic.settings.aiGreeting}
                onChange={(e) =>
                  setClinic({
                    ...clinic,
                    settings: {
                      ...clinic.settings,
                      aiGreeting: e.target.value,
                    },
                  })
                }
                rows={3}
              />
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Min Booking Notice (hours)</Label>
                <Input
                  type="number"
                  value={clinic.settings.minBookingNoticeHours}
                  onChange={(e) =>
                    setClinic({
                      ...clinic,
                      settings: {
                        ...clinic.settings,
                        minBookingNoticeHours: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label>Max Booking Ahead (days)</Label>
                <Input
                  type="number"
                  value={clinic.settings.maxBookingDaysAhead}
                  onChange={(e) =>
                    setClinic({
                      ...clinic,
                      settings: {
                        ...clinic.settings,
                        maxBookingDaysAhead: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label>Buffer Between Appointments (min)</Label>
                <Input
                  type="number"
                  value={clinic.settings.bufferMinutes}
                  onChange={(e) =>
                    setClinic({
                      ...clinic,
                      settings: {
                        ...clinic.settings,
                        bufferMinutes: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Cancellation Policy</Label>
              <Textarea
                value={clinic.settings.cancellationPolicy}
                onChange={(e) =>
                  setClinic({
                    ...clinic,
                    settings: {
                      ...clinic.settings,
                      cancellationPolicy: e.target.value,
                    },
                  })
                }
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
