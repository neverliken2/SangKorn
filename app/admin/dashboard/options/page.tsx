"use client";

import { useEffect, useState } from "react";
import {
  getCategories,
  getAllCategoryOptions,
  createCategoryOption,
  updateCategoryOption,
  deleteCategoryOption,
  Category,
  CategoryOption,
  CategoryOptionChoice,
} from "@/lib/supabase";

export default function OptionsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [options, setOptions] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<CategoryOption | null>(null);
  const [formData, setFormData] = useState({
    category_id: "",
    name: "",
    choices: [{ label: "", price: 0 }] as CategoryOptionChoice[],
    is_required: false,
    allow_multiple: false,
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [categoriesData, optionsData] = await Promise.all([
        getCategories(false),
        getAllCategoryOptions(false),
      ]);
      setCategories(categoriesData);
      setOptions(optionsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOptions = options.filter((opt) =>
    selectedCategoryId === "all" ? true : opt.category_id === selectedCategoryId
  );

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.name || "ไม่ระบุ";
  };

  const openAddModal = () => {
    setEditingOption(null);
    setFormData({
      category_id: categories[0]?.id || "",
      name: "",
      choices: [{ label: "", price: 0 }],
      is_required: false,
      allow_multiple: false,
      sort_order: 0,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (option: CategoryOption) => {
    setEditingOption(option);
    setFormData({
      category_id: option.category_id,
      name: option.name,
      choices: option.choices.length > 0 ? option.choices : [{ label: "", price: 0 }],
      is_required: option.is_required,
      allow_multiple: option.allow_multiple,
      sort_order: option.sort_order,
      is_active: option.is_active,
    });
    setIsModalOpen(true);
  };

  const handleAddChoice = () => {
    setFormData((prev) => ({
      ...prev,
      choices: [...prev.choices, { label: "", price: 0 }],
    }));
  };

  const handleRemoveChoice = (index: number) => {
    if (formData.choices.length > 1) {
      setFormData((prev) => ({
        ...prev,
        choices: prev.choices.filter((_, i) => i !== index),
      }));
    }
  };

  const handleChoiceChange = (index: number, field: "label" | "price", value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      choices: prev.choices.map((choice, i) =>
        i === index ? { ...choice, [field]: value } : choice
      ),
    }));
  };

  const handleSubmit = async () => {
    // Validate
    if (!formData.name.trim()) {
      alert("กรุณาใส่ชื่อตัวเลือก");
      return;
    }
    const validChoices = formData.choices.filter((c) => c.label.trim());
    if (validChoices.length === 0) {
      alert("กรุณาเพิ่มตัวเลือกอย่างน้อย 1 รายการ");
      return;
    }

    const optionData = {
      ...formData,
      choices: validChoices,
    };

    if (editingOption) {
      const result = await updateCategoryOption(editingOption.id, optionData);
      if (result) {
        setOptions((prev) =>
          prev.map((o) => (o.id === editingOption.id ? { ...o, ...optionData } : o))
        );
      }
    } else {
      const result = await createCategoryOption(optionData);
      if (result) {
        setOptions((prev) => [...prev, result]);
      }
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบตัวเลือกนี้?")) return;
    
    const result = await deleteCategoryOption(id);
    if (result) {
      setOptions((prev) => prev.filter((o) => o.id !== id));
    }
  };

  const handleToggleActive = async (option: CategoryOption) => {
    const result = await updateCategoryOption(option.id, { is_active: !option.is_active });
    if (result) {
      setOptions((prev) =>
        prev.map((o) => (o.id === option.id ? { ...o, is_active: !o.is_active } : o))
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">ตัวเลือกประจำหมวดหมู่</h1>
        <button onClick={openAddModal} className="btn btn-primary">
          + เพิ่มตัวเลือก
        </button>
      </div>

      {/* Category Filter */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">หมวดหมู่</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategoryId("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategoryId === "all"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            ทั้งหมด
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategoryId === cat.id
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Options List */}
      <div className="space-y-4">
        {filteredOptions.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            ยังไม่มีตัวเลือก
          </div>
        ) : (
          filteredOptions.map((option) => (
            <div
              key={option.id}
              className={`card p-4 ${!option.is_active ? "opacity-60" : ""}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{option.name}</h3>
                    {option.is_required && (
                      <span className="badge badge-primary text-xs">จำเป็น</span>
                    )}
                    {option.allow_multiple && (
                      <span className="badge badge-pending text-xs">เลือกได้หลายอย่าง</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    หมวด: {getCategoryName(option.category_id)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {option.choices.map((choice, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-violet-100 rounded text-sm text-violet-800"
                      >
                        {choice.label}
                        {choice.price > 0 && (
                          <span className="text-violet-600 font-medium ml-1">+฿{choice.price}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(option)}
                    className={`p-2 rounded ${
                      option.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                    title={option.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  >
                    {option.is_active ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(option)}
                    className="p-2 bg-blue-100 text-blue-700 rounded"
                    title="แก้ไข"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(option.id)}
                    className="p-2 bg-red-100 text-red-700 rounded"
                    title="ลบ"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 fade-in">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 mx-auto max-w-lg bg-white rounded-xl shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="px-4 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingOption ? "แก้ไขตัวเลือก" : "เพิ่มตัวเลือกใหม่"}
              </h2>
            </div>
            <div className="p-4 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมวดหมู่
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value }))}
                  className="input"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อตัวเลือก (เช่น ความหวาน, ประเภทการคั่ว)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="input"
                  placeholder="ความหวาน"
                />
              </div>

              {/* Choices */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ตัวเลือก
                </label>
                <div className="space-y-2">
                  {formData.choices.map((choice, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={choice.label}
                        onChange={(e) => handleChoiceChange(idx, "label", e.target.value)}
                        className="input flex-1"
                        placeholder="ชื่อตัวเลือก"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">+฿</span>
                        <input
                          type="number"
                          value={choice.price}
                          onChange={(e) => handleChoiceChange(idx, "price", parseFloat(e.target.value) || 0)}
                          className="input w-20"
                          min="0"
                          step="5"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveChoice(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                        disabled={formData.choices.length <= 1}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddChoice}
                  className="mt-2 text-primary text-sm font-medium hover:underline"
                >
                  + เพิ่มตัวเลือก
                </button>
              </div>

              {/* Settings */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_required}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_required: e.target.checked }))}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm text-gray-700">บังคับเลือก</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.allow_multiple}
                    onChange={(e) => setFormData((prev) => ({ ...prev, allow_multiple: e.target.checked }))}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm text-gray-700">เลือกได้หลายอย่าง</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm text-gray-700">เปิดใช้งาน</span>
                </label>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ลำดับการแสดง
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  className="input w-24"
                  min="0"
                />
              </div>
            </div>
            <div className="px-4 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                ยกเลิก
              </button>
              <button onClick={handleSubmit} className="btn btn-primary">
                {editingOption ? "บันทึก" : "เพิ่ม"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
