"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  addDays,
  parseISO,
  isSameDay,
  addMinutes,
} from "date-fns";
import {
  Plus,
  Calendar as CalendarIcon,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Appointment,
  AppointmentStatus,
  Provider,
  Service,
  Patient,
  TimeSlot,
} from "@/types";

const STATUS_BADGE_CLASSES: Record<AppointmentStatus, string> = {
  confirmed: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  no_show: "bg-orange-100 text-orange-800 border-orange-200",
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

const CALENDAR_COLORS: Record<AppointmentStatus, { bg: string; text: string }> = {
  confirmed: { bg: "bg-blue-100", text: "text-blue-700" },
  completed: { bg: "bg-green-100", text: "text-green-700" },
  cancelled: { bg: "bg-red-100", text: "text-red-200" },
  no_show: { bg: "bg-amber-100", text: "text-amber-700" },
};

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);

function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function AppointmentsPage() {
  const today = new Date();

  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState(
    format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")
  );
  const [dateTo, setDateTo] = useState(
    format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [calendarWeekStart, setCalendarWeekStart] = useState(
    startOfWeek(today, { weekStartsOn: 1 })
  );

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(calendarWeekStart, i)),
    [calendarWeekStart]
  );

  useEffect(() => {
    if (viewMode === "calendar") {
      setDateFrom(format(calendarWeekStart, "yyyy-MM-dd"));
      setDateTo(format(addDays(calendarWeekStart, 6), "yyyy-MM-dd"));
    }
  }, [calendarWeekStart, viewMode]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/appointments?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch appointments");
      const data: { appointments: Appointment[] } = await res.json();
      setAppointments(data.appointments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, statusFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (!createDialogOpen) return;
    Promise.all([
      fetch("/api/patients").then((r) => r.json()),
      fetch("/api/providers").then((r) => r.json()),
      fetch("/api/services").then((r) => r.json()),
    ]).then(([pData, prData, sData]) => {
      setPatients(pData.patients ?? []);
      setProviders(prData.providers ?? []);
      setServices(sData.services ?? []);
    });
  }, [createDialogOpen]);

  useEffect(() => {
    if (!selectedProviderId || !selectedServiceId || !selectedDate) {
      setAvailableSlots([]);
      return;
    }
    const params = new URLSearchParams({
      providerId: selectedProviderId,
      serviceId: selectedServiceId,
      date: selectedDate,
    });
    fetch(`/api/availability?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setAvailableSlots(data.slots ?? []))
      .catch(() => setAvailableSlots([]));
  }, [selectedProviderId, selectedServiceId, selectedDate]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const q = patientSearch.toLowerCase();
    return patients.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
    );
  }, [patients, patientSearch]);

  async function handleCancel(id: string) {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    setCancellingId(id);
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "cancelled" }),
      });
      if (!res.ok) throw new Error("Failed to cancel appointment");
      await fetchAppointments();
      if (selectedAppointment?.id === id) setDetailDialogOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setCancellingId(null);
    }
  }

  async function handleStatusChange(id: string, status: "completed" | "no_show") {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error(`Failed to mark as ${status}`);
      await fetchAppointments();
      if (selectedAppointment?.id === id) setDetailDialogOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleCreateAppointment() {
    if (!selectedPatientId || !selectedProviderId || !selectedServiceId || !selectedSlot) return;
    setCreating(true);
    setCreateError(null);

    const service = services.find((s) => s.id === selectedServiceId);
    if (!service) return;

    const endTime = addMinutes(parseISO(selectedSlot), service.durationMinutes).toISOString();

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId: "clinic-1",
          providerId: selectedProviderId,
          patientId: selectedPatientId,
          serviceId: selectedServiceId,
          startTime: selectedSlot,
          endTime,
          status: "confirmed",
          bookedVia: "dashboard",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create appointment");
      }
      setCreateDialogOpen(false);
      resetCreateForm();
      await fetchAppointments();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  function resetCreateForm() {
    setPatientSearch("");
    setSelectedPatientId("");
    setSelectedProviderId("");
    setSelectedServiceId("");
    setSelectedDate("");
    setSelectedSlot("");
    setCreateError(null);
  }

  function handleThisWeek() {
    const ws = startOfWeek(today, { weekStartsOn: 1 });
    setCalendarWeekStart(ws);
    setDateFrom(format(ws, "yyyy-MM-dd"));
    setDateTo(format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"));
  }

  function handleToday() {
    const todayStr = format(today, "yyyy-MM-dd");
    setDateFrom(todayStr);
    setDateTo(todayStr);
  }

  function navigateWeek(direction: number) {
    setCalendarWeekStart((prev) => addWeeks(prev, direction));
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border">
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
            >
              <CalendarIcon className="mr-1 h-4 w-4" />
              Calendar
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <ListIcon className="mr-1 h-4 w-4" />
              List
            </Button>
          </div>
          <Button
            onClick={() => {
              resetCreateForm();
              setCreateDialogOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            New Appointment
          </Button>
        </div>
      </div>

      {viewMode === "calendar" && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {format(calendarWeekStart, "MMM d")} –{" "}
                {format(addDays(calendarWeekStart, 6), "MMM d, yyyy")}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateWeek(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleThisWeek}>
              Today
            </Button>
          </div>

          <Card>
            <CardContent className="overflow-x-auto p-0">
              {loading ? (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Loading appointments...
                </div>
              ) : error ? (
                <div className="px-6 py-8 text-center text-sm text-red-600">{error}</div>
              ) : (
                <div className="grid min-w-[800px] grid-cols-[60px_repeat(7,1fr)]">
                  <div className="border-b border-r p-2" />
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={`border-b p-2 text-center text-xs font-medium ${
                        isSameDay(day, today) ? "bg-blue-50 text-blue-700" : ""
                      }`}
                    >
                      <div>{format(day, "EEE")}</div>
                      <div className="text-lg">{format(day, "d")}</div>
                    </div>
                  ))}

                  <div className="border-r">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="flex h-[60px] items-start justify-end border-b pr-2 pt-0.5 text-[10px] text-muted-foreground"
                      >
                        {format(new Date(2000, 0, 1, hour), "h a")}
                      </div>
                    ))}
                  </div>

                  {weekDays.map((day) => {
                    const dayAppts = appointments.filter((a) =>
                      isSameDay(parseISO(a.startTime), day)
                    );
                    return (
                      <div
                        key={day.toISOString()}
                        className={`relative ${isSameDay(day, today) ? "bg-blue-50/30" : ""}`}
                      >
                        {HOURS.map((hour) => (
                          <div key={hour} className="h-[60px] border-b border-l" />
                        ))}
                        {dayAppts.map((appt) => {
                          const start = parseISO(appt.startTime);
                          const end = parseISO(appt.endTime);
                          const startHour = start.getHours() + start.getMinutes() / 60;
                          const endHour = end.getHours() + end.getMinutes() / 60;
                          if (startHour >= 18 || endHour <= 8) return null;
                          const clampedStart = Math.max(startHour, 8);
                          const clampedEnd = Math.min(endHour, 18);
                          const top = (clampedStart - 8) * 60;
                          const height = Math.max((clampedEnd - clampedStart) * 60, 20);
                          const colors = CALENDAR_COLORS[appt.status];
                          return (
                            <button
                              key={appt.id}
                              type="button"
                              className={`absolute left-0.5 right-0.5 cursor-pointer overflow-hidden rounded px-1 py-0.5 text-left text-[11px] leading-tight ${colors.bg} ${colors.text}`}
                              style={{ top, height }}
                              onClick={() => {
                                setSelectedAppointment(appt);
                                setDetailDialogOpen(true);
                              }}
                              title={`${appt.patientName ?? appt.patientId} — ${appt.serviceName ?? appt.serviceId}`}
                            >
                              <div className="truncate font-medium">
                                {appt.patientName ?? appt.patientId}
                              </div>
                              {height > 30 && (
                                <div className="truncate opacity-75">
                                  {appt.serviceName ?? appt.serviceId}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {viewMode === "list" && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="date-from">From</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-40"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="date-to">To</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-40"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "")}>
                    <SelectTrigger id="status-filter" className="w-36">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleToday}>
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleThisWeek}>
                    This Week
                  </Button>
                  <Button size="sm" onClick={fetchAppointments}>
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {loading
                  ? "Loading..."
                  : `${appointments.length} appointment${appointments.length !== 1 ? "s" : ""}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {error ? (
                <div className="px-6 py-8 text-center text-sm text-red-600">{error}</div>
              ) : loading ? (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Loading appointments...
                </div>
              ) : appointments.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No appointments found for the selected range.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Booked Via</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appt) => {
                      const start = new Date(appt.startTime);
                      const end = new Date(appt.endTime);
                      const isConfirmed = appt.status === "confirmed";
                      return (
                        <TableRow key={appt.id}>
                          <TableCell className="whitespace-nowrap font-medium">
                            {format(start, "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {format(start, "h:mm a")} – {format(end, "h:mm a")}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="font-medium text-foreground">
                              {appt.patientName || (
                                <span className="font-mono text-xs">{appt.patientId}</span>
                              )}
                            </div>
                            {appt.notes && (
                              <div
                                className="max-w-[200px] truncate text-xs"
                                title={appt.notes}
                              >
                                Reason: {appt.notes}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {appt.providerName || (
                              <span className="font-mono text-xs">{appt.providerId}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {appt.serviceName || (
                              <span className="font-mono text-xs">{appt.serviceId}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={appt.status} />
                          </TableCell>
                          <TableCell className="capitalize text-muted-foreground">
                            {appt.bookedVia}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isConfirmed && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={updatingId === appt.id}
                                    onClick={() => handleStatusChange(appt.id, "completed")}
                                    className="text-green-600 hover:bg-green-50"
                                  >
                                    Complete
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={updatingId === appt.id}
                                    onClick={() => handleStatusChange(appt.id, "no_show")}
                                    className="text-amber-600 hover:bg-amber-50"
                                  >
                                    No Show
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!isConfirmed || cancellingId === appt.id}
                                onClick={() => handleCancel(appt.id)}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                              >
                                {cancellingId === appt.id ? "Cancelling..." : "Cancel"}
                              </Button>
                            </div>
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
      )}

      {/* Appointment Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Patient</div>
                  <div className="font-medium">
                    {selectedAppointment.patientName ?? selectedAppointment.patientId}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Provider</div>
                  <div className="font-medium">
                    {selectedAppointment.providerName ?? selectedAppointment.providerId}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Service</div>
                  <div className="font-medium">
                    {selectedAppointment.serviceName ?? selectedAppointment.serviceId}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <div>
                    <StatusBadge status={selectedAppointment.status} />
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Date</div>
                  <div className="font-medium">
                    {format(parseISO(selectedAppointment.startTime), "MMM d, yyyy")}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Time</div>
                  <div className="font-medium">
                    {format(parseISO(selectedAppointment.startTime), "h:mm a")} –{" "}
                    {format(parseISO(selectedAppointment.endTime), "h:mm a")}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Booked Via</div>
                  <Badge variant="outline" className="mt-0.5 capitalize">
                    {selectedAppointment.bookedVia}
                  </Badge>
                </div>
              </div>
              {selectedAppointment.notes && (
                <div className="text-sm">
                  <div className="text-muted-foreground">Notes</div>
                  <div>{selectedAppointment.notes}</div>
                </div>
              )}
              {selectedAppointment.status === "confirmed" && (
                <div className="flex gap-2 border-t pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updatingId === selectedAppointment.id}
                    onClick={() => handleStatusChange(selectedAppointment.id, "completed")}
                    className="text-green-600 hover:bg-green-50"
                  >
                    Mark Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updatingId === selectedAppointment.id}
                    onClick={() => handleStatusChange(selectedAppointment.id, "no_show")}
                    className="text-amber-600 hover:bg-amber-50"
                  >
                    Mark No Show
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={cancellingId === selectedAppointment.id}
                    onClick={() => handleCancel(selectedAppointment.id)}
                    className="ml-auto text-red-600 hover:bg-red-50"
                  >
                    {cancellingId === selectedAppointment.id ? "Cancelling..." : "Cancel"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Appointment Dialog */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Patient</Label>
              <Input
                placeholder="Search patients by name..."
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setSelectedPatientId("");
                }}
              />
              {patientSearch && !selectedPatientId && filteredPatients.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-md border">
                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full cursor-pointer px-3 py-1.5 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        setSelectedPatientId(p.id);
                        setPatientSearch(`${p.firstName} ${p.lastName}`);
                      }}
                    >
                      {p.firstName} {p.lastName}
                      <span className="ml-2 text-xs text-muted-foreground">{p.email}</span>
                    </button>
                  ))}
                </div>
              )}
              {patientSearch && !selectedPatientId && filteredPatients.length === 0 && (
                <p className="text-xs text-muted-foreground">No patients found</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Provider</Label>
              <Select value={selectedProviderId} onValueChange={(v) => setSelectedProviderId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Service</Label>
              <Select value={selectedServiceId} onValueChange={(v) => setSelectedServiceId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot("");
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Time</Label>
              {!selectedProviderId || !selectedServiceId || !selectedDate ? (
                <p className="text-xs text-muted-foreground">
                  Select provider, service, and date first
                </p>
              ) : availableSlots.length === 0 ? (
                <p className="text-xs text-muted-foreground">No available slots</p>
              ) : (
                <Select value={selectedSlot} onValueChange={(v) => setSelectedSlot(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map((slot) => (
                      <SelectItem key={slot.start} value={slot.start}>
                        {format(parseISO(slot.start), "h:mm a")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {createError && <p className="text-sm text-red-600">{createError}</p>}

            <Button
              className="w-full"
              disabled={
                !selectedPatientId ||
                !selectedProviderId ||
                !selectedServiceId ||
                !selectedSlot ||
                creating
              }
              onClick={handleCreateAppointment}
            >
              {creating ? "Creating..." : "Create Appointment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
