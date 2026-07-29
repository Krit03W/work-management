"use client";

import { useEffect, useState } from "react";
import { NotebookPen, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/card";
import { buttonStyles, dangerLinkStyles, inputStyles } from "@/components/ui";
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
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Notes</h1>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className={`${inputStyles} sm:flex-1`}
              placeholder="Title (optional)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <select
              className={`${inputStyles} sm:w-56`}
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
            className={inputStyles}
            placeholder="Note content *"
            rows={3}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
          />
          <button type="submit" disabled={submitting} className={`${buttonStyles} self-start`}>
            <Plus size={14} />
            {submitting ? "Saving..." : "Add note"}
          </button>
        </form>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : notes.length === 0 ? (
        <Card delay={0.05} className="flex flex-col items-center gap-2 text-center text-sm text-muted">
          <NotebookPen size={20} className="text-muted" />
          No notes yet.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((n, i) => (
            <Card key={n.id} delay={0.03 * i} className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{n.title ?? "Untitled"}</span>
                <button
                  onClick={() => handleDelete(n.id)}
                  className={dangerLinkStyles}
                  aria-label="Delete note"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground/80">{n.content}</p>
              {projectName(n.project_id) && (
                <span className="mt-auto w-fit rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                  {projectName(n.project_id)}
                </span>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
