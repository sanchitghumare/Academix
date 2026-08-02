import User from "@/models/user";
import Subject from "@/models/subjects";
import Timetable from "@/models/timetable";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export async function buildDailySummary(userId) {
  const user = await User.findById(userId).lean();

  if (!user) return null;

  const [subjects, timetable] = await Promise.all([
    Subject.find({ user: user._id }).lean(),
    Timetable.findOne({ userEmail: user.email }).lean(),
  ]);

  const today = DAYS[new Date().getDay()];

  const todaySchedule =
    timetable?.schedule?.timetable?.[today] || {};

  let message = "📚 Good Morning!\n\n";

  // ---------------- Today's Classes ----------------

  const lectures = [];

  for (const [time, slot] of Object.entries(todaySchedule)) {
    if (slot?.subject?.trim()) {
      lectures.push(`🕒 ${time} - ${slot.subject}`);
    }
  }

  if (lectures.length) {
    message += "Today's Classes:\n";
    message += lectures.join("\n");
    message += "\n\n";
  } else {
    message += "No classes scheduled today 🎉\n\n";
  }

  // ---------------- Attendance ----------------

  const riskySubjects = [];

  for (const subject of subjects) {
    if (subject.total === 0) continue;

    const percentage =
      (subject.attended / subject.total) * 100;

    if (percentage < subject.minRequired) {
      riskySubjects.push(
        `⚠️ ${subject.subjectname} (${percentage.toFixed(1)}%)`
      );
    }
  }

  if (riskySubjects.length) {
    message += "Attendance Below Target:\n";
    message += riskySubjects.join("\n");
    message += "\n\n";
  }

  message += "Have a productive day! 🚀";

  return message;
}