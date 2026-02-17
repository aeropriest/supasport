"use client";

import { useEffect, useState, useMemo } from "react";
import {
  getLessons,
  getCoaches,
  getClients,
  getPackages,
  addLesson,
  updateLesson,
  deleteLesson,
  markLessonCompleted,
} from "@/lib/firestore";
import { Lesson, Coach, Client, Package } from "@/lib/types";
import { Plus, Trash2, X, CheckCircle, Calendar, List, ChevronLeft, ChevronRight } from "lucide-react";

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterCoach, setFilterCoach] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [form, setForm] = useState({
    coachId: "",
    clientIds: [] as string[],
    packageId: "",
    lessonType: "",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    hours: "1",
    coachHours: "1",
    payment: "0",
    notes: "",
    status: "scheduled" as "scheduled" | "completed" | "cancelled",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [l, co, cl, p] = await Promise.all([
        getLessons(),
        getCoaches(),
        getClients(),
        getPackages(),
      ]);
      setLessons(l);
      setCoaches(co);
      setClients(cl);
      setPackages(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const lessonTypes = [
    "Private",
    "Semi-Private Group",
    "Custom-Private",
    "Custom-Semi-Private",
    "Custom Group",
  ];

  const openAdd = () => {
    setForm({
      coachId: "",
      clientIds: [],
      packageId: "",
      lessonType: "",
      date: new Date().toISOString().split("T")[0],
      time: "09:00",
      hours: "1",
      coachHours: "1",
      payment: "0",
      notes: "",
      status: "scheduled",
    });
    setError("");
    setShowModal(true);
  };

  const toggleClient = (clientId: string) => {
    setForm((prev) => ({
      ...prev,
      clientIds: prev.clientIds.includes(clientId)
        ? prev.clientIds.filter((id) => id !== clientId)
        : [...prev.clientIds, clientId],
    }));
  };

  const handleSave = async () => {
    if (!form.coachId || form.clientIds.length === 0 || !form.lessonType || !form.date) {
      setError("Coach, at least one client, lesson type, and date are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const coach = coaches.find((c) => c.id === form.coachId);
      const selectedClients = clients.filter((c) => form.clientIds.includes(c.id));
      const sessionId = `S-${Date.now().toString(36).toUpperCase()}`;

      const lessonData: any = {
        coachId: form.coachId,
        coachName: coach?.name || "",
        clientIds: form.clientIds,
        clientNames: selectedClients.map((c) => c.name),
        lessonType: form.lessonType,
        date: form.date,
        time: form.time,
        hours: parseFloat(form.hours),
        sessionId,
        coachHours: parseFloat(form.coachHours),
        payment: parseFloat(form.payment),
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
      setError(err.message || "Failed to save lesson");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await markLessonCompleted(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;
    try {
      await deleteLesson(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLessons = lessons.filter((l) => {
    if (filterCoach && l.coachId !== filterCoach) return false;
    if (filterStatus && l.status !== filterStatus) return false;
    return true;
  });

  // Get active packages for selected clients
  const availablePackages = packages.filter(
    (p) => p.status === "active" && form.clientIds.includes(p.clientId)
  );

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [firstDayOfWeek, daysInMonth]);

  const getLessonsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return filteredLessons.filter((l) => l.date === dateStr);
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Lessons</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add Lesson
        </button>
      </div>

      {/* View Toggle and Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
              viewMode === "list"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <List className="h-4 w-4" />
            List
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
              viewMode === "calendar"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </button>
        </div>
        <select
          value={filterCoach}
          onChange={(e) => setFilterCoach(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Coaches</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="mb-4 flex items-center justify-between">
            <button onClick={prevMonth} className="rounded-lg p-2 hover:bg-gray-100">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {monthNames[month]} {year}
            </h2>
            <button onClick={nextMonth} className="rounded-lg p-2 hover:bg-gray-100">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="aspect-square" />;
              }
              const dayLessons = getLessonsForDay(day);
              const isToday =
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();

              return (
                <div
                  key={day}
                  className={`min-h-24 rounded-lg border p-2 ${
                    isToday ? "border-indigo-500 bg-indigo-50" : "border-gray-200"
                  }`}
                >
                  <div className={`text-sm font-medium ${
                    isToday ? "text-indigo-700" : "text-gray-700"
                  }`}>
                    {day}
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayLessons.slice(0, 3).map((lesson) => (
                      <div
                        key={lesson.id}
                        className={`rounded px-1.5 py-1 text-xs ${
                          lesson.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : lesson.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        <div className="font-medium truncate">{lesson.time}</div>
                        <div className="truncate">{lesson.coachName}</div>
                        <div className="truncate text-xs opacity-75">
                          {lesson.clientNames?.join(", ")}
                        </div>
                      </div>
                    ))}
                    {dayLessons.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayLessons.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Coach</th>
              <th className="px-4 py-3 font-medium">Client(s)</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Hours</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Session ID</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLessons.map((lesson) => (
              <tr key={lesson.id} className="border-b last:border-0">
                <td className="px-4 py-3 text-gray-800">{lesson.date}</td>
                <td className="px-4 py-3 text-gray-600">{lesson.time}</td>
                <td className="px-4 py-3 text-gray-600">{lesson.coachName}</td>
                <td className="px-4 py-3 text-gray-600">{lesson.clientNames?.join(", ")}</td>
                <td className="px-4 py-3 text-gray-600">{lesson.lessonType}</td>
                <td className="px-4 py-3 text-gray-600">{lesson.hours}h</td>
                <td className="px-4 py-3 text-gray-600">${lesson.payment}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{lesson.sessionId}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      lesson.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : lesson.status === "cancelled"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {lesson.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {lesson.status === "scheduled" && (
                    <button
                      onClick={() => handleComplete(lesson.id)}
                      className="mr-2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-green-600"
                      title="Mark Completed"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(lesson.id)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredLessons.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                  No lessons found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      )}

      {/* Add Lesson Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Add Lesson</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Coach *</label>
                <select
                  value={form.coachId}
                  onChange={(e) => setForm({ ...form, coachId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Select coach</option>
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Client(s) *</label>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-300 p-2">
                  {clients.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.clientIds.includes(c.id)}
                        onChange={() => toggleClient(c.id)}
                        className="rounded border-gray-300 text-indigo-600"
                      />
                      <span className="text-sm text-gray-700">{c.name}</span>
                    </label>
                  ))}
                  {clients.length === 0 && (
                    <p className="px-2 py-1 text-sm text-gray-400">No clients available</p>
                  )}
                </div>
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
                    <option key={t} value={t}>
                      {t}
                    </option>
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
                        {p.clientName} - {p.lessonType} ({p.packageBalance} remaining)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Time *</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Coach Hours</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={form.coachHours}
                    onChange={(e) => setForm({ ...form, coachHours: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Payment ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.payment}
                    onChange={(e) => setForm({ ...form, payment: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as "scheduled" | "completed" | "cancelled" })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
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
