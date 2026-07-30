"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const POINT_TO_LABEL = {
  10: "O",
  9: "A",
  8: "B",
  7: "C",
  6: "D",
  5: "E",
  0: "F",
};

const getAutoGrade = (endSem, midSem, ca) => {
  const total = (Number(endSem) || 0) + (Number(midSem) || 0) + (Number(ca) || 0);
  const percentage = total;

  if (percentage >= 80) return { point: 10, label: "O", percentage };
  if (percentage >= 75) return { point: 9, label: "A", percentage };
  if (percentage >= 70) return { point: 8, label: "B", percentage };
  if (percentage >= 60) return { point: 7, label: "C", percentage };
  if (percentage >= 50) return { point: 6, label: "D", percentage };
  if (percentage >= 40) return { point: 5, label: "E", percentage };
  return { point: 0, label: "F", percentage };
};

const EMPTY_FORM = {
  subjectname: "",
  semester: "",
  credits: "",
  endSem: "",
  midSem: "",
  ca: "",
};

export default function Page({ params }) {
  const { status } = useSession();
  const router = useRouter();
  const resolvedParams = use(params);
  const username = resolvedParams?.username || "guest";

  const [grades, setGrades] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeSemester, setActiveSemester] = useState("all");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [statusText, setStatusText] = useState("");

  const fetchGrades = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/grades");
      const data = await res.json();

      if (!data?.success) {
        setStatusText(data?.error || "Failed to fetch grades");
        return;
      }

      const normalized = (data.grades || []).map((item) => {
        const subjectname = item.subjectname || item.subjectName || "";
        const semester = Number(item.semester || 1);
        const credits = Number(item.credits || 0);
        const endSem = Number(item.endSem ?? item.endSemMarks ?? item.external ?? item.externalMarks ?? 0);
        const midSem = Number(item.midSem ?? item.midSemMarks ?? 0);
        const ca = Number(item.ca ?? item.caMarks ?? 0);
        const gradePoint = Number(item.gradePoint ?? item.grade ?? 0);
        const grade = item.gradeLabel || POINT_TO_LABEL[gradePoint] || "F";

        return {
          _id: item._id,
          subjectname,
          semester,
          credits,
          endSem,
          midSem,
          ca,
          grade,
          gradePoint,
        };
      });

      setGrades(normalized);
      setStatusText("");
    } catch (error) {
      console.error("Error fetching grades:", error);
      setStatusText("Failed to fetch grades");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchGrades();
    }
  }, [status]);

  const semesters = useMemo(() => {
    const values = [...new Set(grades.map((g) => g.semester))].sort((a, b) => a - b);
    return values;
  }, [grades]);

  const visibleGrades = useMemo(() => {
    if (activeSemester === "all") return grades;
    return grades.filter((g) => g.semester === Number(activeSemester));
  }, [grades, activeSemester]);

  const stats = useMemo(() => {
    const totalCredits = visibleGrades.reduce((sum, g) => sum + g.credits, 0);
    const weightedPoints = visibleGrades.reduce((sum, g) => sum + g.credits * g.gradePoint, 0);
    const sgpa = totalCredits === 0 ? 0 : weightedPoints / totalCredits;
    const avgMarks = visibleGrades.length === 0
      ? 0
      : visibleGrades.reduce((sum, g) => sum + g.endSem + g.midSem + g.ca, 0) / visibleGrades.length;

    return {
      totalSubjects: visibleGrades.length,
      totalCredits,
      sgpa,
      avgMarks,
    };
  }, [visibleGrades]);

  const handleFormChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: key === "subjectname" || key === "grade" ? value : Number(value),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.subjectname.trim()) {
      setStatusText("Subject name is required");
      return;
    }

    try {
      setIsSaving(true);
      setStatusText("");

      const payload = {
        subjectname: form.subjectname.trim(),
        semester: Number(form.semester),
        credits: Number(form.credits),
        endSem: Number(form.endSem),
        midSem: Number(form.midSem),
        ca: Number(form.ca),
      };

      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data?.success) {
        setStatusText(data?.error || "Failed to save grade");
        return;
      }

      setStatusText("Grade saved");
      setForm(EMPTY_FORM);
      await fetchGrades();
    } catch (error) {
      console.error("Error saving grade:", error);
      setStatusText("Failed to save grade");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (gradeItem) => {
    setForm({
      subjectname: gradeItem.subjectname,
      semester: gradeItem.semester,
      credits: gradeItem.credits,
      endSem: gradeItem.endSem,
      midSem: gradeItem.midSem,
      ca: gradeItem.ca,
    });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this grade entry?");
    if (!confirmed) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/grades?id=${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!data?.success) {
        setStatusText(data?.error || "Failed to delete grade");
        return;
      }

      setGrades((prev) => prev.filter((item) => item._id !== id));
      setStatusText("Grade deleted");
    } catch (error) {
      console.error("Error deleting grade:", error);
      setStatusText("Failed to delete grade");
    } finally {
      setDeletingId("");
    }
  };

  const autoGradePreview = getAutoGrade(form.endSem, form.midSem, form.ca);

  return (
    <main className="min-h-screen bg-[#09090B] font-sans text-[#FAFAFA] selection:bg-zinc-800 selection:text-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header Section */}
        <section className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#FAFAFA]">My Grades</h1>
              <p className="mt-2 text-sm text-[#A1A1AA]">
                Track subject-wise grades, calculate semester performance, and estimate SGPA.
              </p>
            </div>

            <button
              onClick={() => router.push(`/${username}`)}
              className="rounded-lg border border-[#27272A] bg-transparent px-4 py-2 text-xs font-semibold text-[#FAFAFA] transition-colors hover:border-zinc-700 hover:bg-zinc-900/50"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Stats Grid */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[#27272A] bg-[#111113] p-4">
              <p className="text-xs font-medium text-[#A1A1AA]">Subjects</p>
              <p className="mt-2 text-2xl font-bold text-[#FAFAFA]">{stats.totalSubjects}</p>
            </div>
            <div className="rounded-xl border border-[#27272A] bg-[#111113] p-4">
              <p className="text-xs font-medium text-[#A1A1AA]">Credits</p>
              <p className="mt-2 text-2xl font-bold text-[#FAFAFA]">{stats.totalCredits}</p>
            </div>
            <div className="rounded-xl border border-[#27272A] bg-[#111113] p-4">
              <p className="text-xs font-medium text-[#A1A1AA]">SGPA</p>
              <p className="mt-2 text-2xl font-bold text-emerald-400">{stats.sgpa.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-[#27272A] bg-[#111113] p-4">
              <p className="text-xs font-medium text-[#A1A1AA]">Avg Marks</p>
              <p className="mt-2 text-2xl font-bold text-[#FAFAFA]">{stats.avgMarks.toFixed(1)}</p>
            </div>
          </div>
        </section>

        <div className="mb-8">
          <hr className="border-[#27272A]" />
        </div>

        {/* Form and Entries Layout */}
        <section className="grid gap-6 lg:grid-cols-5">
          {/* Form Side */}
          <div className="rounded-xl border border-[#27272A] bg-[#111113] p-6 lg:col-span-2">
            <h2 className="text-base font-bold text-[#FAFAFA]">Add / Update Grade</h2>
            <p className="mt-1 text-xs text-[#A1A1AA]">Saving an existing subject name updates its entry.</p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <input
                type="text"
                value={form.subjectname}
                onChange={(e) => handleFormChange("subjectname", e.target.value)}
                placeholder="Subject Name"
                className="w-full rounded-lg border border-[#27272A] bg-[#09090B] px-3.5 py-2 text-sm text-[#FAFAFA] placeholder-[#A1A1AA]/50 outline-none transition-colors focus:border-zinc-500"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={form.semester}
                  onChange={(e) => handleFormChange("semester", e.target.value)}
                  placeholder="Semester"
                  className="rounded-lg border border-[#27272A] bg-[#09090B] px-3.5 py-2 text-sm text-[#FAFAFA] placeholder-[#A1A1AA]/50 outline-none transition-colors focus:border-zinc-500"
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={form.credits}
                  onChange={(e) => handleFormChange("credits", e.target.value)}
                  placeholder="Credits"
                  className="rounded-lg border border-[#27272A] bg-[#09090B] px-3.5 py-2 text-sm text-[#FAFAFA] placeholder-[#A1A1AA]/50 outline-none transition-colors focus:border-zinc-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={form.endSem}
                  onChange={(e) => handleFormChange("endSem", e.target.value)}
                  placeholder="Endsem / 60"
                  className="rounded-lg border border-[#27272A] bg-[#09090B] px-3.5 py-2 text-sm text-[#FAFAFA] placeholder-[#A1A1AA]/50 outline-none transition-colors focus:border-zinc-500"
                />
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={form.midSem}
                  onChange={(e) => handleFormChange("midSem", e.target.value)}
                  placeholder="Midsem / 20"
                  className="rounded-lg border border-[#27272A] bg-[#09090B] px-3.5 py-2 text-sm text-[#FAFAFA] placeholder-[#A1A1AA]/50 outline-none transition-colors focus:border-zinc-500"
                />
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={form.ca}
                  onChange={(e) => handleFormChange("ca", e.target.value)}
                  placeholder="CA / 20"
                  className="rounded-lg border border-[#27272A] bg-[#09090B] px-3.5 py-2 text-sm text-[#FAFAFA] placeholder-[#A1A1AA]/50 outline-none transition-colors focus:border-zinc-500"
                />
              </div>

              {/* Auto Grade Preview Box */}
              <div className="rounded-lg border border-[#27272A] bg-[#09090B] px-3.5 py-2.5 text-xs">
                <p className="text-[#A1A1AA]">
                  Auto Grade: <span className="font-semibold text-[#FAFAFA]">{autoGradePreview.label}</span>
                  {" "}(Pointer {autoGradePreview.point})
                </p>
                <p className="mt-1 text-[11px] text-[#A1A1AA]/70">
                  Total: {(Number(form.endSem) || 0) + (Number(form.midSem) || 0) + (Number(form.ca) || 0)} / 100 ({autoGradePreview.percentage.toFixed(1)}%)
                </p>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-lg bg-[#FAFAFA] py-2 text-xs font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Grade"}
              </button>
            </form>

            {statusText && (
              <p className="mt-3 text-xs font-medium text-[#A1A1AA]">{statusText}</p>
            )}
          </div>

          {/* Entries Side */}
          <div className="rounded-xl border border-[#27272A] bg-[#111113] p-6 lg:col-span-3">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#27272A]/50 pb-4">
              <h2 className="text-base font-bold text-[#FAFAFA]">Grade Entries</h2>
              <select
                value={activeSemester}
                onChange={(e) => setActiveSemester(e.target.value)}
                className="rounded-lg border border-[#27272A] bg-[#09090B] px-3 py-1.5 text-xs font-medium text-[#FAFAFA] outline-none transition-colors focus:border-zinc-500"
              >
                <option value="all">All Semesters</option>
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="rounded-lg border border-[#27272A] bg-[#09090B] p-8 text-center text-xs text-[#A1A1AA]">
                Loading grades...
              </div>
            ) : visibleGrades.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#27272A] bg-[#09090B] p-8 text-center text-xs text-[#A1A1AA]">
                No grades found for this filter.
              </div>
            ) : (
              <div className="space-y-2.5">
                {visibleGrades.map((item) => (
                  <article key={item._id || `${item.subjectname}-${item.semester}`} className="rounded-lg border border-[#27272A] bg-[#09090B] p-3.5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-[#FAFAFA]">{item.subjectname}</h3>
                        <p className="mt-0.5 text-xs text-[#A1A1AA]">Semester {item.semester} • Credits {item.credits}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-medium text-[#A1A1AA]">Grade</p>
                          <p className="text-base font-bold text-emerald-400">{item.grade}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-medium text-[#A1A1AA]">Marks</p>
                          <p className="text-base font-bold text-[#FAFAFA]">{item.endSem + item.midSem + item.ca}</p>
                          <p className="text-[10px] text-[#A1A1AA]/60">E:{item.endSem} M:{item.midSem} CA:{item.ca}</p>
                        </div>
                        <div className="flex items-center gap-1.5 pl-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="rounded-md border border-[#27272A] bg-transparent px-2.5 py-1 text-xs font-medium text-[#FAFAFA] transition-colors hover:bg-zinc-900/50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            disabled={deletingId === item._id}
                            className="rounded-md border border-[#27272A] bg-transparent px-2.5 py-1 text-xs font-medium text-rose-400/80 transition-colors hover:border-rose-900/50 hover:text-rose-400 disabled:opacity-50"
                          >
                            {deletingId === item._id ? "..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}