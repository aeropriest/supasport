"use client";

import { useEffect, useState } from "react";
import { getCoaches, getClients, getPackages, getLessons } from "@/lib/firestore";
import { Coach, Client, Package, Lesson } from "@/lib/types";
import { DollarSign, Users, UserCheck, TrendingUp, AlertTriangle } from "lucide-react";

export default function ReportsPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"revenue" | "coaches" | "clients" | "packages">("revenue");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [co, cl, p, l] = await Promise.all([
        getCoaches(),
        getClients(),
        getPackages(),
        getLessons(),
      ]);
      setCoaches(co);
      setClients(cl);
      setPackages(p);
      setLessons(l);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Revenue calculations
  const getMonthlyRevenue = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const monthLessons = lessons.filter((l) => {
      const d = new Date(l.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
    const totalRevenue = monthLessons.reduce((sum, l) => sum + (l.payment || 0), 0);
    const completedCount = monthLessons.filter((l) => l.status === "completed").length;
    const scheduledCount = monthLessons.filter((l) => l.status === "scheduled").length;
    const totalHours = monthLessons.reduce((sum, l) => sum + (l.hours || 0), 0);
    return { totalRevenue, completedCount, scheduledCount, totalHours, monthLessons };
  };

  // Monthly revenue breakdown by lesson type
  const getRevenueByType = () => {
    const { monthLessons } = getMonthlyRevenue();
    const byType: Record<string, { count: number; revenue: number; hours: number }> = {};
    monthLessons.forEach((l) => {
      if (!byType[l.lessonType]) byType[l.lessonType] = { count: 0, revenue: 0, hours: 0 };
      byType[l.lessonType].count++;
      byType[l.lessonType].revenue += l.payment || 0;
      byType[l.lessonType].hours += l.hours || 0;
    });
    return byType;
  };

  // Coach reports
  const getCoachReports = () => {
    return coaches.map((coach) => {
      const coachLessons = lessons.filter((l) => l.coachId === coach.id);
      const completed = coachLessons.filter((l) => l.status === "completed");
      const totalHours = completed.reduce((sum, l) => sum + (l.coachHours || 0), 0);
      const totalRevenue = completed.reduce((sum, l) => sum + (l.payment || 0), 0);
      return {
        ...coach,
        totalLessons: coachLessons.length,
        completedLessons: completed.length,
        totalHours,
        totalRevenue,
      };
    });
  };

  // Client reports
  const getClientReports = () => {
    return clients.map((client) => {
      const clientLessons = lessons.filter((l) => l.clientIds?.includes(client.id));
      const completed = clientLessons.filter((l) => l.status === "completed");
      const clientPackages = packages.filter((p) => p.clientId === client.id);
      const activePackages = clientPackages.filter((p) => p.status === "active");
      const totalBalance = activePackages.reduce((sum, p) => sum + p.packageBalance, 0);
      const totalSpent = clientPackages.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
      return {
        ...client,
        totalLessons: clientLessons.length,
        completedLessons: completed.length,
        activePackages: activePackages.length,
        totalBalance,
        totalSpent,
      };
    });
  };

  // Package alerts
  const getLowBalancePackages = () => {
    return packages
      .filter((p) => p.status === "active" && p.packageBalance <= 2)
      .sort((a, b) => a.packageBalance - b.packageBalance);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const { totalRevenue, completedCount, scheduledCount, totalHours } = getMonthlyRevenue();
  const revenueByType = getRevenueByType();
  const coachReports = getCoachReports();
  const clientReports = getClientReports();
  const lowBalancePackages = getLowBalancePackages();

  const tabs = [
    { id: "revenue" as const, label: "Revenue", icon: DollarSign },
    { id: "coaches" as const, label: "Coaches", icon: UserCheck },
    { id: "clients" as const, label: "Clients", icon: Users },
    { id: "packages" as const, label: "Package Alerts", icon: AlertTriangle },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Reports</h1>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Revenue Tab */}
      {activeTab === "revenue" && (
        <div>
          <div className="mb-4">
            <label className="mr-2 text-sm font-medium text-gray-700">Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Revenue</p>
                  <p className="text-xl font-bold text-gray-800">${totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Completed Lessons</p>
                  <p className="text-xl font-bold text-gray-800">{completedCount}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500">Scheduled</p>
              <p className="text-xl font-bold text-gray-800">{scheduledCount}</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500">Total Hours</p>
              <p className="text-xl font-bold text-gray-800">{totalHours}h</p>
            </div>
          </div>

          <h3 className="mb-3 text-lg font-semibold text-gray-800">Revenue by Lesson Type</h3>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Lesson Type</th>
                  <th className="px-4 py-3 font-medium">Lessons</th>
                  <th className="px-4 py-3 font-medium">Hours</th>
                  <th className="px-4 py-3 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(revenueByType).map(([type, data]) => (
                  <tr key={type} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-800">{type}</td>
                    <td className="px-4 py-3 text-gray-600">{data.count}</td>
                    <td className="px-4 py-3 text-gray-600">{data.hours}h</td>
                    <td className="px-4 py-3 font-medium text-green-600">${data.revenue.toLocaleString()}</td>
                  </tr>
                ))}
                {Object.keys(revenueByType).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                      No data for this month
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Coaches Tab */}
      {activeTab === "coaches" && (
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-800">Coach Performance</h3>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Coach</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Total Lessons</th>
                  <th className="px-4 py-3 font-medium">Completed</th>
                  <th className="px-4 py-3 font-medium">Total Hours</th>
                  <th className="px-4 py-3 font-medium">Revenue Generated</th>
                </tr>
              </thead>
              <tbody>
                {coachReports.map((coach) => (
                  <tr key={coach.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-800">{coach.name}</td>
                    <td className="px-4 py-3 text-gray-600">{coach.email}</td>
                    <td className="px-4 py-3 text-gray-600">{coach.totalLessons}</td>
                    <td className="px-4 py-3 text-gray-600">{coach.completedLessons}</td>
                    <td className="px-4 py-3 text-gray-600">{coach.totalHours}h</td>
                    <td className="px-4 py-3 font-medium text-green-600">
                      ${coach.totalRevenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {coachReports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No coaches yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clients Tab */}
      {activeTab === "clients" && (
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-800">Client Overview</h3>
          <div className="mb-4 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">
              Total Clients: <span className="font-bold text-gray-800">{clients.length}</span>
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Total Lessons</th>
                  <th className="px-4 py-3 font-medium">Completed</th>
                  <th className="px-4 py-3 font-medium">Active Packages</th>
                  <th className="px-4 py-3 font-medium">Lessons Remaining</th>
                  <th className="px-4 py-3 font-medium">Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {clientReports.map((client) => (
                  <tr key={client.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-800">{client.name}</td>
                    <td className="px-4 py-3 text-gray-600">{client.email || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{client.phone || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{client.totalLessons}</td>
                    <td className="px-4 py-3 text-gray-600">{client.completedLessons}</td>
                    <td className="px-4 py-3 text-gray-600">{client.activePackages}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          client.totalBalance === 0
                            ? "bg-red-100 text-red-700"
                            : client.totalBalance <= 2
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {client.totalBalance}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-green-600">
                      ${client.totalSpent.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {clientReports.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      No clients yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Package Alerts Tab */}
      {activeTab === "packages" && (
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-800">
            Packages Running Low (≤ 2 lessons remaining)
          </h3>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Lesson Type</th>
                  <th className="px-4 py-3 font-medium">Package Size</th>
                  <th className="px-4 py-3 font-medium">Remaining</th>
                  <th className="px-4 py-3 font-medium">Used</th>
                  <th className="px-4 py-3 font-medium">Action Needed</th>
                </tr>
              </thead>
              <tbody>
                {lowBalancePackages.map((pkg) => {
                  const client = clients.find((c) => c.id === pkg.clientId);
                  return (
                    <tr key={pkg.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-800">{pkg.clientName}</p>
                          {client?.phone && (
                            <p className="text-xs text-gray-400">{client.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{pkg.lessonType}</td>
                      <td className="px-4 py-3 text-gray-600">{pkg.packageSize}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            pkg.packageBalance === 0
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {pkg.packageBalance} left
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {pkg.packageSize - pkg.packageBalance}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-red-600">
                        {pkg.packageBalance === 0 ? "Call to renew!" : "Running low - follow up"}
                      </td>
                    </tr>
                  );
                })}
                {lowBalancePackages.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      All packages have sufficient balance
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
