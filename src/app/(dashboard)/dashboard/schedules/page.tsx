"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Save, Pencil, UserRound } from "lucide-react";
import type { Provider, Schedule } from "@/types";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface EditingSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
}

const EMPTY_EDIT: EditingSchedule = {
  dayOfWeek: 0,
  startTime: "",
  endTime: "",
  breakStart: "",
  breakEnd: "",
};

export default function SchedulesPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<EditingSchedule>(EMPTY_EDIT);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProviders() {
      try {
        const res = await fetch("/api/providers");
        if (!res.ok) throw new Error("Failed to fetch providers");
        const data = await res.json();
        setProviders(data.providers ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProviders(false);
      }
    }
    fetchProviders();
  }, []);

  const fetchSchedules = useCallback(async (providerId: string) => {
    setLoadingSchedules(true);
    try {
      const res = await fetch(`/api/schedules?providerId=${providerId}`);
      if (!res.ok) throw new Error("Failed to fetch schedules");
      const data = await res.json();
      setSchedules(data.schedules ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSchedules(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProviderId) {
      fetchSchedules(selectedProviderId);
    } else {
      setSchedules([]);
    }
  }, [selectedProviderId, fetchSchedules]);

  function getScheduleForDay(dayOfWeek: number): Schedule | undefined {
    return schedules.find((s) => s.dayOfWeek === dayOfWeek);
  }

  function openEdit(dayOfWeek: number) {
    const existing = getScheduleForDay(dayOfWeek);
    setEditing({
      dayOfWeek,
      startTime: existing?.startTime ?? "",
      endTime: existing?.endTime ?? "",
      breakStart: existing?.breakStart ?? "",
      breakEnd: existing?.breakEnd ?? "",
    });
    setSaveError(null);
    setEditOpen(true);
  }

  async function handleSave() {
    if (!selectedProviderId) return;
    if (!editing.startTime || !editing.endTime) {
      setSaveError("Start time and end time are required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: selectedProviderId,
          dayOfWeek: editing.dayOfWeek,
          startTime: editing.startTime,
          endTime: editing.endTime,
          breakStart: editing.breakStart || null,
          breakEnd: editing.breakEnd || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error ?? "Failed to save schedule.");
        return;
      }
      setEditOpen(false);
      await fetchSchedules(selectedProviderId);
    } catch {
      setSaveError("Unexpected error saving schedule.");
    } finally {
      setSaving(false);
    }
  }

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Schedules</h1>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Select Provider</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingProviders ? (
            <p className="text-sm text-muted-foreground">Loading providers…</p>
          ) : (
            <div className="flex items-center gap-3">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedProviderId}
                onValueChange={(v) => setSelectedProviderId(v ?? "")}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Choose a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        — {p.specialty}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProvider && (
                <Badge variant="secondary">{selectedProvider.specialty}</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedProviderId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Weekly Schedule
              {selectedProvider && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  — {selectedProvider.name}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSchedules ? (
              <p className="text-sm text-muted-foreground">Loading schedule…</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Day</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Break Start</TableHead>
                    <TableHead>Break End</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DAY_NAMES.map((day, idx) => {
                    const schedule = getScheduleForDay(idx);
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{day}</TableCell>
                        <TableCell>
                          {schedule ? (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Not set</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {schedule?.startTime ?? (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {schedule?.endTime ?? (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {schedule?.breakStart ?? (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {schedule?.breakEnd ?? (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(idx)}
                          >
                            <Pencil className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedProviderId && !loadingProviders && (
        <div className="mt-12 text-center text-muted-foreground">
          <CalendarDays className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p>Select a provider above to view and edit their schedule.</p>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit Schedule — {DAY_NAMES[editing.dayOfWeek]}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={editing.startTime}
                  onChange={(e) =>
                    setEditing((prev) => ({ ...prev, startTime: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={editing.endTime}
                  onChange={(e) =>
                    setEditing((prev) => ({ ...prev, endTime: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="breakStart">Break Start (optional)</Label>
                <Input
                  id="breakStart"
                  type="time"
                  value={editing.breakStart}
                  onChange={(e) =>
                    setEditing((prev) => ({
                      ...prev,
                      breakStart: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="breakEnd">Break End (optional)</Label>
                <Input
                  id="breakEnd"
                  type="time"
                  value={editing.breakEnd}
                  onChange={(e) =>
                    setEditing((prev) => ({
                      ...prev,
                      breakEnd: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {saveError && (
              <p className="text-sm text-destructive">{saveError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
