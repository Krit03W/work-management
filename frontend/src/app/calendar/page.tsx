"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarDays, CalendarPlus } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/card";
import { buttonStyles, dangerLinkStyles } from "@/components/ui";
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

  if (loading) return <p className="text-sm text-muted">Loading...</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Calendar</h1>

      {urlError && <p className="text-sm text-red-500">Google connection failed: {urlError}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!status?.connected ? (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <CalendarPlus size={22} className="text-accent" />
          <p className="max-w-xs text-sm text-muted">
            Connect your Google Calendar to see upcoming events alongside project deadlines.
          </p>
          <button onClick={handleConnect} disabled={connecting} className={buttonStyles}>
            {connecting ? "Redirecting..." : "Connect Google Calendar"}
          </button>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <Card className="flex items-center justify-between py-3">
            <span className="text-sm">Connected as {status.email}</span>
            <button onClick={handleDisconnect} className={dangerLinkStyles}>
              Disconnect
            </button>
          </Card>

          {events.length === 0 ? (
            <Card delay={0.05} className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted">
              <CalendarDays size={20} className="text-muted" />
              No upcoming events in the next 30 days.
            </Card>
          ) : (
            groupByDate(events).map(([date, items], gi) => (
              <div key={date}>
                <h2 className="mb-2 text-sm font-medium text-muted">{date}</h2>
                <ul className="flex flex-col gap-2">
                  {items.map((e, i) => (
                    <motion.li
                      key={e.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: gi * 0.05 + i * 0.03 }}
                      className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span>{e.summary}</span>
                        {!e.all_day && (
                          <span className="text-muted">
                            {new Date(e.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                      {e.location && <div className="text-xs text-muted">{e.location}</div>}
                    </motion.li>
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
    <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
      <CalendarPageInner />
    </Suspense>
  );
}
