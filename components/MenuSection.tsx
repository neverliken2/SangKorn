"use client";

import { useState } from "react";
import { MenuItem, Category, CategoryOption } from "@/lib/supabase";

interface MenuSectionProps {
  items: MenuItem[];
  onAddToCart: (item: MenuItem, quantity?: number, selectedOptions?: Record<string, string | string[]>, optionsPrice?: number) => void;
  categories: Category[];
  categoryOptions: CategoryOption[];
}

export default function MenuSection({ items, onAddToCart, categories, categoryOptions }: MenuSectionProps) {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | string[]>>({});

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "อื่นๆ";
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "อื่นๆ";
  };

  const getOptionsForCategory = (categoryId: string | null): CategoryOption[] => {
    if (!categoryId) return [];
    return categoryOptions.filter((opt) => opt.category_id === categoryId && opt.is_active);
  };

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const categoryId = item.category_id || "uncategorized";
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const handleAddClick = (item: MenuItem) => {
    const options = getOptionsForCategory(item.category_id);
    if (options.length > 0) {
      setSelectedItem(item);
      setQuantity(1);
      // Initialize options with defaults
      const defaults: Record<string, string | string[]> = {};
      options.forEach((opt) => {
        if (opt.is_required && opt.choices.length > 0) {
          defaults[opt.name] = opt.allow_multiple ? [] : opt.choices[0].label;
        } else {
          defaults[opt.name] = opt.allow_multiple ? [] : "";
        }
      });
      setSelectedOptions(defaults);
    } else {
      onAddToCart(item, 1);
    }
  };

  const handleOptionChange = (optionName: string, value: string, allowMultiple: boolean) => {
    setSelectedOptions((prev) => {
      if (allowMultiple) {
        const currentValues = (prev[optionName] as string[]) || [];
        if (currentValues.includes(value)) {
          return { ...prev, [optionName]: currentValues.filter((v) => v !== value) };
        } else {
          return { ...prev, [optionName]: [...currentValues, value] };
        }
      } else {
        return { ...prev, [optionName]: value };
      }
    });
  };

  const calculateOptionsPrice = (): number => {
    if (!selectedItem) return 0;
    const options = getOptionsForCategory(selectedItem.category_id);
    let total = 0;
    
    options.forEach((opt) => {
      const selected = selectedOptions[opt.name];
      if (opt.allow_multiple && Array.isArray(selected)) {
        selected.forEach((value) => {
          const choice = opt.choices.find((c) => c.label === value);
          if (choice) total += choice.price;
        });
      } else if (typeof selected === "string" && selected) {
        const choice = opt.choices.find((c) => c.label === selected);
        if (choice) total += choice.price;
      }
    });
    
    return total;
  };

  const handleConfirmAdd = () => {
    if (!selectedItem) return;
    
    const options = getOptionsForCategory(selectedItem.category_id);
    
    // Validate required options
    for (const opt of options) {
      if (opt.is_required) {
        const selected = selectedOptions[opt.name];
        if (opt.allow_multiple) {
          if (!Array.isArray(selected) || selected.length === 0) {
            alert(`กรุณาเลือก ${opt.name}`);
            return;
          }
        } else {
          if (!selected) {
            alert(`กรุณาเลือก ${opt.name}`);
            return;
          }
        }
      }
    }
    
    // Filter out empty options
    const filteredOptions: Record<string, string | string[]> = {};
    Object.entries(selectedOptions).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        filteredOptions[key] = value;
      } else if (typeof value === "string" && value) {
        filteredOptions[key] = value;
      }
    });
    
    const optionsPrice = calculateOptionsPrice();
    onAddToCart(selectedItem, quantity, filteredOptions, optionsPrice);
    setSelectedItem(null);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setSelectedOptions({});
    setQuantity(1);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p>ยังไม่มีเมนูอาหาร</p>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 py-4 space-y-6">
        {Object.entries(groupedItems).map(([categoryId, categoryItems]) => (
          <div key={categoryId}>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              {getCategoryName(categoryId === "uncategorized" ? null : categoryId)}
            </h2>
            <div className="space-y-3">
              {categoryItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  hasOptions={getOptionsForCategory(item.category_id).length > 0}
                  onAdd={() => handleAddClick(item)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Options Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 fade-in">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{selectedItem.name}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Options */}
              {getOptionsForCategory(selectedItem.category_id).map((option) => (
                <div key={option.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-semibold text-gray-900">{option.name}</h3>
                    {option.is_required && (
                      <span className="text-xs text-red-500">*จำเป็น</span>
                    )}
                    {option.allow_multiple && (
                      <span className="text-xs text-gray-500">(เลือกได้หลายอย่าง)</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {option.choices.map((choice) => {
                      const isSelected = option.allow_multiple
                        ? (selectedOptions[option.name] as string[] || []).includes(choice.label)
                        : selectedOptions[option.name] === choice.label;

                      return (
                        <button
                          key={choice.label}
                          onClick={() => handleOptionChange(option.name, choice.label, option.allow_multiple)}
                          className={`px-4 py-2 rounded-full border-2 transition-all ${
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          {choice.label}
                          {choice.price > 0 && (
                            <span className={`ml-1 text-sm ${isSelected ? "text-white/80" : "text-primary"}`}>
                              +฿{choice.price}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Quantity */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">จำนวน</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-gray-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-gray-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-gray-200 bg-white">
              <button
                onClick={handleConfirmAdd}
                className="btn btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                <span>เพิ่มลงตะกร้า</span>
                <span className="font-semibold">
                  ฿{((selectedItem.price + calculateOptionsPrice()) * quantity).toLocaleString()}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface MenuItemCardProps {
  item: MenuItem;
  hasOptions: boolean;
  onAdd: () => void;
}

function MenuItemCard({ item, hasOptions, onAdd }: MenuItemCardProps) {
  return (
    <div className="menu-item-card">
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-primary font-semibold">฿{item.price.toLocaleString()}</span>
              {item.is_recommended && (
                <span className="bg-accent text-gray-800 text-xs px-2 py-0.5 rounded-full">
                  แนะนำ
                </span>
              )}
              {hasOptions && (
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                  มีตัวเลือก
                </span>
              )}
            </div>
          </div>

          {/* Add Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            disabled={!item.is_available}
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              item.is_available
                ? "bg-primary text-white hover:bg-primary-dark active:scale-95"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
