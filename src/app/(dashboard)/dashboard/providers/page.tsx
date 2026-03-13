"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Plus, Trash2, Mail, Phone } from "lucide-react";
import type { Provider } from "@/types";

const EMPTY_FORM = {
  name: "",
  specialty: "",
  email: "",
  phone: "",
  bio: "",
};

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [editProvider, setEditProvider] = useState<Provider | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editOpen, setEditOpen] = useState(false);

  async function fetchProviders() {
    try {
      const res = await fetch("/api/providers");
      const data = await res.json();
      setProviders(data.providers ?? []);
    } catch (err) {
      console.error("Failed to fetch providers", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProviders();
  }, []);

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleEditFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm(EMPTY_FORM);
        setAddOpen(false);
        await fetchProviders();
      }
    } catch (err) {
      console.error("Failed to create provider", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/providers?id=${id}`, { method: "DELETE" });
      setProviders((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete provider", err);
    }
  }

  function openEdit(provider: Provider) {
    setEditProvider(provider);
    setEditForm({
      name: provider.name,
      specialty: provider.specialty,
      email: provider.email,
      phone: provider.phone,
      bio: provider.bio,
    });
    setEditOpen(true);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editProvider) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/providers?id=${editProvider.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditOpen(false);
        setEditProvider(null);
        await fetchProviders();
      }
    } catch (err) {
      console.error("Failed to update provider", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Providers</h1>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Provider</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="add-name">Name</Label>
                <Input
                  id="add-name"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="Dr. Jane Smith"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-specialty">Specialty</Label>
                <Input
                  id="add-specialty"
                  name="specialty"
                  value={form.specialty}
                  onChange={handleFormChange}
                  placeholder="General Practice"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-email">Email</Label>
                <Input
                  id="add-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleFormChange}
                  placeholder="jane@clinic.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-phone">Phone</Label>
                <Input
                  id="add-phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleFormChange}
                  placeholder="+1 (555) 000-0000"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-bio">Bio</Label>
                <Textarea
                  id="add-bio"
                  name="bio"
                  value={form.bio}
                  onChange={handleFormChange}
                  placeholder="Brief description..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Provider"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading providers...</p>
      ) : providers.length === 0 ? (
        <p className="text-muted-foreground">
          No providers yet. Click &quot;Add Provider&quot; to get started.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <Card key={provider.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{provider.name}</CardTitle>
                <p className="text-sm font-medium text-muted-foreground">
                  {provider.specialty}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{provider.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{provider.phone}</span>
                </div>
                {provider.bio && (
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {provider.bio}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEdit(provider)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(provider.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Provider</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                name="name"
                value={editForm.name}
                onChange={handleEditFormChange}
                placeholder="Dr. Jane Smith"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-specialty">Specialty</Label>
              <Input
                id="edit-specialty"
                name="specialty"
                value={editForm.specialty}
                onChange={handleEditFormChange}
                placeholder="General Practice"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                value={editForm.email}
                onChange={handleEditFormChange}
                placeholder="jane@clinic.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                name="phone"
                value={editForm.phone}
                onChange={handleEditFormChange}
                placeholder="+1 (555) 000-0000"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                name="bio"
                value={editForm.bio}
                onChange={handleEditFormChange}
                placeholder="Brief description..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
