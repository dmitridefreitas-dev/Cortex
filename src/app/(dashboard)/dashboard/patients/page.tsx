"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Search, Trash2, UserCircle } from "lucide-react";
import { format } from "date-fns";
import type { Patient } from "@/types";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/patients")
      .then((r) => r.json())
      .then((d) => setPatients(d.patients || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(patient: Patient) {
    if (!confirm(`Delete ${patient.firstName} ${patient.lastName}? This will also remove all their appointments and intake responses.`)) return;
    setDeletingId(patient.id);
    try {
      const res = await fetch(`/api/patients?id=${patient.id}`, { method: "DELETE" });
      if (res.ok) {
        setPatients((prev) => prev.filter((p) => p.id !== patient.id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.phone.includes(q)
    );
  });

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <UserCircle className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Patients</h1>
        <Badge variant="secondary" className="ml-2">
          {patients.length} total
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Patient Records</CardTitle>
          <div className="relative mt-2 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading patients...</p>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <UserCircle className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p>
                {patients.length === 0
                  ? "No patients registered yet. Patients will appear here after booking through the chat."
                  : "No patients match your search."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.firstName} {p.lastName}
                    </TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell>{p.phone}</TableCell>
                    <TableCell>
                      {p.dateOfBirth
                        ? format(new Date(p.dateOfBirth), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(p.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(p)}
                        disabled={deletingId === p.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
