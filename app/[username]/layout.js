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
    { label: "Resources", path: `/${username}/resources` },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-20 z-50 flex items-center gap-2 rounded-lg border border-[#27272A] bg-[#111113] px-3 py-1.5 text-xs font-semibold text-[#FAFAFA] transition-colors hover:border-zinc-700 hover:bg-zinc-900/50"
        aria-label="Open sidebar"
      >
        <img className="invert opacity-80" width={16} height={16} src="../menu.png" alt="Menu" />
        <span>Menu</span>
      </button>

      <>
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />
        )}

        <aside
          className={`fixed left-0 top-0 z-50 h-full w-64 border-r border-[#27272A] bg-[#111113] p-5 shadow-2xl transition-transform duration-200 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="mb-6 flex items-center justify-between border-b border-[#27272A]/50 pb-4">
            <h2 className="text-sm font-bold tracking-tight text-[#FAFAFA]">
              Navigation
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-[#27272A] bg-transparent text-xs font-medium text-[#A1A1AA] transition-colors hover:bg-zinc-900 hover:text-[#FAFAFA]"
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setIsOpen(false);
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${isActive
                      ? "bg-[#27272A]/60 text-[#FAFAFA]"
                      : "text-[#A1A1AA] hover:bg-zinc-900/60 hover:text-[#FAFAFA]"
                    }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </aside>
        <div>{children}</div>
      </>
    </div>
  );
}
