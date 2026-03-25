"use client"
import React, { use, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AttendanceCard from '@/components/Attendancecard';
import { useRouter } from 'next/navigation';

export default function Dashboard({ params }) {
  const { data: session, status } = useSession();
  const [subjects, setSubjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSubject, setEditSubject] = useState(null);
  const [timetable, setTimetable] = useState({});
  const [isSkipMode, setIsSkipMode] = useState(false);
  const [currentSgpi, setCurrentSgpi] = useState(0);
  const [newSubject, setNewSubject] = useState({ name: '', attended: 0, total: 0, minRequired: 75 });
  const router = useRouter();
  const resolvedParams = use(params);
  const username = resolvedParams?.username || "guest";
  // 1. Fetch subjects from MongoDB on load
  const fetchSubjects = async () => {
    try {
      if (!session?.user?.email) {
        console.error("User email not found in session");
        return;
      }
      const res = await fetch('/api/subjects');
      const data = await res.json();
      if (data.success) {
        const normalizedSubjects = (data.subjects || []).map((sub) => ({
          _id: sub._id,
          name: sub.subjectname,
          attended: Number(sub.attended) || 0,
          total: Number(sub.total) || 0,
          minRequired: Number(sub.minRequired) || 75,
        }));
        setSubjects(normalizedSubjects);
      } else {
        console.error("Failed to fetch subjects:", data.error);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };
  
  const getNextlec = () => {
    const dayKeys = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());

    const weekdayMap = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    const weekDayShort = parts.find((p) => p.type === "weekday")?.value || "Sun";
    const currentDayIdx = weekdayMap[weekDayShort] ?? 0;
    const currentHour = Number(parts.find((p) => p.type === "hour")?.value || 0);
    const currentMinute = Number(parts.find((p) => p.type === "minute")?.value || 0);
    const currentMinutes = currentHour * 60 + currentMinute;

    const parseStartMinutes = (timeRange = "") => {
      const startRaw = String(timeRange).split("-")[0].split("to")[0].trim();
      const match = startRaw.match(/(\d{1,2})[:.](\d{2})/);
      if (!match) return null;

      const hours = Number(match[1]);
      const minutes = Number(match[2]);
      if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

      return hours * 60 + minutes;
    };

    const findNextInDay = (dayName, isToday) => {
      const dayRow = timetable?.schedule?.timetable?.[dayName] || timetable?.timetable?.[dayName] || timetable?.[dayName];
      if (!dayRow || typeof dayRow !== "object") return null;

      let best = null;

      for (const [timeRange, value] of Object.entries(dayRow)) {
        const startMinutes = parseStartMinutes(timeRange);
        if (startMinutes === null) continue;

        const subject = typeof value === "object" && value !== null
          ? String(value.subject || "").trim()
          : String(value || "").trim();

        if (!subject) continue;
        if (isToday && startMinutes <= currentMinutes) continue;

        if (!best || startMinutes < best.startMinutes) {
          best = {
            subject,
            time: timeRange,
            day: dayName,
            startMinutes,
          };
        }
      }

      return best;
    };

    const todayName = dayKeys[currentDayIdx];
    const todayLec = findNextInDay(todayName, true);
    if (todayLec) return todayLec;

    for (let i = 1; i <= 6; i++) {
      const nextDayName = dayKeys[(currentDayIdx + i) % 7];
      const lec = findNextInDay(nextDayName, false);
      if (lec) {
        return { ...lec, isTomorrow: i === 1 };
      }
    }

    return null;
  };
  const getSlotsForSubject = (subjectName) => {
    const dayKeys = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = dayKeys[new Date().getDay()];
    // const today = dayKeys[1];

    const todayRow = timetable?.schedule?.timetable?.[today];
    if (!todayRow || typeof todayRow !== "object") return 0;

    const normalizedSubject = subjectName.toLowerCase();
    return Object.values(todayRow).reduce((count, value) => {
      const cellSubject = typeof value === "object" && value !== null
        ? String(value.subject || "")
        : String(value || "");
      const cellHours = typeof value === "object" && value !== null
        ? Math.max(1, Number(value.hours) || 1)
        : 1;

      const normalizedCellSubject = cellSubject.toLowerCase();
      if (!normalizedCellSubject) return count;
      return normalizedCellSubject.includes(normalizedSubject) ? count + cellHours : count;
    }, 0);
  };
  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const res = await fetch('/api/timetable');
        const data = await res.json();
        if (data.success) {
          setTimetable(data.timetable || {});
        } else {
          console.error("Failed to fetch timetable:", data.error);
        }
      } catch (error) {
        console.error("Error fetching timetable:", error);
      }
    };

    const fetchCurrentSgpi = async () => {
      try {
        const res = await fetch('/api/grades');
        const data = await res.json();
        if (!data?.success || !Array.isArray(data.grades) || data.grades.length === 0) {
          setCurrentSgpi(0);
          return;
        }

        const normalized = data.grades.map((item) => ({
          semester: Number(item.semester || 1),
          credits: Number(item.credits || 0),
          gradePoint: Number(item.gradePoint ?? item.grade ?? 0),
        }));

        const latestSemester = Math.max(...normalized.map((g) => g.semester));
        const latestGrades = normalized.filter((g) => g.semester === latestSemester);
        const totalCredits = latestGrades.reduce((sum, g) => sum + g.credits, 0);
        const weightedPoints = latestGrades.reduce((sum, g) => sum + g.credits * g.gradePoint, 0);
        const sgpi = totalCredits === 0 ? 0 : weightedPoints / totalCredits;
        setCurrentSgpi(Number(sgpi.toFixed(2)));
      } catch (error) {
        console.error('Error fetching SGPI:', error);
      }
    };

    if (status === 'authenticated') {
      fetchTimetable();
      fetchSubjects();
      fetchCurrentSgpi();
    }
  }, [status]);
  const handleAddSubject = async () => {
    if (!newSubject.name) return alert("Enter subject name");
    if (newSubject.attended > newSubject.total) return alert("Attended classes cannot be more than total classes");

    try {
      const payload = {
        name: newSubject.name,
        attended: Number(newSubject.attended) || 0,
        total: Number(newSubject.total) || 0,
        minRequired: Math.max(0, Math.min(100, Number(newSubject.minRequired) || 0)),
      };

      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.success) {
        return alert(data.error || 'Failed to add subject');
      }

      const created = {
        _id: data.subject._id,
        name: data.subject.subjectname,
        attended: Number(data.subject.attended) || 0,
        total: Number(data.subject.total) || 0,
        minRequired: Number(data.subject.minRequired) || 75,
      };

      setSubjects((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setNewSubject({ name: '', attended: 0, total: 0, minRequired: 75 });
    } catch (error) {
      console.error('Error adding subject:', error);
      alert('Failed to add subject');
    }

  };

  const handleUpdateAttendance = async (subjectName, type) => {
    const subjectToUpdate = subjects.find((sub) => sub.name === subjectName);
    if (!subjectToUpdate?._id) return;

    // Optimistic UI update for better responsiveness.
    setSubjects(prev => prev.map(sub => {
      if (sub.name === subjectName) {
        return {
          ...sub,
          attended: type === 'present' ? sub.attended + 1 : sub.attended,
          total: sub.total + 1
        };
      }
      return sub;
    }));

    try {
      const res = await fetch('/api/subjects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: subjectToUpdate._id, type }),
      });
      const data = await res.json();

      if (!data.success) {
        await fetchSubjects();
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      await fetchSubjects();
    }
  };
  const deleteSubject = async (id) => {
    try {
      const res = await fetch(`/api/subjects?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to delete subject');
      } else {
        setSubjects(subjects.filter(sub => sub._id !== id));
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Failed to delete subject');
    }
  }

  const openEditSubject = (subject) => {
    setEditSubject({
      _id: subject._id,
      name: subject.name,
      attended: subject.attended,
      total: subject.total,
      minRequired: subject.minRequired,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveSubjectEdit = async () => {
    if (!editSubject?.name?.trim()) {
      alert('Subject name is required');
      return;
    }
    if (Number(editSubject.attended) > Number(editSubject.total)) {
      alert('Attended classes cannot be more than total classes');
      return;
    }

    try {
      const res = await fetch('/api/subjects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editSubject._id,
          subjectname: editSubject.name,
          attended: Number(editSubject.attended) || 0,
          total: Number(editSubject.total) || 0,
          minRequired: Math.max(0, Math.min(100, Number(editSubject.minRequired) || 0)),
        }),
      });
      const data = await res.json();

      if (!data?.success) {
        alert(data?.error || 'Failed to edit subject');
        return;
      }

      setSubjects((prev) => prev.map((sub) => (
        sub._id === editSubject._id
          ? {
            ...sub,
            name: data.subject.subjectname,
            attended: Number(data.subject.attended) || 0,
            total: Number(data.subject.total) || 0,
            minRequired: Number(data.subject.minRequired) || 0,
          }
          : sub
      )));
      setIsEditModalOpen(false);
      setEditSubject(null);
    } catch (error) {
      console.error('Error editing subject:', error);
      alert('Failed to edit subject');
    }
  };

  const subjectCards = subjects.map((sub) => {
    const todaysSlots = getSlotsForSubject(sub.name);
    const currentPct = sub.total === 0 ? 0 : Math.round((sub.attended / sub.total) * 100);
    const simulatedPct = sub.total + todaysSlots === 0
      ? 0
      : Math.round((sub.attended / (sub.total + todaysSlots)) * 100);

    return {
      ...sub,
      todaysSlots,
      displayPct: isSkipMode ? simulatedPct : currentPct,
      isDropping: isSkipMode && todaysSlots > 0,
    };
  });
  const totalClasses = subjects.reduce((sum, sub) => sum + sub.total, 0);
  const totalAttended = subjects.reduce((sum, sub) => sum + sub.attended, 0);
  const overallPercentage = totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100);
  const safeSubjects = subjects.filter((sub) => {
    if (sub.total === 0) return true;
    return (sub.attended / sub.total) * 100 >= (sub.minRequired + 10);
  }).length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 pb-24 pt-8 text-white md:px-8">
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-7xl">

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/3 p-5 backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-200">
                Attendance Command Center
              </p>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">My Attendance</h1>
              <p className="mt-3 text-sm text-slate-300 md:text-base">
                Track every subject, see where you can safely skip, and spot at-risk classes before they hurt your percentage.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:flex-col lg:items-stretch">
              <button
                onClick={() => router.push(`/${username}/timetable`)}
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Set Timetable
              </button>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100">
                <span className="whitespace-nowrap">Simulate Skipping Today</span>
                <input
                  type="checkbox"
                  checked={isSkipMode}
                  onChange={() => setIsSkipMode(!isSkipMode)}
                  className="toggle-checkbox"
                />
              </label>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">Subjects</p>
              <p className="mt-2 text-2xl font-extrabold">{subjects.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">Overall</p>
              <p className="mt-2 text-2xl font-extrabold">{overallPercentage}%</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">Safe</p>
              <p className="mt-2 text-2xl font-extrabold text-emerald-300">{safeSubjects}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">At Risk</p>
              <p className="mt-2 text-2xl font-extrabold text-rose-300">{Math.max(subjects.length - safeSubjects, 0)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">Current SGPI</p>
              <p className="mt-2 text-2xl font-extrabold text-cyan-300">{currentSgpi.toFixed(2)}</p>
            </div>
            <div className='rounded-2xl border border-white/10 bg-slate-900/70 p-4'>
              <p className="text-xs uppercase tracking-wider text-slate-400">Next Lecture</p>
              <p className="mt-2 text-2xl font-extrabold">{getNextlec()?.subject || "None"}</p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          {subjects.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/20 bg-white/2 p-10 text-center">
              <h2 className="text-2xl font-bold">No subjects yet</h2>
              <p className="mx-auto mt-2 max-w-md text-slate-300">
                Start by adding your first subject. You will get instant attendance predictions as soon as you begin tracking.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-6 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition-transform hover:scale-[1.02] active:scale-95"
              >
                Add your first subject
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {subjectCards.map((sub) => (
                <AttendanceCard
                  key={sub._id}
                  subject={sub}
                  onUpdate={handleUpdateAttendance}
                  onDelete={deleteSubject}
                  onEdit={openEditSubject}
                  displayPct={sub.displayPct}
                  isDropping={sub.isDropping}
                  simulatedSlots={sub.todaysSlots}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400 text-3xl font-black text-slate-950 shadow-[0_20px_50px_-15px_rgba(34,211,238,0.7)] transition-transform hover:scale-110 active:scale-95 sm:bottom-8 sm:right-6 sm:h-16 sm:w-16 sm:text-4xl"
        aria-label="Add subject"
      >
        +
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl md:p-8">
            <h2 className="text-2xl font-black">Add New Subject</h2>
            <p className="mt-1 text-sm text-slate-300">Set your current attendance and target percentage.</p>

            <div className="mt-6 space-y-4">
              <input
                type="text"
                placeholder="Subject Name"
                value={newSubject.name}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none transition focus:border-cyan-300"
                onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  placeholder="Attended"
                  value={newSubject.attended}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none transition focus:border-cyan-300"
                  onChange={(e) => setNewSubject({ ...newSubject, attended: Number(e.target.value) || 0 })}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Total"
                  value={newSubject.total}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none transition focus:border-cyan-300"
                  onChange={(e) => setNewSubject({ ...newSubject, total: Number(e.target.value) || 0 })}
                />
              </div>

              <input
                type="number"
                min="0"
                max="100"
                placeholder="Minimum %"
                value={newSubject.minRequired}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none transition focus:border-cyan-300"
                onChange={(e) => setNewSubject({ ...newSubject, minRequired: Number(e.target.value) || 0 })}
              />
            </div>

            <div className="mt-7 flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 rounded-xl border border-white/20 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubject}
                className="flex-1 rounded-xl bg-cyan-400 py-3 font-black text-slate-950 transition hover:brightness-95"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editSubject && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl md:p-8">
            <h2 className="text-2xl font-black">Edit Subject</h2>
            <p className="mt-1 text-sm text-slate-300">Update attendance values for this card.</p>

            <div className="mt-6 space-y-4">
              <input
                type="text"
                placeholder="Subject Name"
                value={editSubject.name}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none transition focus:border-cyan-300"
                onChange={(e) => setEditSubject({ ...editSubject, name: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  placeholder="Attended"
                  value={editSubject.attended}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none transition focus:border-cyan-300"
                  onChange={(e) => setEditSubject({ ...editSubject, attended: Number(e.target.value) || 0 })}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Total"
                  value={editSubject.total}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none transition focus:border-cyan-300"
                  onChange={(e) => setEditSubject({ ...editSubject, total: Number(e.target.value) || 0 })}
                />
              </div>

              <input
                type="number"
                min="0"
                max="100"
                placeholder="Minimum %"
                value={editSubject.minRequired}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none transition focus:border-cyan-300"
                onChange={(e) => setEditSubject({ ...editSubject, minRequired: Number(e.target.value) || 0 })}
              />
            </div>

            <div className="mt-7 flex gap-3">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditSubject(null);
                }}
                className="flex-1 rounded-xl border border-white/20 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubjectEdit}
                className="flex-1 rounded-xl bg-cyan-400 py-3 font-black text-slate-950 transition hover:brightness-95"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



// const percentage = (attended, total, slots) => {
//    if(total === 0) return 0;
//    const skippercentage= (attended / (total + slots)) * 100;
//    return skippercentage
// };