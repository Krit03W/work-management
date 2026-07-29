"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Briefcase, Clock, CalendarDays, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/card";
import type { CalendarEvent, CalendarStatus, Client, Project } from "@/types";

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

const today = new Date();
const dateLabel = today.toLocaleDateString(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [calStatus, setCalStatus] = useState<CalendarStatus | null>(null);
  const [calEvents, setCalEvents] = useState<CalendarEvent[]>([]);
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

    api
      .get<CalendarStatus>("/calendar/status")
      .then((s) => {
        setCalStatus(s);
        if (s.connected) {
          return api.get<CalendarEvent[]>("/calendar/events?days=1").then(setCalEvents);
        }
      })
      .catch(() => setCalStatus({ connected: false, email: null }));
  }, []);

  const active = projects.filter((p) => p.status === "in_progress");
  const upcoming = [...projects]
    .filter((p) => p.deadline)
    .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))
    .slice(0, 5);

  if (loading) return <p className="text-sm text-muted">Loading...</p>;
  if (error)
    return (
      <p className="text-sm text-red-500">
        Failed to load dashboard: {error}. Is the backend running at NEXT_PUBLIC_API_URL?
      </p>
    );

  return (
    <div className="grid auto-rows-[minmax(110px,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card delay={0} className="sm:col-span-2 flex flex-col justify-center">
        <p className="text-sm text-muted">{dateLabel}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">
          {active.length} active project{active.length === 1 ? "" : "s"} · {clients.length} client
          {clients.length === 1 ? "" : "s"} tracked
        </p>
      </Card>

      <Card delay={0.05} className="flex flex-col justify-between">
        <Users size={16} className="text-accent" />
        <div>
          <div className="text-2xl font-semibold">{clients.length}</div>
          <div className="text-sm text-muted">Clients</div>
        </div>
      </Card>

      <Card delay={0.1} className="flex flex-col justify-between">
        <Briefcase size={16} className="text-accent" />
        <div>
          <div className="text-2xl font-semibold">{projects.length}</div>
          <div className="text-sm text-muted">Total projects</div>
        </div>
      </Card>

      <Card delay={0.15} className="sm:col-span-2 lg:row-span-2 flex flex-col">
        <div className="mb-3 flex items-center gap-2">
          <Clock size={16} className="text-accent" />
          <h2 className="text-sm font-medium">Upcoming deadlines</h2>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">No deadlines set.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 text-sm">
                <span>{p.name}</span>
                <span className="text-muted">{p.deadline}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card delay={0.2} className="sm:col-span-2 lg:row-span-2 flex flex-col">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-accent" />
            <h2 className="text-sm font-medium">Today from Google Calendar</h2>
          </div>
          <Link href="/calendar" className="text-xs text-muted transition-colors hover:text-accent">
            Open <ArrowRight size={11} className="inline" />
          </Link>
        </div>
        {!calStatus?.connected ? (
          <p className="text-sm text-muted">
            Not connected —{" "}
            <Link href="/calendar" className="text-accent hover:underline">
              connect Google Calendar
            </Link>
            .
          </p>
        ) : calEvents.length === 0 ? (
          <p className="text-sm text-muted">Nothing on your calendar today.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {calEvents.map((e) => (
              <li key={e.id} className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 text-sm">
                <span>{e.summary}</span>
                {!e.all_day && (
                  <span className="text-muted">
                    {new Date(e.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card delay={0.25} className="sm:col-span-2 lg:col-span-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium">Projects</h2>
          <Link href="/projects" className="text-xs text-muted transition-colors hover:text-accent">
            Manage projects <ArrowRight size={11} className="inline" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Category</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2 pr-4">{p.name}</td>
                  <td className="py-2 pr-4 text-muted">{categoryLabel[p.category]}</td>
                  <td className="py-2 pr-4 text-muted">{statusLabel[p.status]}</td>
                  <td className="py-2 pr-4 text-muted">{p.deadline ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
