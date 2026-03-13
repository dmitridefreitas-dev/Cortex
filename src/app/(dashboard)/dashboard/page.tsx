"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Stethoscope, Clock } from "lucide-react";

interface DashboardStats {
  appointmentsToday: number;
  totalPatients: number;
  newPatientsLast30: number;
  totalServices: number;
  totalProviders: number;
  appointmentsTotal: number;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <div className="text-2xl font-bold">-</div> : (
              <div className="text-2xl font-bold">{stats?.appointmentsToday || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Checked in or confirmed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Patients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <div className="text-2xl font-bold">-</div> : (
              <div className="text-2xl font-bold">{stats?.totalPatients || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {stats?.newPatientsLast30 ? `+${stats.newPatientsLast30} from last month` : "Registered patients"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Providers
            </CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <div className="text-2xl font-bold">-</div> : (
              <div className="text-2xl font-bold">{stats?.totalProviders || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Active providers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Services
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <div className="text-2xl font-bold">-</div> : (
              <div className="text-2xl font-bold">{stats?.totalServices || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Available services</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Welcome to Cortex! Your AI receptionist is ready. Here&apos;s what you can do:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong>Patient Chat</strong> - Patients interact with your AI receptionist at <a href="/chat" target="_blank" className="text-blue-600 underline">/chat</a>.</li>
              <li><strong>Appointments</strong> - View and manage all bookings from the Appointments page.</li>
              <li><strong>Providers</strong> - Manage your healthcare providers and their details.</li>
              <li><strong>Services</strong> - Configure the services your clinic offers.</li>
              <li><strong>Schedules</strong> - Set provider availability and working hours.</li>
              <li><strong>Patients</strong> - View and manage patient records.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
