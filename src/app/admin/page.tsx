"use client";

import { useEffect, useState } from "react";
import { getCoaches, getClients, getPackages, getLessons } from "@/lib/firestore";
import { Coach, Client, Package, Lesson } from "@/lib/types";
import { Users, UserCheck, Package as PackageIcon, CalendarDays, AlertTriangle, DollarSign } from "lucide-react";

export default function AdminDashboard() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [c, cl, p, l] = await Promise.all([
        getCoaches(),
        getClients(),
        getPackages(),
        getLessons(),
      ]);
      setCoaches(c);
      setClients(cl);
      setPackages(p);
      setLessons(l);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const lowBalancePackages = packages.filter(
    (p) => p.status === "active" && p.packageBalance <= 2
  );

  const completedLessons = lessons.filter((l) => l.status === "completed");

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthlyLessons = completedLessons.filter((l) => {
    const d = new Date(l.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthlyRevenue = monthlyLessons.reduce((sum, l) => sum + (l.payment || 0), 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Dashboard Overview</h1>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={UserCheck} label="Coaches" value={coaches.length} color="blue" />
        <StatCard icon={Users} label="Clients" value={clients.length} color="green" />
        <StatCard icon={PackageIcon} label="Active Packages" value={packages.filter((p) => p.status === "active").length} color="purple" />
        <StatCard icon={CalendarDays} label="Total Lessons" value={lessons.length} color="orange" />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-800">${monthlyRevenue.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">{monthlyLessons.length} lessons this month</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Low Balance Alerts</p>
              <p className="text-2xl font-bold text-gray-800">{lowBalancePackages.length}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">Packages with 2 or fewer lessons remaining</p>
        </div>
      </div>

      {/* Low Balance Packages */}
      {lowBalancePackages.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            ⚠️ Clients Running Low on Lessons
          </h2>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Lesson Type</th>
                  <th className="px-4 py-3 font-medium">Remaining</th>
                  <th className="px-4 py-3 font-medium">Package Size</th>
                </tr>
              </thead>
              <tbody>
                {lowBalancePackages.map((pkg) => (
                  <tr key={pkg.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-800">{pkg.clientName}</td>
                    <td className="px-4 py-3 text-gray-600">{pkg.lessonType}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        pkg.packageBalance === 0
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {pkg.packageBalance} left
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{pkg.packageSize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Lessons */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Recent Lessons</h2>
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Coach</th>
                <th className="px-4 py-3 font-medium">Client(s)</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Hours</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {lessons.slice(0, 10).map((lesson) => (
                <tr key={lesson.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-gray-800">{lesson.date}</td>
                  <td className="px-4 py-3 text-gray-600">{lesson.coachName}</td>
                  <td className="px-4 py-3 text-gray-600">{lesson.clientNames?.join(", ")}</td>
                  <td className="px-4 py-3 text-gray-600">{lesson.lessonType}</td>
                  <td className="px-4 py-3 text-gray-600">{lesson.hours}h</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      lesson.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : lesson.status === "cancelled"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {lesson.status}
                    </span>
                  </td>
                </tr>
              ))}
              {lessons.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No lessons yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
}
