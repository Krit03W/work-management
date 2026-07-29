"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/card";
import { buttonStyles, dangerLinkStyles, inputStyles } from "@/components/ui";
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
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Clients</h1>

      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            className={inputStyles}
            placeholder="Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className={inputStyles}
            placeholder="Company"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
          <input
            className={inputStyles}
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className={inputStyles}
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <button type="submit" disabled={submitting} className={`${buttonStyles} sm:col-span-2 justify-center`}>
            <Plus size={14} />
            {submitting ? "Adding..." : "Add client"}
          </button>
        </form>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Card delay={0.05} className="p-0">
        {loading ? (
          <p className="p-5 text-sm text-muted">Loading...</p>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted">
            <Users size={20} className="text-muted" />
            No clients yet.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="px-5 py-3">{c.name}</td>
                  <td className="px-5 py-3 text-muted">{c.company ?? "-"}</td>
                  <td className="px-5 py-3 text-muted">{c.email ?? "-"}</td>
                  <td className="px-5 py-3 text-muted">{c.phone ?? "-"}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleDelete(c.id)} className={dangerLinkStyles} aria-label="Delete client">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
