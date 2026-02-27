"use client";

import { useEffect, useState } from "react";
import {
  getMenuItems,
  getCategories,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  MenuItem,
  Category,
} from "@/lib/supabase";

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    is_available: true,
    is_recommended: false,
    preparation_time: "15",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [items, cats] = await Promise.all([
        getMenuItems(undefined, false),
        getCategories(false),
      ]);
      setMenuItems(items);
      setCategories(cats);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openForm = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || "",
        price: item.price.toString(),
        category_id: item.category_id || "",
        is_available: item.is_available,
        is_recommended: item.is_recommended,
        preparation_time: item.preparation_time.toString(),
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        category_id: "",
        is_available: true,
        is_recommended: false,
        preparation_time: "15",
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
        price: parseFloat(formData.price),
        category_id: formData.category_id || null,
        is_available: formData.is_available,
        is_recommended: formData.is_recommended,
        preparation_time: parseInt(formData.preparation_time),
      };

      if (editingItem) {
        const updated = await updateMenuItem(editingItem.id, data);
        if (updated) {
          setMenuItems((prev) =>
            prev.map((item) => (item.id === editingItem.id ? { ...item, ...updated } : item))
          );
        }
      } else {
        const created = await createMenuItem(data);
        if (created) {
          setMenuItems((prev) => [...prev, created]);
        }
      }

      setShowForm(false);
    } catch (error) {
      console.error("Failed to save menu item:", error);
      alert("ไม่สามารถบันทึกได้ กรุณาลองใหม่");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบเมนูนี้?")) return;

    const success = await deleteMenuItem(id);
    if (success) {
      setMenuItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const filteredItems =
    selectedCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category_id === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">จัดการเมนูอาหาร</h1>
        <button onClick={() => openForm()} className="btn btn-primary">
          + เพิ่มเมนูใหม่
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            selectedCategory === "all"
              ? "bg-primary text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          ทั้งหมด ({menuItems.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? "bg-primary text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {cat.name} ({menuItems.filter((m) => m.category_id === cat.id).length})
          </button>
        ))}
      </div>

      {/* Menu Items */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="spinner"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p>ยังไม่มีเมนูอาหาร</p>
          <button onClick={() => openForm()} className="btn btn-primary mt-4">
            เพิ่มเมนูแรก
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="card p-4">
              {/* Badges */}
              <div className="flex gap-2 mb-2">
                {!item.is_available && (
                  <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                    ปิดขาย
                  </span>
                )}
                {item.is_recommended && (
                  <span className="bg-accent text-gray-800 text-xs px-2 py-1 rounded-full">
                    แนะนำ
                  </span>
                )}
              </div>

              {/* Content */}
              <div>
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-primary">฿{item.price.toLocaleString()}</span>
                  <div className="flex gap-2">
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
          <div className="absolute inset-4 lg:inset-y-8 lg:inset-x-1/4 bg-white rounded-2xl overflow-hidden flex flex-col slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                {editingItem ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}
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
                  ชื่อเมนู <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="เช่น ข้าวผัดกุ้ง"
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
                  placeholder="อธิบายเมนู"
                  rows={3}
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ราคา (บาท) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input"
                    placeholder="0"
                    min="0"
                    step="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="input"
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preparation Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เวลาเตรียม (นาที)</label>
                <input
                  type="number"
                  value={formData.preparation_time}
                  onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                  className="input"
                  min="1"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm text-gray-700">เปิดขาย</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_recommended}
                    onChange={(e) => setFormData({ ...formData, is_recommended: e.target.checked })}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm text-gray-700">เมนูแนะนำ</span>
                </label>
              </div>
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
