"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Client } from "@/types";

const emptyForm = { name: "", company: "", email: "", phone: "" };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchClients();
  };

  const fetchClients = () => {
    return api
      .get<Client[]>("/clients")
      .then(setClients)
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post<Client>("/clients", {
        name: form.name,
        company: form.company || null,
        email: form.email || null,
        phone: form.phone || null,
      });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/clients/${id}`);
    load();
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">Clients</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 rounded border border-black/10 p-4 dark:border-white/10">
        <input
          className="rounded border border-black/20 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
          placeholder="Name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="rounded border border-black/20 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
          placeholder="Company"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
        />
        <input
          className="rounded border border-black/20 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="rounded border border-black/20 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <button
          type="submit"
          disabled={submitting}
          className="col-span-2 rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add client"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-black/60 dark:text-white/60">Loading...</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 dark:border-white/10">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Company</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Phone</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-black/5 dark:border-white/5">
                <td className="py-2 pr-4">{c.name}</td>
                <td className="py-2 pr-4">{c.company ?? "-"}</td>
                <td className="py-2 pr-4">{c.email ?? "-"}</td>
                <td className="py-2 pr-4">{c.phone ?? "-"}</td>
                <td className="py-2 pr-4">
                  <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
