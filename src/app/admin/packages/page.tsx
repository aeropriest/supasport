"use client";

import { useEffect, useState } from "react";
import { getPackages, getClients, addPackage, updatePackage, deletePackage } from "@/lib/firestore";
import { Package, Client } from "@/lib/types";
import { Plus, Pencil, Trash2, X } from "lucide-react";

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [form, setForm] = useState({
    clientId: "",
    lessonType: "",
    packageSize: "",
    pricePerLesson: "",
    packageDate: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [p, c] = await Promise.all([getPackages(), getClients()]);
      setPackages(p);
      setClients(c);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const lessonTypes = [
    "Private Lesson",
    "Group Lesson",
    "One-on-One Lesson",
    "Semi-Private Lesson",
    "Custom Lesson",
  ];

  const openAdd = () => {
    setEditingPkg(null);
    setForm({
      clientId: "",
      lessonType: "",
      packageSize: "",
      pricePerLesson: "",
      packageDate: new Date().toISOString().split("T")[0],
    });
    setError("");
    setShowModal(true);
  };

  const openEdit = (pkg: Package) => {
    setEditingPkg(pkg);
    setForm({
      clientId: pkg.clientId,
      lessonType: pkg.lessonType,
      packageSize: String(pkg.packageSize),
      pricePerLesson: String(pkg.pricePerLesson),
      packageDate: pkg.packageDate,
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.clientId || !form.lessonType || !form.packageSize || !form.pricePerLesson) {
      setError("All fields are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const client = clients.find((c) => c.id === form.clientId);
      const size = parseInt(form.packageSize);
      const price = parseFloat(form.pricePerLesson);

      if (editingPkg) {
        await updatePackage(editingPkg.id, {
          clientId: form.clientId,
          clientName: client?.name || "",
          lessonType: form.lessonType,
          packageSize: size,
          pricePerLesson: price,
          totalPrice: size * price,
          packageDate: form.packageDate,
        });
      } else {
        await addPackage({
          clientId: form.clientId,
          clientName: client?.name || "",
          lessonType: form.lessonType,
          packageDate: form.packageDate,
          packageSize: size,
          packageBalance: size,
          pricePerLesson: price,
          totalPrice: size * price,
          status: "active",
          createdAt: new Date().toISOString(),
        });
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save package");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return;
    try {
      await deletePackage(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Packages</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add Package
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Lesson Type</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Balance</th>
              <th className="px-4 py-3 font-medium">Price/Lesson</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg) => (
              <tr key={pkg.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium text-gray-800">{pkg.clientName}</td>
                <td className="px-4 py-3 text-gray-600">{pkg.lessonType}</td>
                <td className="px-4 py-3 text-gray-600">{pkg.packageDate}</td>
                <td className="px-4 py-3 text-gray-600">{pkg.packageSize}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      pkg.packageBalance === 0
                        ? "bg-red-100 text-red-700"
                        : pkg.packageBalance <= 2
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {pkg.packageBalance}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">${pkg.pricePerLesson}</td>
                <td className="px-4 py-3 text-gray-600">${pkg.totalPrice}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      pkg.status === "active"
                        ? "bg-green-100 text-green-700"
                        : pkg.status === "completed"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {pkg.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEdit(pkg)}
                    className="mr-2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {packages.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                  No packages yet. Add your first package!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingPkg ? "Edit Package" : "Add Package"}
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
                <label className="mb-1 block text-sm font-medium text-gray-700">Client *</label>
                <select
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Select a client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Lesson Type *</label>
                <select
                  value={form.lessonType}
                  onChange={(e) => setForm({ ...form, lessonType: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Select lesson type</option>
                  {lessonTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Package Date *</label>
                <input
                  type="date"
                  value={form.packageDate}
                  onChange={(e) => setForm({ ...form, packageDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Package Size (lessons) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.packageSize}
                    onChange={(e) => setForm({ ...form, packageSize: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Price per Lesson ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.pricePerLesson}
                    onChange={(e) => setForm({ ...form, pricePerLesson: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
              {form.packageSize && form.pricePerLesson && (
                <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700">
                  Total: ${(parseInt(form.packageSize) * parseFloat(form.pricePerLesson)).toFixed(2)}
                </div>
              )}
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
                {saving ? "Saving..." : editingPkg ? "Update" : "Create Package"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
