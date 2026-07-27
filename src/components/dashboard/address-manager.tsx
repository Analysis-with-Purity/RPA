"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus, Star } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NIGERIAN_STATES } from "@/lib/nigerian-states";

interface AddressData {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  country: string;
  isDefault: boolean;
}

const emptyForm = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  city: "",
  state: "",
  country: "Nigeria",
  isDefault: false,
};

export function AddressManager({ initialAddresses }: { initialAddresses: AddressData[] }) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function startAdd() {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(true);
  }

  function startEdit(addr: AddressData) {
    setForm({ ...addr });
    setEditing(addr.id);
    setShowForm(true);
  }

  async function remove(id: string) {
    if (!confirm("Remove this address?")) return;
    await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = editing ? `/api/account/addresses/${editing}` : "/api/account/addresses";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      router.refresh();
      const json = await res.json();
      if (editing) {
        setAddresses((prev) => prev.map((a) => (a.id === editing ? json.address : a)));
      } else {
        setAddresses((prev) => [json.address, ...prev]);
      }
    }
  }

  return (
    <div className="space-y-6">
      {addresses.length === 0 && !showForm && (
        <div className="bg-white border border-line p-10 text-center text-sm text-ink/50">
          No saved addresses yet.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div key={addr.id} className="bg-white border border-line p-5 relative">
            {addr.isDefault && (
              <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] uppercase tracking-wide text-gold">
                <Star size={11} fill="currentColor" /> Default
              </span>
            )}
            <p className="text-xs uppercase tracking-wide text-ink/40 mb-2">{addr.label}</p>
            <p className="text-sm font-medium">{addr.fullName}</p>
            <p className="text-sm text-ink/60">{addr.phone}</p>
            <p className="text-sm text-ink/60 mt-2 leading-relaxed">
              {addr.line1}, {addr.city}, {addr.state}, {addr.country}
            </p>
            <div className="flex items-center gap-4 mt-4">
              <button onClick={() => startEdit(addr)} className="flex items-center gap-1 text-xs text-royal">
                <Pencil size={13} /> Edit
              </button>
              <button onClick={() => remove(addr.id)} className="flex items-center gap-1 text-xs text-red-600">
                <Trash2 size={13} /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {!showForm && (
        <Button variant="outline" onClick={startAdd} className="inline-flex items-center gap-2">
          <Plus size={14} /> Add New Address
        </Button>
      )}

      {showForm && (
        <form onSubmit={onSubmit} className="bg-white border border-line p-6 space-y-4 max-w-lg">
          <h3 className="font-serif text-lg">{editing ? "Edit Address" : "New Address"}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="label">Label</Label>
              <Input id="label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Home / Office" />
            </div>
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="line1">Delivery Address</Label>
            <Input id="line1" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <select
                id="state"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                required
                className="w-full border border-line bg-white px-4 py-3 text-sm focus:outline-none focus:border-royal"
              >
                <option value="">Select state</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="accent-royal"
            />
            Set as default address
          </label>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Address"}</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}
