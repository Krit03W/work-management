"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Client, Project } from "@/types";

const statusLabel: Record<Project["status"], string> = {
  lead: "Lead",
  quoted: "Quoted",
  in_progress: "In Progress",
  completed: "Completed",
  archived: "Archived",
};

const categoryLabel: Record<Project["category"], string> = {
  full_time: "Full-time",
  freelance: "Freelance",
  solopreneur: "Solopreneur",
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get<Project[]>("/projects"), api.get<Client[]>("/clients")])
      .then(([projectsData, clientsData]) => {
        setProjects(projectsData);
        setClients(clientsData);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  const active = projects.filter((p) => p.status === "in_progress");
  const upcoming = [...projects]
    .filter((p) => p.deadline)
    .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))
    .slice(0, 5);

  if (loading) return <p className="text-sm text-black/60 dark:text-white/60">Loading...</p>;
  if (error)
    return (
      <p className="text-sm text-red-600">
        Failed to load dashboard: {error}. Is the backend running at NEXT_PUBLIC_API_URL?
      </p>
    );

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Clients" value={clients.length} />
        <StatCard label="Active projects" value={active.length} />
        <StatCard label="Total projects" value={projects.length} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">Upcoming deadlines</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">No deadlines set.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((p) => (
              <li
                key={p.id}
                className="flex justify-between rounded border border-black/10 px-4 py-2 text-sm dark:border-white/10"
              >
                <span>{p.name}</span>
                <span className="text-black/60 dark:text-white/60">{p.deadline}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Projects</h2>
          <Link href="/projects" className="text-sm hover:underline">
            Manage projects &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/10">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-black/5 dark:border-white/5">
                  <td className="py-2 pr-4">{p.name}</td>
                  <td className="py-2 pr-4">{categoryLabel[p.category]}</td>
                  <td className="py-2 pr-4">{statusLabel[p.status]}</td>
                  <td className="py-2 pr-4">{p.deadline ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-black/10 px-4 py-3 dark:border-white/10">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-black/60 dark:text-white/60">{label}</div>
    </div>
  );
}
