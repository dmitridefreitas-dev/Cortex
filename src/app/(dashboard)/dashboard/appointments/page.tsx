"use client";

import { useEffect, useState, useCallback } from "react";
import { format, startOfWeek, endOfWeek } from "date-fns";
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
import type { Appointment, AppointmentStatus } from "@/types";

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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState(
    format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")
  );
  const [dateTo, setDateTo] = useState(
    format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel appointment");
    } finally {
      setCancellingId(null);
    }
  }

  function handleThisWeek() {
    setDateFrom(format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"));
    setDateTo(format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"));
  }

  function handleToday() {
    const todayStr = format(today, "yyyy-MM-dd");
    setDateFrom(todayStr);
    setDateTo(todayStr);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Appointments</h1>

      {/* Filters */}
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

      {/* Table */}
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
                  const isCancellable = appt.status === "confirmed";
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
                          {appt.patientName || <span className="font-mono text-xs">{appt.patientId}</span>}
                        </div>
                        {appt.notes && (
                          <div className="text-xs truncate max-w-[200px]" title={appt.notes}>
                            Reason: {appt.notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {appt.providerName || <span className="font-mono text-xs">{appt.providerId}</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {appt.serviceName || <span className="font-mono text-xs">{appt.serviceId}</span>}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={appt.status} />
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {appt.bookedVia}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!isCancellable || cancellingId === appt.id}
                          onClick={() => handleCancel(appt.id)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                        >
                          {cancellingId === appt.id ? "Cancelling..." : "Cancel"}
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
    </div>
  );
}
