"use client";

import { useEffect, useState } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  Category,
} from "@/lib/supabase";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Category | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sort_order: "0",
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getCategories(false);
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openForm = (item?: Category) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || "",
        sort_order: item.sort_order.toString(),
        is_active: item.is_active,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        description: "",
        sort_order: "0",
        is_active: true,
      });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        name: formData.name,
        description: formData.description || null,
        sort_order: parseInt(formData.sort_order),
        is_active: formData.is_active,
      };

      if (editingItem) {
        const updated = await updateCategory(editingItem.id, data);
        if (updated) {
          setCategories((prev) =>
            prev.map((item) => (item.id === editingItem.id ? { ...item, ...updated } : item))
          );
        }
      } else {
        const created = await createCategory(data);
        if (created) {
          setCategories((prev) => [...prev, created]);
        }
      }

      setShowForm(false);
    } catch (error) {
      console.error("Failed to save category:", error);
      alert("ไม่สามารถบันทึกได้ กรุณาลองใหม่");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบหมวดหมู่นี้? (เมนูในหมวดหมู่จะไม่ถูกลบ)")) return;

    const success = await deleteCategory(id);
    if (success) {
      setCategories((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">จัดการหมวดหมู่</h1>
        <button onClick={() => openForm()} className="btn btn-primary">
          + เพิ่มหมวดหมู่ใหม่
        </button>
      </div>

      {/* Categories */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="spinner"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p>ยังไม่มีหมวดหมู่</p>
          <button onClick={() => openForm()} className="btn btn-primary mt-4">
            เพิ่มหมวดหมู่แรก
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((item) => (
            <div
              key={item.id}
              className={`card p-4 ${!item.is_active ? "opacity-60" : ""}`}
            >
              {/* Badge */}
              {!item.is_active && (
                <span className="inline-block bg-gray-800 text-white text-xs px-2 py-1 rounded-full mb-2">
                  ปิดใช้งาน
                </span>
              )}

              {/* Content */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">ลำดับ: {item.sort_order}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openForm(item)}
                      className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-500 hover:text-danger hover:bg-gray-100 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 fade-in">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="absolute inset-4 lg:inset-y-8 lg:inset-x-1/3 bg-white rounded-2xl overflow-hidden flex flex-col slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                {editingItem ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อหมวดหมู่ <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="เช่น อาหารจานเดียว"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  placeholder="อธิบายหมวดหมู่"
                  rows={2}
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ลำดับการแสดง</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  className="input"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">ตัวเลขน้อยจะแสดงก่อน</p>
              </div>

              {/* Is Active */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-primary rounded"
                />
                <span className="text-sm text-gray-700">เปิดใช้งาน</span>
              </label>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 btn btn-outline"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 btn btn-primary disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner"></div>
                    กำลังบันทึก...
                  </span>
                ) : (
                  "บันทึก"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
