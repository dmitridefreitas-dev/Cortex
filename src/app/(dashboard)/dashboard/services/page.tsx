"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Service } from "@/types";

const emptyForm = {
  name: "",
  description: "",
  durationMinutes: "",
  price: "",
  category: "",
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchServices() {
    try {
      const res = await fetch("/api/services");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setServices(data.services);
    } catch (err) {
      console.error("Error fetching services:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchServices();
  }, []);

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          durationMinutes: Number(form.durationMinutes),
          price: Number(form.price),
          category: form.category || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create service");
      setForm(emptyForm);
      setDialogOpen(false);
      await fetchServices();
    } catch (err) {
      console.error("Error creating service:", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/services?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete service");
      await fetchServices();
    } catch (err) {
      console.error("Error deleting service:", err);
    } finally {
      setDeletingId(null);
    }
  }

  function formatPrice(price: number) {
    return `$${price.toFixed(2)}`;
  }

  function formatDuration(minutes: number) {
    return `${minutes} min`;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Services</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. General Consultation"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Brief description of the service"
                  value={form.description}
                  onChange={handleFormChange}
                  required
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="durationMinutes">Duration (minutes)</Label>
                  <Input
                    id="durationMinutes"
                    name="durationMinutes"
                    type="number"
                    min={1}
                    placeholder="30"
                    value={form.durationMinutes}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={form.price}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Category (optional)</Label>
                <Input
                  id="category"
                  name="category"
                  placeholder="e.g. Primary Care"
                  value={form.category}
                  onChange={handleFormChange}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setForm(emptyForm);
                    setDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Service"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Services</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading services...
            </p>
          ) : services.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No services found. Add your first service to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {service.description}
                    </TableCell>
                    <TableCell>{formatDuration(service.durationMinutes)}</TableCell>
                    <TableCell>{formatPrice(service.price)}</TableCell>
                    <TableCell>
                      {service.category ? (
                        <Badge variant="secondary">{service.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === service.id}
                        onClick={() => handleDelete(service.id)}
                        aria-label={`Delete ${service.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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
