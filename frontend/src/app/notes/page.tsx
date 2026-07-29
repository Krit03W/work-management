"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Note, Project } from "@/types";

const emptyForm = { title: "", content: "", project_id: "" };

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchAll();
  };

  const fetchAll = () => {
    return Promise.all([api.get<Note[]>("/notes"), api.get<Project[]>("/projects")])
      .then(([n, p]) => {
        setNotes(n);
        setProjects(p);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const projectName = (id: number | null) => projects.find((p) => p.id === id)?.name ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post<Note>("/notes", {
        title: form.title || null,
        content: form.content,
        project_id: form.project_id ? Number(form.project_id) : null,
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
    await api.delete(`/notes/${id}`);
    load();
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">Notes</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded border border-black/10 p-4 dark:border-white/10">
        <div className="flex gap-3">
          <input
            className="flex-1 rounded border border-black/20 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
            placeholder="Title (optional)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <select
            className="rounded border border-black/20 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
            value={form.project_id}
            onChange={(e) => setForm({ ...form, project_id: e.target.value })}
          >
            <option value="">Unassigned</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <textarea
          className="rounded border border-black/20 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
          placeholder="Note content *"
          rows={3}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Add note"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-black/60 dark:text-white/60">Loading...</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded border border-black/10 p-4 dark:border-white/10">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium">{n.title ?? "Untitled"}</span>
                <div className="flex items-center gap-3 text-xs text-black/60 dark:text-white/60">
                  {projectName(n.project_id) && <span>{projectName(n.project_id)}</span>}
                  <button onClick={() => handleDelete(n.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm">{n.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
