"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutGrid, Users, Briefcase, NotebookPen, CalendarDays } from "lucide-react";

const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: Briefcase },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {navLinks.map((link) => {
        const active = pathname === link.href;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:text-foreground"
          >
            {active && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 rounded-full bg-accent/10"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Icon size={14} className={`relative ${active ? "text-accent" : ""}`} />
            <span className={`relative hidden sm:inline ${active ? "text-accent font-medium" : ""}`}>
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
