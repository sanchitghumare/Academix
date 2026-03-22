"use client";

import React, { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function UserSectionLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const username = useMemo(() => {
    const parts = pathname?.split("/").filter(Boolean) || [];
    return parts[0] || "";
  }, [pathname]);

  const navItems = [
    { label: "Attendance", path: `/${username}` },
    { label: "Timetable", path: `/${username}/timetable` },
    { label: "Grades", path: `/${username}/grades` },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-20 z-70 rounded-xl border border-white/20 bg-slate-900/80 px-4 py-2 text-sm font-bold text-white backdrop-blur-md transition hover:bg-slate-800"
        aria-label="Open sidebar"
      >
        <img className="invert" width={20} height={20} src="../menu.png" alt="Menu" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-80 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-90 h-full w-72 border-r border-white/10 bg-slate-950/95 p-5 shadow-2xl transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-black tracking-wide text-cyan-200">Dashboard Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg border border-white/20 px-2 py-1 text-xs font-bold text-white"
            aria-label="Close sidebar"
          >
            X
          </button>
        </div>

        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  router.push(item.path);
                  setIsOpen(false);
                }}
                className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${isActive ? "bg-cyan-400 text-slate-950" : "border border-white/15 bg-white/5 text-white hover:bg-white/10"}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </aside>

      <div>{children}</div>
    </div>
  );
}
