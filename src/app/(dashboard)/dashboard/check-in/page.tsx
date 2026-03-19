"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import {
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Appointment, AppointmentStatus } from "@/types";

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; color: string; border: string; bg: string }
> = {
  confirmed: {
    label: "Waiting",
    color: "text-blue-700",
    border: "border-l-blue-500",
    bg: "bg-blue-50",
  },
  completed: {
    label: "Done",
    color: "text-green-700",
    border: "border-l-green-500",
    bg: "bg-green-50",
  },
  no_show: {
    label: "No Show",
    color: "text-orange-700",
    border: "border-l-orange-500",
    bg: "bg-orange-50",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-700",
    border: "border-l-red-400",
    bg: "bg-red-50",
  },
};

const BADGE_VARIANTS: Record<AppointmentStatus, string> = {
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  no_show: "bg-orange-100 text-orange-800 border-orange-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export default function CheckInPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const fetchTodayAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [confirmedRes, completedRes, noShowRes] = await Promise.all([
        fetch(
          `/api/appointments?dateFrom=${today}&dateTo=${today}&status=confirmed`
        ),
        fetch(
          `/api/appointments?dateFrom=${today}&dateTo=${today}&status=completed`
        ),
        fetch(
          `/api/appointments?dateFrom=${today}&dateTo=${today}&status=no_show`
        ),
      ]);

      if (!confirmedRes.ok || !completedRes.ok || !noShowRes.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const [confirmedData, completedData, noShowData] = await Promise.all([
        confirmedRes.json(),
        completedRes.json(),
        noShowRes.json(),
      ]);

      const all: Appointment[] = [
        ...(confirmedData.appointments ?? []),
        ...(completedData.appointments ?? []),
        ...(noShowData.appointments ?? []),
      ];

      all.sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );

      setAppointments(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchTodayAppointments();
  }, [fetchTodayAppointments]);

  async function handleStatusChange(
    id: string,
    status: "completed" | "no_show"
  ) {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error(`Failed to mark as ${status}`);
      await fetchTodayAppointments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setUpdatingId(null);
    }
  }

  const confirmed = appointments.filter((a) => a.status === "confirmed");
  const completed = appointments.filter((a) => a.status === "completed");
  const noShows = appointments.filter((a) => a.status === "no_show");
  const totalCount = appointments.length;
  const completedCount = completed.length;
  const remainingCount = confirmed.length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Check-In Queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchTodayAppointments}
          disabled={loading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              <Clock className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCount}</p>
              <p className="text-xs text-muted-foreground">Total today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <UserCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{remainingCount}</p>
              <p className="text-xs text-muted-foreground">Waiting</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <XCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{noShows.length}</p>
              <p className="text-xs text-muted-foreground">No Show</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading today&apos;s appointments...
        </div>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No appointments scheduled for today.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => {
            const config = STATUS_CONFIG[appt.status];
            const start = new Date(appt.startTime);
            const end = new Date(appt.endTime);
            const isUpdating = updatingId === appt.id;
            const isConfirmed = appt.status === "confirmed";

            return (
              <Card
                key={appt.id}
                className={`border-l-4 ${config.border} transition-colors`}
              >
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-4">
                    <div className="min-w-[90px] text-center">
                      <p className="text-sm font-semibold">
                        {format(start, "h:mm a")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(end, "h:mm a")}
                      </p>
                    </div>

                    <div className="h-10 w-px bg-border" />

                    <div className="min-w-0">
                      <p className="font-medium">
                        {appt.patientName || appt.patientId}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{appt.providerName || appt.providerId}</span>
                        <span className="text-border">·</span>
                        <span>{appt.serviceName || appt.serviceId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`${BADGE_VARIANTS[appt.status]} whitespace-nowrap`}
                    >
                      {config.label}
                    </Badge>

                    {isConfirmed && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isUpdating}
                          onClick={() =>
                            handleStatusChange(appt.id, "completed")
                          }
                          className="text-green-700 hover:bg-green-50 hover:text-green-800"
                        >
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isUpdating}
                          onClick={() =>
                            handleStatusChange(appt.id, "no_show")
                          }
                          className="text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                        >
                          <XCircle className="mr-1.5 h-3.5 w-3.5" />
                          No Show
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
