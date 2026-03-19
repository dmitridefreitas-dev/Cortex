"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Edit, Calendar, Clock, Stethoscope, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import type { Patient, Appointment } from "@/types";

export default function PatientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
  });

  async function fetchData() {
    try {
      const patientRes = await fetch(`/api/patients`);
      const patientData = await patientRes.json();
      const foundPatient = patientData.patients?.find((p: Patient) => p.id === id);
      
      if (foundPatient) {
        setPatient(foundPatient);
        
        const aptsRes = await fetch(`/api/appointments`);
        const aptsData = await aptsRes.json();
        const patientApts = aptsData.appointments?.filter((a: Appointment) => a.patientId === id) || [];
        setAppointments(patientApts);
      }
    } catch (err) {
      console.error("Failed to load patient data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [id]);

  function openEditDialog() {
    if (!patient) return;
    setEditForm({
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth || "",
    });
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    setSaving(true);
    try {
      const res = await fetch("/api/patients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editForm }),
      });
      if (res.ok) {
        setEditOpen(false);
        await fetchData();
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8">Loading patient profile...</div>;
  if (!patient) return <div className="p-8">Patient not found.</div>;

  const upcomingApts = appointments.filter(a => a.status === "confirmed" && new Date(a.startTime) >= new Date());
  const pastApts = appointments.filter(a => new Date(a.startTime) < new Date());

  return (
    <div className="space-y-6 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/patients')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{patient.firstName} {patient.lastName}</h1>
            <p className="text-sm text-muted-foreground">ID: {patient.id}</p>
          </div>
        </div>
        <Button variant="outline" onClick={openEditDialog}>
          <Edit className="mr-2 h-4 w-4" /> Edit Profile
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-muted-foreground mr-2">Email:</span>
                {patient.email}
              </div>
              <div>
                <span className="font-medium text-muted-foreground mr-2">Phone:</span>
                {patient.phone}
              </div>
              <div>
                <span className="font-medium text-muted-foreground mr-2">DOB:</span>
                {patient.dateOfBirth || "Unknown"}
              </div>
              <div>
                <span className="font-medium text-muted-foreground mr-2">Registered:</span>
                {format(new Date(patient.createdAt), "MMM d, yyyy")}
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-100 bg-red-50/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" /> Medical History (Intake)
              </CardTitle>
              <CardDescription>Populated from online intake forms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Allergies</h4>
                {patient.medicalHistory?.allergies?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {patient.medicalHistory.allergies.map((a, i) => (
                      <Badge key={i} variant="destructive">{a}</Badge>
                    ))}
                  </div>
                ) : <span className="text-sm text-muted-foreground">None reported</span>}
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium mb-1">Current Medications</h4>
                {patient.medicalHistory?.medications?.length ? (
                  <ul className="list-disc pl-4 text-sm text-slate-700 space-y-1">
                    {patient.medicalHistory.medications.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                ) : <span className="text-sm text-muted-foreground">None reported</span>}
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-1">Conditions/Hx</h4>
                {patient.medicalHistory?.conditions?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {patient.medicalHistory.conditions.map((c, i) => (
                      <Badge key={i} variant="secondary">{c}</Badge>
                    ))}
                  </div>
                ) : <span className="text-sm text-muted-foreground">None reported</span>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 md:col-span-2">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="font-medium text-sm text-muted-foreground mb-3 flex items-center">
                  <Calendar className="mr-2 h-4 w-4" /> Upcoming ({upcomingApts.length})
                </h3>
                {upcomingApts.length === 0 ? (
                  <div className="text-center p-4 border rounded-md border-dashed text-sm text-muted-foreground">
                    No upcoming appointments
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingApts.map(apt => (
                      <div key={apt.id} className="flex justify-between items-center p-3 border rounded-md bg-slate-50">
                        <div>
                          <p className="font-medium">{format(new Date(apt.startTime), "EEEE, MMM d, yyyy")}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {format(new Date(apt.startTime), "h:mm a")} 
                            <span className="mx-1">•</span>
                            <Stethoscope className="w-3 h-3" /> {apt.providerName || "Unknown provider"}
                            {apt.serviceName && <><span className="mx-1">•</span>{apt.serviceName}</>}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {apt.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8">
                <h3 className="font-medium text-sm text-muted-foreground mb-3 flex items-center">
                  <Clock className="mr-2 h-4 w-4" /> Past History ({pastApts.length})
                </h3>
                {pastApts.length === 0 ? (
                  <div className="text-center p-4 border rounded-md border-dashed text-sm text-muted-foreground">
                    No past appointments
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {pastApts.map(apt => (
                      <div key={apt.id} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
                        <div className="text-slate-600">
                          {format(new Date(apt.startTime), "MMM d, yyyy")}
                          {apt.providerName && <span className="ml-2 text-muted-foreground">— {apt.providerName}</span>}
                          {apt.serviceName && <span className="ml-1 text-muted-foreground">({apt.serviceName})</span>}
                        </div>
                        <Badge variant="secondary" className="opacity-70">
                          {apt.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Patient Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
              <Input
                id="edit-dateOfBirth"
                type="date"
                value={editForm.dateOfBirth}
                onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
              />
            </div>
            <Button onClick={handleSaveEdit} disabled={saving || !editForm.firstName || !editForm.lastName || !editForm.email}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
