"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Client, Project, ProjectCategory, ProjectStatus } from "@/types";

const categories: ProjectCategory[] = ["full_time", "freelance", "solopreneur"];
const statuses: ProjectStatus[] = ["lead", "quoted", "in_progress", "completed", "archived"];

const emptyForm = {
  name: "",
  client_id: "",
  category: "freelance" as ProjectCategory,
  status: "lead" as ProjectStatus,
  deadline: "",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchAll();
  };

  const fetchAll = () => {
    return Promise.all([api.get<Project[]>("/projects"), api.get<Client[]>("/clients")])
      .then(([p, c]) => {
        setProjects(p);
        setClients(c);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const clientName = (id: number | null) => clients.find((c) => c.id === id)?.name ?? "-";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post<Project>("/projects", {
        name: form.name,
        client_id: form.client_id ? Number(form.client_id) : null,
        category: form.category,
        status: form.status,
        deadline: form.deadline || null,
      });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, status: ProjectStatus) => {
    await api.patch<Project>(`/projects/${id}`, { status });
    load();
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/projects/${id}`);
    load();
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">Projects</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 rounded border border-black/10 p-4 dark:border-white/10">
        <input
          className="col-span-2 rounded border border-black/20 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
          placeholder="Project name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <select
          className="rounded border border-black/20 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
          value={form.client_id}
          onChange={(e) => setForm({ ...form, client_id: e.target.value })}
        >
          <option value="">No client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="rounded border border-black/20 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value as ProjectCategory })}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="rounded border border-black/20 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="rounded border border-black/20 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
        />
        <button
          type="submit"
          disabled={submitting}
          className="col-span-2 rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add project"}
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
              <th className="py-2 pr-4">Client</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Deadline</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-b border-black/5 dark:border-white/5">
                <td className="py-2 pr-4">{p.name}</td>
                <td className="py-2 pr-4">{clientName(p.client_id)}</td>
                <td className="py-2 pr-4">{p.category}</td>
                <td className="py-2 pr-4">
                  <select
                    className="rounded border border-black/20 bg-transparent px-2 py-1 text-xs dark:border-white/20"
                    value={p.status}
                    onChange={(e) => handleStatusChange(p.id, e.target.value as ProjectStatus)}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-4">{p.deadline ?? "-"}</td>
                <td className="py-2 pr-4">
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">
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
