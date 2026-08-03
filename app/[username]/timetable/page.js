"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DEFAULT_SLOTS = [
        "09:00 - 10:00",
        "10:00 - 11:00",
        "11:15 - 12:15",
        "12:15 - 13:15",
        "14:00 - 15:00",
        "15:00 - 16:00",
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
    const router = useRouter();

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
                        [key]: key === "hours" ? value === "" ? "" : Math.max(1, Number(value)) : value,
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
        saved: "Saved ",
        error: "Save failed",
    };

    return (
        <main className="min-h-screen bg-[#09090B] font-sans text-[#FAFAFA] selection:bg-zinc-800 selection:text-white">
            <div className="mx-auto max-w-5xl px-6 py-12">
                {/* Header Section */}
                <section className="mb-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            
                                <h1 className="text-3xl font-bold tracking-tight text-[#FAFAFA]">Weekly Planner</h1>
                                <div className="flex flex-row justify-around items-center gap-4">
                            <p className="mt-2 text-sm text-[#A1A1AA]">
                                Set subjects and hours for each day-slot (1-hour lecture, 2-hour lab, etc.).
                            </p>
                            <button
                                    onClick={() => router.push(`/${username}`)}
                                    className="rounded-lg border border-[#27272A] bg-transparent px-4 py-2 text-xs font-semibold text-[#FAFAFA] transition-colors hover:border-zinc-700 hover:bg-zinc-900/50"
                                >
                                    Back to Dashboard
                                </button>
                                </div>
                        </div>

                        {status === "authenticated" && saveState && (
                            <div className="text-xs font-medium text-[#A1A1AA]">
                                {saveLabel[saveState]}
                            </div>
                        )}
                        {status !== "authenticated" && (
                            <div className="text-xs font-medium text-[#A1A1AA]/70">
                                Sign in to sync timetable to cloud
                            </div>
                        )}
                    </div>

                    {/* Controls Bar */}
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex w-full gap-2 sm:max-w-md">
                            <input
                                type="text"
                                value={newSlot}
                                onChange={(e) => setNewSlot(e.target.value)}
                                placeholder="Add slot (e.g. 04:00 - 05:00)"
                                className="w-full rounded-lg border border-[#27272A] bg-[#09090B] px-3.5 py-2 text-sm text-[#FAFAFA] placeholder-[#A1A1AA]/50 outline-none transition-colors focus:border-zinc-500"
                            />
                            <button
                                onClick={addSlot}
                                className="rounded-lg bg-[#FAFAFA] px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-zinc-200"
                            >
                                Add
                            </button>
                        </div>

                        <button
                            onClick={clearTable}
                            className="rounded-lg border border-[#27272A] bg-transparent px-4 py-2 text-xs font-semibold text-[#FAFAFA] transition-colors hover:border-zinc-700 hover:bg-zinc-900/50"
                        >
                            Clear Timetable
                        </button>
                    </div>
                </section>

                <div className="mb-8">
                    <hr className="border-[#27272A]" />
                </div>

                {/* Timetable Grid Table */}
                <section className="overflow-hidden rounded-xl border border-[#27272A] bg-[#111113]">
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="p-12 text-center text-xs text-[#A1A1AA]">Loading timetable...</div>
                        ) : (
                            <table className="min-w-225 w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-[#27272A] bg-[#09090B]/50 text-left">
                                        <th className="w-44 px-4 py-3 text-xs font-semibold text-[#A1A1AA]">Time Slot</th>
                                        {DAYS.map((day) => (
                                            <th key={day} className="px-4 py-3 text-xs font-semibold text-[#A1A1AA]">
                                                {day}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {slots.map((slot) => (
                                        <tr key={slot} className="border-b border-[#27272A]/50 align-top last:border-b-0">
                                            {/* Slot Column */}
                                            <td className="p-3">
                                                <div className="flex flex-col gap-2 rounded-lg border border-[#27272A] bg-[#09090B] p-3">
                                                    <p className="text-xs font-bold text-[#FAFAFA]">{slot}</p>
                                                    <button
                                                        onClick={() => removeSlot(slot)}
                                                        className="w-fit text-[11px] font-medium text-rose-400/80 transition-colors hover:text-rose-400"
                                                    >
                                                        Remove Slot
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Days Cells */}
                                            {DAYS.map((day) => {
                                                const cell = normalizeCell(timetable?.[day]?.[slot]);
                                                return (
                                                    <td key={`${day}-${slot}`} className="p-3">
                                                        <div className="space-y-2 rounded-lg border border-[#27272A] bg-[#09090B] p-3">
                                                            <textarea
                                                                value={cell.subject}
                                                                onChange={(e) => updateCell(day, slot, "subject", e.target.value)}
                                                                placeholder="Subject / Room"
                                                                rows={2}
                                                                className="w-full resize-y rounded-md border border-[#27272A] bg-[#111113] p-2 text-xs text-[#FAFAFA] placeholder-[#A1A1AA]/40 outline-none transition-colors focus:border-zinc-500"
                                                            />

                                                            <div className="flex items-center justify-between gap-2">
                                                                <label className="text-[11px] font-medium text-[#A1A1AA]">Hours</label>
                                                                <input
                                                                    type="number"
                                                                    max="4"
                                                                    value={cell.hours}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;

                                                                        updateCell(
                                                                            day,
                                                                            slot,
                                                                            "hours",
                                                                            value === "" ? "" : Number(value)
                                                                        );
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        let value = Number(e.target.value);

                                                                        if (isNaN(value) || value < 1) value = 1;
                                                                        if (value > 4) value = 4;

                                                                        updateCell(day, slot, "hours", value);
                                                                    }}
                                                                    className="w-16 rounded-md border border-[#27272A] bg-[#111113] px-2 py-1 text-xs text-[#FAFAFA] outline-none transition-colors focus:border-zinc-500"
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