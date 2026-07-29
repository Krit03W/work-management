"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { CalendarEvent, CalendarStatus } from "@/types";

function groupByDate(items: CalendarEvent[]) {
  const groups = new Map<string, CalendarEvent[]>();
  for (const e of items) {
    const key = e.start.slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  return [...groups.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
}

function CalendarPageInner() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = () => {
    return api
      .get<CalendarStatus>("/calendar/status")
      .then((s) => {
        setStatus(s);
        if (s.connected) {
          return api.get<CalendarEvent[]>("/calendar/events?days=30").then(setEvents);
        }
        setEvents([]);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  };

  const reload = () => {
    setLoading(true);
    setError(null);
    fetchStatus();
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { url } = await api.get<{ url: string }>("/calendar/google/auth-url");
      window.location.href = url;
    } catch (err) {
      setError(String(err));
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await api.delete("/calendar/google");
    reload();
  };

  if (loading) return <p className="text-sm text-black/60 dark:text-white/60">Loading...</p>;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">Calendar</h1>

      {urlError && <p className="text-sm text-red-600">Google connection failed: {urlError}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!status?.connected ? (
        <div className="rounded border border-black/10 p-4 dark:border-white/10">
          <p className="mb-3 text-sm text-black/60 dark:text-white/60">
            Connect your Google Calendar to see upcoming events alongside project deadlines.
          </p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            {connecting ? "Redirecting..." : "Connect Google Calendar"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded border border-black/10 px-4 py-2 text-sm dark:border-white/10">
            <span>Connected as {status.email}</span>
            <button onClick={handleDisconnect} className="text-red-600 hover:underline">
              Disconnect
            </button>
          </div>

          {events.length === 0 ? (
            <p className="text-sm text-black/60 dark:text-white/60">No upcoming events in the next 30 days.</p>
          ) : (
            groupByDate(events).map(([date, items]) => (
              <div key={date}>
                <h2 className="mb-2 text-sm font-medium text-black/60 dark:text-white/60">{date}</h2>
                <ul className="flex flex-col gap-2">
                  {items.map((e) => (
                    <li
                      key={e.id}
                      className="rounded border border-black/10 px-4 py-2 text-sm dark:border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <span>{e.summary}</span>
                        {!e.all_day && (
                          <span className="text-black/60 dark:text-white/60">
                            {new Date(e.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                      {e.location && (
                        <div className="text-xs text-black/50 dark:text-white/50">{e.location}</div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<p className="text-sm text-black/60 dark:text-white/60">Loading...</p>}>
      <CalendarPageInner />
    </Suspense>
  );
}
