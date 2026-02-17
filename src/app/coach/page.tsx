"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { getLessonsByCoach, getClients, getPackages, addLesson, markLessonCompleted, getCoachById } from "@/lib/firestore";
import { Lesson, Client, Package } from "@/lib/types";
import { ChevronLeft, ChevronRight, Plus, X, CheckCircle } from "lucide-react";

export default function CoachDashboard() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [coachName, setCoachName] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    clientIds: [] as string[],
    packageId: "",
    lessonType: "",
    time: "09:00",
    hours: "1",
    coachHours: "1",
    notes: "",
    status: "completed" as "scheduled" | "completed",
  });

  const lessonTypes = [
    "Private",
    "Semi-Private Group",
    "Custom-Private",
    "Custom-Semi-Private",
    "Custom Group",
  ];

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      console.log("Loading coach data for UID:", user.uid);
      const [l, c, p, coach] = await Promise.all([
        getLessonsByCoach(user.uid),
        getClients(),
        getPackages(),
        getCoachById(user.uid),
      ]);
      console.log("Loaded:", { lessons: l.length, clients: c.length, packages: p.length, coach: coach?.name });
      setLessons(l);
      setClients(c);
      setPackages(p);
      if (coach) setCoachName(coach.name);
    } catch (err) {
      console.error("Error loading coach data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [firstDayOfWeek, daysInMonth]);

  const getLessonsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return lessons.filter((l) => l.date === dateStr);
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
  };

  const openAddLesson = () => {
    if (!selectedDate) return;
    setForm({
      clientIds: [],
      packageId: "",
      lessonType: "",
      time: "09:00",
      hours: "1",
      coachHours: "1",
      notes: "",
      status: "completed",
    });
    setError("");
    setShowModal(true);
  };

  const availablePackages = packages.filter(
    (p) => p.status === "active" && form.clientIds.includes(p.clientId)
  );

  const handleSave = async () => {
    if (!user || !selectedDate) return;
    if (form.clientIds.length === 0 || !form.lessonType) {
      setError("Select at least one client and a lesson type");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const selectedClients = clients.filter((c) => form.clientIds.includes(c.id));
      const sessionId = `S-${Date.now().toString(36).toUpperCase()}`;

      const lessonData: any = {
        coachId: user.uid,
        coachName: coachName || user.email || "Coach",
        clientIds: form.clientIds,
        clientNames: selectedClients.map((c) => c.name),
        lessonType: form.lessonType,
        date: selectedDate,
        time: form.time,
        hours: parseFloat(form.hours),
        sessionId,
        coachHours: parseFloat(form.coachHours),
        payment: 0,
        notes: form.notes,
        status: form.status,
        createdAt: new Date().toISOString(),
      };
      
      // Only add packageId if it's not empty
      if (form.packageId && form.packageId.trim() !== "") {
        lessonData.packageId = form.packageId;
      }
      
      await addLesson(lessonData);
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to add lesson");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkComplete = async (lessonId: string) => {
    try {
      await markLessonCompleted(lessonId);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const selectedDayLessons = selectedDate
    ? lessons.filter((l) => l.date === selectedDate)
    : [];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">My Calendar</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 sm:p-6">
            {/* Month navigation */}
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h2 className="text-lg font-semibold text-gray-800">
                {monthNames[month]} {year}
              </h2>
              <button
                onClick={nextMonth}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-2">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (day === null) {
                  return <div key={`empty-${i}`} className="aspect-square" />;
                }
                const dayLessons = getLessonsForDay(day);
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isSelected = selectedDate === dateStr;
                const isToday =
                  day === new Date().getDate() &&
                  month === new Date().getMonth() &&
                  year === new Date().getFullYear();

                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`aspect-square rounded-lg p-1 text-sm transition relative ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : isToday
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <span className="block">{day}</span>
                    {dayLessons.length > 0 && (
                      <div className="flex justify-center gap-0.5 mt-0.5">
                        {dayLessons.slice(0, 3).map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 w-1.5 rounded-full ${
                              isSelected ? "bg-white/70" : "bg-indigo-400"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Day detail panel */}
        <div className="lg:col-span-1">
          <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 sm:p-6">
            {selectedDate ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  <button
                    onClick={openAddLesson}
                    className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                </div>

                {selectedDayLessons.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDayLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="rounded-lg border border-gray-200 p-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {lesson.time} - {lesson.lessonType}
                            </p>
                            <p className="text-xs text-gray-500">
                              {lesson.clientNames?.join(", ")}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {lesson.hours}h
                              {lesson.notes && ` • ${lesson.notes}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                lesson.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {lesson.status}
                            </span>
                            {lesson.status === "scheduled" && (
                              <button
                                onClick={() => handleMarkComplete(lesson.id)}
                                className="rounded p-1 text-gray-400 hover:text-green-600"
                                title="Mark as completed"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No lessons on this day</p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">Select a day to view or add lessons</p>
            )}
          </div>

          {/* Quick stats */}
          <div className="mt-4 rounded-xl bg-white p-4 shadow-sm border border-gray-100 sm:p-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">This Month</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Lessons</span>
                <span className="font-medium text-gray-800">
                  {lessons.filter((l) => {
                    const d = new Date(l.date);
                    return d.getMonth() === month && d.getFullYear() === year;
                  }).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Completed</span>
                <span className="font-medium text-green-600">
                  {lessons.filter((l) => {
                    const d = new Date(l.date);
                    return d.getMonth() === month && d.getFullYear() === year && l.status === "completed";
                  }).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Hours</span>
                <span className="font-medium text-gray-800">
                  {lessons
                    .filter((l) => {
                      const d = new Date(l.date);
                      return d.getMonth() === month && d.getFullYear() === year;
                    })
                    .reduce((sum, l) => sum + (l.hours || 0), 0)}h
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Lesson Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Add Lesson - {selectedDate}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Client(s) *</label>
                <select
                  multiple
                  value={form.clientIds}
                  onChange={(e) => {
                    const selectedIds = Array.from(e.target.selectedOptions, (option) => option.value);
                    setForm({ ...form, clientIds: selectedIds });
                  }}
                  className="h-40 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                 <p className="mt-1 text-xs text-gray-400">
                  Hold Ctrl (or Cmd on Mac) to select multiple clients.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Lesson Type *</label>
                <select
                  value={form.lessonType}
                  onChange={(e) => setForm({ ...form, lessonType: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Select type</option>
                  {lessonTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {availablePackages.length > 0 && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Link to Package (optional)
                  </label>
                  <select
                    value={form.packageId}
                    onChange={(e) => setForm({ ...form, packageId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="">No package</option>
                    {availablePackages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.clientName} - {p.lessonType} ({p.packageBalance} left)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Time</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Hours</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={form.hours}
                    onChange={(e) => setForm({ ...form, hours: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as "scheduled" | "completed" })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="completed">Completed</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Add Lesson"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
