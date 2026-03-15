"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addMonths,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subYears,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Save,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Appointment, Provider, Schedule, ScheduleOverride } from "@/types";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface EditingSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
}

interface DailyAvailability {
  status: "available" | "custom" | "off";
  label: string;
  hours: string | null;
  breakHours: string | null;
  source: "weekly" | "override";
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
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [appointments, setAppointments] = useState<(Appointment & { patientName?: string; serviceName?: string })[]>([]);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<EditingSchedule>(EMPTY_EDIT);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [focusDate, setFocusDate] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());

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

    void fetchProviders();
  }, []);

  const fetchCalendarData = useCallback(async (providerId: string, year: number) => {
    setLoadingSchedules(true);
    try {
      const params = new URLSearchParams({
        providerId,
        dateFrom: `${year}-01-01`,
        dateTo: `${year}-12-31`,
      });
      const [schedRes, aptRes] = await Promise.all([
        fetch(`/api/schedules?${params.toString()}`),
        fetch(`/api/appointments?providerId=${providerId}&dateFrom=${year}-01-01&dateTo=${year}-12-31`),
      ]);
      if (!schedRes.ok) throw new Error("Failed to fetch schedules");
      const schedData = await schedRes.json();
      setSchedules(schedData.schedules ?? []);
      setOverrides(schedData.overrides ?? []);

      if (aptRes.ok) {
        const aptData = await aptRes.json();
        setAppointments(aptData.appointments ?? []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSchedules(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProviderId) {
      void fetchCalendarData(selectedProviderId, focusDate.getFullYear());
    } else {
      setSchedules([]);
      setOverrides([]);
      setAppointments([]);
    }
  }, [selectedProviderId, focusDate, fetchCalendarData]);

  function getScheduleForDay(dayOfWeek: number): Schedule | undefined {
    return schedules.find((schedule) => schedule.dayOfWeek === dayOfWeek);
  }

  function getAppointmentsForDate(date: Date) {
    const dateStr = format(date, "yyyy-MM-dd");
    return appointments.filter(
      (apt) => apt.status !== "cancelled" && apt.startTime.startsWith(dateStr)
    );
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
      await fetchCalendarData(selectedProviderId, focusDate.getFullYear());
    } catch {
      setSaveError("Unexpected error saving schedule.");
    } finally {
      setSaving(false);
    }
  }

  function shiftFocus(direction: "prev" | "next") {
    setFocusDate((current) => {
      if (viewMode === "year") {
        return direction === "prev" ? subYears(current, 1) : addYears(current, 1);
      }
      return direction === "prev" ? subMonths(current, 1) : addMonths(current, 1);
    });
  }

  function selectMonth(monthDate: Date) {
    setFocusDate(monthDate);
    setSelectedDate(monthDate);
    setViewMode("month");
  }

  const selectedProvider = providers.find((provider) => provider.id === selectedProviderId);
  const monthDays = buildMonthDays(focusDate);
  const selectedAvailability = getAvailabilityForDate(
    selectedDate,
    schedules,
    overrides
  );
  const monthAvailableDays = countAvailableDaysForMonth(
    focusDate,
    schedules,
    overrides
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Schedules</h1>
      </div>

      <Card className="rounded-[28px] border-blue-100 bg-white/90 shadow-[0_20px_60px_-45px_rgba(37,99,235,0.35)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Select Provider</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingProviders ? (
            <p className="text-sm text-muted-foreground">Loading providers…</p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedProviderId}
                onValueChange={(value) => {
                  setSelectedProviderId(value ?? "");
                  setFocusDate(startOfMonth(new Date()));
                  setSelectedDate(new Date());
                }}
              >
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Choose a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        — {provider.specialty}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProvider && (
                <Badge className="rounded-full bg-blue-50 px-3 py-1 text-blue-700 ring-1 ring-blue-100">
                  {selectedProvider.specialty}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedProviderId ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_340px]">
            <Card className="rounded-[32px] border-blue-100 bg-white/92 shadow-[0_24px_70px_-50px_rgba(37,99,235,0.35)]">
              <CardHeader className="gap-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle className="text-xl text-slate-950">
                      Availability Calendar
                    </CardTitle>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Directly inspect monthly or yearly availability for{" "}
                      {selectedProvider?.name}. Weekly schedule edits below are
                      reflected here across the full year.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex rounded-full border border-blue-100 bg-blue-50/70 p-1">
                      <Button
                        size="sm"
                        variant={viewMode === "month" ? "default" : "ghost"}
                        className="rounded-full"
                        onClick={() => setViewMode("month")}
                      >
                        Month
                      </Button>
                      <Button
                        size="sm"
                        variant={viewMode === "year" ? "default" : "ghost"}
                        className="rounded-full"
                        onClick={() => setViewMode("year")}
                      >
                        Year
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-white px-2 py-1 shadow-sm">
                      <Button size="icon-sm" variant="ghost" onClick={() => shiftFocus("prev")}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="min-w-32 text-center text-sm font-medium text-slate-950">
                        {viewMode === "month"
                          ? format(focusDate, "MMMM yyyy")
                          : format(focusDate, "yyyy")}
                      </div>
                      <Button size="icon-sm" variant="ghost" onClick={() => shiftFocus("next")}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {loadingSchedules ? (
                  <div className="rounded-[28px] border border-blue-100 bg-blue-50/40 px-6 py-10 text-center text-sm text-muted-foreground">
                    Loading calendar…
                  </div>
                ) : viewMode === "month" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-7 gap-2">
                      {WEEKDAY_LABELS.map((label) => (
                        <div
                          key={label}
                          className="px-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"
                        >
                          {label}
                        </div>
                      ))}

                      {monthDays.map((day) => {
                        const availability = getAvailabilityForDate(
                          day,
                          schedules,
                          overrides
                        );
                        const inMonth = isSameMonth(day, focusDate);
                        const isSelected = isSameDay(day, selectedDate);
                        const dayAppts = getAppointmentsForDate(day);
                        const sortedAppts = [...dayAppts].sort((a, b) =>
                          a.startTime.localeCompare(b.startTime)
                        );
                        const visibleAppts = sortedAppts.slice(0, 3);
                        const overflowCount = sortedAppts.length - visibleAppts.length;

                        return (
                          <button
                            key={day.toISOString()}
                            type="button"
                            onClick={() => setSelectedDate(day)}
                            className={cn(
                              "min-h-44 rounded-[24px] border p-3 text-left transition-transform hover:-translate-y-0.5 flex flex-col",
                              !inMonth && "opacity-35",
                              isSelected && "ring-2 ring-blue-500 ring-offset-2 ring-offset-white",
                              availability.status === "available" &&
                                "border-blue-100 bg-blue-50/70",
                              availability.status === "custom" &&
                                "border-slate-900/10 bg-slate-950 text-white",
                              availability.status === "off" &&
                                "border-slate-200 bg-slate-50"
                            )}
                          >
                            {/* Header: day number + status dot */}
                            <div className="flex items-center justify-between">
                              <span
                                className={cn(
                                  "text-sm font-semibold",
                                  availability.status === "custom"
                                    ? "text-white"
                                    : "text-slate-950"
                                )}
                              >
                                {format(day, "d")}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {dayAppts.length > 0 && (
                                  <span
                                    className={cn(
                                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                                      availability.status === "custom"
                                        ? "bg-white/20 text-white"
                                        : "bg-blue-600 text-white"
                                    )}
                                  >
                                    {dayAppts.length}
                                  </span>
                                )}
                                <span
                                  className={cn(
                                    "h-2.5 w-2.5 rounded-full",
                                    availability.status === "available" &&
                                      "bg-blue-500",
                                    availability.status === "custom" &&
                                      "bg-white",
                                    availability.status === "off" &&
                                      "bg-slate-300"
                                  )}
                                />
                              </div>
                            </div>

                            {/* Schedule hours */}
                            <div className="mt-2 space-y-0.5">
                              <p
                                className={cn(
                                  "text-[11px] font-medium",
                                  availability.status === "custom"
                                    ? "text-blue-100"
                                    : availability.status === "off"
                                      ? "text-slate-500"
                                      : "text-blue-700"
                                )}
                              >
                                {availability.hours || "No hours"}
                              </p>
                            </div>

                            {/* Appointment pills */}
                            {visibleAppts.length > 0 && (
                              <div className="mt-auto flex flex-col gap-1 pt-2">
                                {visibleAppts.map((apt) => (
                                  <div
                                    key={apt.id}
                                    className={cn(
                                      "rounded-lg px-1.5 py-0.5 text-[10px] font-medium leading-tight truncate",
                                      availability.status === "custom"
                                        ? "bg-white/15 text-white/90"
                                        : apt.status === "confirmed"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-blue-100 text-blue-800"
                                    )}
                                  >
                                    {format(new Date(apt.startTime), "h:mm")}-
                                    {format(new Date(apt.endTime), "h:mm a")}
                                  </div>
                                ))}
                                {overflowCount > 0 && (
                                  <span
                                    className={cn(
                                      "text-[10px] font-medium",
                                      availability.status === "custom"
                                        ? "text-white/60"
                                        : "text-slate-400"
                                    )}
                                  >
                                    +{overflowCount} more
                                  </span>
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 12 }, (_, index) => {
                      const monthDate = startOfMonth(
                        new Date(focusDate.getFullYear(), index, 1)
                      );
                      const monthCalendarDays = buildMonthDays(monthDate);
                      const availableCount = countAvailableDaysForMonth(
                        monthDate,
                        schedules,
                        overrides
                      );

                      return (
                        <button
                          key={monthDate.toISOString()}
                          type="button"
                          onClick={() => selectMonth(monthDate)}
                          className="rounded-[26px] border border-blue-100 bg-gradient-to-br from-white to-blue-50/55 p-4 text-left shadow-[0_18px_50px_-45px_rgba(37,99,235,0.35)] transition-transform hover:-translate-y-0.5"
                        >
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-base font-semibold text-slate-950">
                                {format(monthDate, "MMMM")}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {availableCount} available day
                                {availableCount === 1 ? "" : "s"}
                              </p>
                            </div>
                            <Badge className="rounded-full bg-white px-2.5 py-1 text-blue-700 ring-1 ring-blue-100">
                              {format(monthDate, "yyyy")}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-7 gap-1">
                            {WEEKDAY_LABELS.map((label) => (
                              <div
                                key={`${monthDate.toISOString()}-${label}`}
                                className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"
                              >
                                {label[0]}
                              </div>
                            ))}

                            {monthCalendarDays.map((day) => {
                              const availability = getAvailabilityForDate(
                                day,
                                schedules,
                                overrides
                              );
                              return (
                                <div
                                  key={day.toISOString()}
                                  className={cn(
                                    "flex aspect-square items-center justify-center rounded-xl text-[11px] font-medium",
                                    !isSameMonth(day, monthDate) && "opacity-20",
                                    availability.status === "available" &&
                                      "bg-blue-100 text-blue-700",
                                    availability.status === "custom" &&
                                      "bg-slate-900 text-white",
                                    availability.status === "off" &&
                                      "bg-slate-100 text-slate-400"
                                  )}
                                >
                                  {format(day, "d")}
                                </div>
                              );
                            })}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card className="rounded-[32px] border-blue-100 bg-white/92 shadow-[0_24px_70px_-50px_rgba(37,99,235,0.35)]">
                <CardHeader>
                  <CardTitle className="text-xl text-slate-950">
                    Day Detail
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-[24px] border border-blue-100 bg-blue-50/60 p-4">
                    <p className="text-sm text-slate-500">
                      {format(selectedDate, "EEEE")}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      {format(selectedDate, "MMMM d, yyyy")}
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-blue-100 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Status
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {selectedAvailability.label}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedAvailability.hours || "No provider hours set"}
                    </p>
                    {selectedAvailability.breakHours && (
                      <p className="mt-1 text-sm text-slate-500">
                        Break: {selectedAvailability.breakHours}
                      </p>
                    )}
                    <p className="mt-3 text-xs text-slate-400">
                      Source:{" "}
                      {selectedAvailability.source === "override"
                        ? "Date-specific override"
                        : "Weekly template"}
                    </p>
                  </div>

                  {/* Booked appointments for this day */}
                  {(() => {
                    const dayAppts = getAppointmentsForDate(selectedDate);
                    return dayAppts.length > 0 ? (
                      <div className="rounded-[24px] border border-blue-100 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Booked Appointments ({dayAppts.length})
                        </p>
                        <div className="mt-3 space-y-2">
                          {dayAppts
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map((apt) => (
                              <div
                                key={apt.id}
                                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                              >
                                <div>
                                  <p className="text-sm font-medium text-slate-800">
                                    {format(new Date(apt.startTime), "h:mm a")} –{" "}
                                    {format(new Date(apt.endTime), "h:mm a")}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {apt.patientName || "Patient"} · {apt.serviceName || "Service"}
                                  </p>
                                </div>
                                <Badge
                                  className={cn(
                                    "rounded-full text-[10px]",
                                    apt.status === "confirmed"
                                      ? "bg-green-100 text-green-700"
                                      : apt.status === "completed"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-slate-100 text-slate-600"
                                  )}
                                >
                                  {apt.status}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : selectedAvailability.status !== "off" ? (
                      <div className="rounded-[24px] border border-blue-100 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Booked Appointments
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          No appointments booked for this day.
                        </p>
                      </div>
                    ) : null;
                  })()}
                </CardContent>
              </Card>

              <Card className="rounded-[32px] border-blue-100 bg-slate-950 text-white shadow-[0_24px_70px_-45px_rgba(15,23,42,0.85)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-white">
                    <Sparkles className="h-5 w-5 text-blue-300" />
                    Availability Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                    <p className="text-sm text-blue-100/70">Current month</p>
                    <p className="mt-2 text-3xl font-semibold text-white">
                      {monthAvailableDays}
                    </p>
                    <p className="mt-1 text-sm text-blue-100/70">
                      days marked available in {format(focusDate, "MMMM")}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm text-blue-100/80">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full bg-blue-400" />
                      Weekly available
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full bg-white" />
                      Custom override
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full bg-slate-500" />
                      Unavailable
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="rounded-[32px] border-blue-100 bg-white/92 shadow-[0_24px_70px_-50px_rgba(37,99,235,0.35)]">
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Weekly Schedule Editor
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
                    {DAY_NAMES.map((day, index) => {
                      const schedule = getScheduleForDay(index);
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{day}</TableCell>
                          <TableCell>
                            {schedule ? (
                              <Badge className="rounded-full bg-green-600 text-white hover:bg-green-700">
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
                              onClick={() => openEdit(index)}
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
        </>
      ) : (
        !loadingProviders && (
          <div className="mt-12 rounded-[32px] border border-blue-100 bg-white/90 px-6 py-14 text-center text-muted-foreground shadow-[0_20px_60px_-45px_rgba(37,99,235,0.35)]">
            <CalendarDays className="mx-auto mb-4 h-10 w-10 opacity-35" />
            <p className="text-base">
              Select a provider above to inspect their month and year
              availability.
            </p>
          </div>
        )
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Schedule — {DAY_NAMES[editing.dayOfWeek]}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={editing.startTime}
                  onChange={(event) =>
                    setEditing((current) => ({
                      ...current,
                      startTime: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={editing.endTime}
                  onChange={(event) =>
                    setEditing((current) => ({
                      ...current,
                      endTime: event.target.value,
                    }))
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
                  onChange={(event) =>
                    setEditing((current) => ({
                      ...current,
                      breakStart: event.target.value,
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
                  onChange={(event) =>
                    setEditing((current) => ({
                      ...current,
                      breakEnd: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {saveError && (
              <p className="text-sm text-red-600">{saveError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getAvailabilityForDate(
  date: Date,
  schedules: Schedule[],
  overrides: ScheduleOverride[]
): DailyAvailability {
  const dateKey = format(date, "yyyy-MM-dd");
  const override = overrides.find((item) => item.date === dateKey);
  const schedule = schedules.find((item) => item.dayOfWeek === date.getDay());

  if (override && !override.available) {
    return {
      status: "off",
      label: "Unavailable",
      hours: null,
      breakHours: null,
      source: "override",
    };
  }

  const startTime = override?.startTime ?? schedule?.startTime ?? null;
  const endTime = override?.endTime ?? schedule?.endTime ?? null;

  if (!startTime || !endTime) {
    return {
      status: "off",
      label: "Unavailable",
      hours: null,
      breakHours: null,
      source: override ? "override" : "weekly",
    };
  }

  const isCustom = Boolean(
    override?.available && (override.startTime || override.endTime || !schedule)
  );

  return {
    status: isCustom ? "custom" : "available",
    label: isCustom ? "Custom hours" : "Available",
    hours: `${startTime} - ${endTime}`,
    breakHours:
      schedule?.breakStart && schedule.breakEnd
        ? `${schedule.breakStart} - ${schedule.breakEnd}`
        : null,
    source: override ? "override" : "weekly",
  };
}

function buildMonthDays(monthDate: Date) {
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 }),
  });
}

function countAvailableDaysForMonth(
  monthDate: Date,
  schedules: Schedule[],
  overrides: ScheduleOverride[]
) {
  return eachDayOfInterval({
    start: startOfMonth(monthDate),
    end: endOfMonth(monthDate),
  }).filter((date) => getAvailabilityForDate(date, schedules, overrides).status !== "off")
    .length;
}
