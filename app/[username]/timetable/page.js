"use client";

import React, {use, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DEFAULT_SLOTS = [
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:15 - 12:15",
    "12:15 - 01:15",
    "02:00 - 03:00",
    "03:00 - 04:00",
];

const normalizeCell = (value) => {
    if (typeof value === "object" && value !== null) {
        return {
            subject: String(value.subject || ""),
            hours: Math.max(1, Number(value.hours) || 1),
        };
    }

    return {
        subject: String(value || ""),
        hours: 1,
    };
};

const buildEmptyGrid = (slots) => {
    const grid = {};
    for (const day of DAYS) {
        grid[day] = {};
        for (const slot of slots) {
            grid[day][slot] = { subject: "", hours: 1 };
        }
    }
    return grid;
};

export default function TimetablePage({ params }) {
    const { status } = useSession();
    const resolvedParams = use(params);
    const username = resolvedParams?.username || "guest";
    const storageKey = useMemo(() => `stratos_timetable_${username}`, [username]);

    const [slots, setSlots] = useState(DEFAULT_SLOTS);
    const [timetable, setTimetable] = useState(buildEmptyGrid(DEFAULT_SLOTS));
    const [newSlot, setNewSlot] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [saveState, setSaveState] = useState("idle");
    const [didHydrate, setDidHydrate] = useState(false);

    useEffect(() => {
        const hydrate = async () => {
            if (status === "loading") return;

            try {
                if (status === "authenticated") {
                    const res = await fetch("/api/timetable");
                    const data = await res.json();

                    if (data?.success && data?.timetable?.schedule) {
                        const apiSlots = Array.isArray(data.timetable.schedule.slots) && data.timetable.schedule.slots.length > 0
                            ? data.timetable.schedule.slots
                            : DEFAULT_SLOTS;

                        const normalized = buildEmptyGrid(apiSlots);
                        const apiGrid = data.timetable.schedule.timetable || {};

                        for (const day of DAYS) {
                            for (const slot of apiSlots) {
                                normalized[day][slot] = normalizeCell(apiGrid?.[day]?.[slot]);
                            }
                        }

                        setSlots(apiSlots);
                        setTimetable(normalized);
                        localStorage.setItem(storageKey, JSON.stringify({ slots: apiSlots, timetable: normalized }));
                        setDidHydrate(true);
                        setIsLoading(false);
                        return;
                    }
                }

                const raw = localStorage.getItem(storageKey);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed?.slots) && typeof parsed?.timetable === "object") {
                        const loadedSlots = parsed.slots.length > 0 ? parsed.slots : DEFAULT_SLOTS;
                        const normalized = buildEmptyGrid(loadedSlots);

                        for (const day of DAYS) {
                            for (const slot of loadedSlots) {
                                normalized[day][slot] = normalizeCell(parsed.timetable?.[day]?.[slot]);
                            }
                        }

                        setSlots(loadedSlots);
                        setTimetable(normalized);
                    }
                }
            } catch (error) {
                console.error("Failed to load timetable:", error);
            } finally {
                setDidHydrate(true);
                setIsLoading(false);
            }
        };

        hydrate();
    }, [status, storageKey]);

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify({ slots, timetable }));
    }, [slots, timetable, storageKey]);

    useEffect(() => {
        if (!didHydrate || isLoading || status !== "authenticated") return;

        const timeoutId = setTimeout(async () => {
            try {
                setSaveState("saving");
                const res = await fetch("/api/timetable", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ slots, timetable }),
                });

                const data = await res.json();
                if (!data?.success) {
                    setSaveState("error");
                    return;
                }

                setSaveState("saved");
            } catch (error) {
                console.error("Failed to save timetable:", error);
                setSaveState("error");
            }
        }, 700);

        return () => clearTimeout(timeoutId);
    }, [slots, timetable, status, didHydrate, isLoading]);

    const updateCell = (day, slot, key, value) => {
        setTimetable((prev) => {
            const currentCell = normalizeCell(prev?.[day]?.[slot]);
            return {
                ...prev,
                [day]: {
                    ...prev[day],
                    [slot]: {
                        ...currentCell,
                        [key]: key === "hours" ? Math.max(1, Number(value) || 1) : value,
                    },
                },
            };
        });
    };

    const addSlot = () => {
        const slotLabel = newSlot.trim();
        if (!slotLabel) return;
        if (slots.includes(slotLabel)) {
            alert("This time slot already exists.");
            return;
        }

        setSlots((prev) => [...prev, slotLabel]);
        setTimetable((prev) => {
            const updated = { ...prev };
            for (const day of DAYS) {
                updated[day] = { ...updated[day], [slotLabel]: { subject: "", hours: 1 } };
            }
            return updated;
        });
        setNewSlot("");
    };

    const removeSlot = (slotToRemove) => {
        setSlots((prev) => prev.filter((slot) => slot !== slotToRemove));
        setTimetable((prev) => {
            const updated = {};
            for (const day of DAYS) {
                updated[day] = { ...prev[day] };
                delete updated[day][slotToRemove];
            }
            return updated;
        });
    };

    const clearTable = () => {
        setTimetable(buildEmptyGrid(slots));
    };

    const saveLabel = {
        idle: "",
        saving: "Saving...",
        saved: "Saved to cloud",
        error: "Save failed",
    };

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-10 text-white md:px-8">
            <div className="mx-auto max-w-7xl">
                <section className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
                    <p className="mb-3 inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
                        Weekly Planner
                    </p>
                    <h1 className="text-3xl font-black tracking-tight md:text-5xl">Timetable Grid</h1>
                    <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
                        Set subject and hours for each day-slot (1-hour lecture, 2-hour lab, and so on).
                    </p>

                    <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-cyan-200">
                        {status === "authenticated" ? saveLabel[saveState] : "Sign in to sync timetable to cloud"}
                    </div>

                    <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="flex w-full gap-2 md:max-w-md">
                            <input
                                type="text"
                                value={newSlot}
                                onChange={(e) => setNewSlot(e.target.value)}
                                placeholder="Add slot (e.g. 04:00 - 05:00)"
                                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-300"
                            />
                            <button
                                onClick={addSlot}
                                className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:brightness-95"
                            >
                                Add
                            </button>
                        </div>

                        <button
                            onClick={clearTable}
                            className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                            Clear Timetable
                        </button>
                    </div>
                </section>

                <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70">
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="p-10 text-center text-sm text-slate-300">Loading timetable...</div>
                        ) : (
                            <table className="min-w-225 w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-800/70 text-left">
                                        <th className="w-44 px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-slate-200">Time Slot</th>
                                        {DAYS.map((day) => (
                                            <th key={day} className="px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-slate-200">
                                                {day}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {slots.map((slot) => (
                                        <tr key={slot} className="border-t border-white/10 align-top">
                                            <td className="p-3">
                                                <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-slate-950/60 p-3">
                                                    <p className="text-sm font-bold text-cyan-200">{slot}</p>
                                                    <button
                                                        onClick={() => removeSlot(slot)}
                                                        className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-2 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/20"
                                                    >
                                                        Remove Slot
                                                    </button>
                                                </div>
                                            </td>

                                            {DAYS.map((day) => {
                                                const cell = normalizeCell(timetable?.[day]?.[slot]);
                                                return (
                                                    <td key={`${day}-${slot}`} className="p-3">
                                                        <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                                                            <textarea
                                                                value={cell.subject}
                                                                onChange={(e) => updateCell(day, slot, "subject", e.target.value)}
                                                                placeholder="Subject / Room"
                                                                rows={2}
                                                                className="w-full resize-y rounded-lg border border-slate-700 bg-slate-900/70 p-2 text-sm text-white outline-none transition focus:border-cyan-300"
                                                            />

                                                            <div className="flex items-center justify-between gap-2">
                                                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">Hours</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    max="4"
                                                                    value={cell.hours}
                                                                    onChange={(e) => updateCell(day, slot, "hours", e.target.value)}
                                                                    className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white outline-none transition focus:border-cyan-300"
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

