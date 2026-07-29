"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/card";
import { buttonStyles, dangerLinkStyles, inputStyles } from "@/components/ui";
import type { Client, Project, ProjectCategory, ProjectStatus } from "@/types";

const categories: ProjectCategory[] = ["full_time", "freelance", "solopreneur"];
const statuses: ProjectStatus[] = ["lead", "quoted", "in_progress", "completed", "archived"];

const statusDot: Record<ProjectStatus, string> = {
  lead: "bg-zinc-400",
  quoted: "bg-amber-400",
  in_progress: "bg-accent",
  completed: "bg-emerald-400",
  archived: "bg-zinc-300 dark:bg-zinc-600",
};

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
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Projects</h1>

      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            className={`${inputStyles} sm:col-span-2`}
            placeholder="Project name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <select
            className={inputStyles}
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
            className={inputStyles}
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
            className={inputStyles}
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
            className={inputStyles}
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />
          <button type="submit" disabled={submitting} className={`${buttonStyles} sm:col-span-2 justify-center`}>
            <Plus size={14} />
            {submitting ? "Adding..." : "Add project"}
          </button>
        </form>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Card delay={0.05} className="p-0">
        {loading ? (
          <p className="p-5 text-sm text-muted">Loading...</p>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted">
            <Briefcase size={20} className="text-muted" />
            No projects yet.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Deadline</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="px-5 py-3">{p.name}</td>
                  <td className="px-5 py-3 text-muted">{clientName(p.client_id)}</td>
                  <td className="px-5 py-3 text-muted">{p.category}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${statusDot[p.status]}`} />
                      <select
                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none transition-colors focus:border-accent"
                        value={p.status}
                        onChange={(e) => handleStatusChange(p.id, e.target.value as ProjectStatus)}
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted">{p.deadline ?? "-"}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleDelete(p.id)} className={dangerLinkStyles} aria-label="Delete project">
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
