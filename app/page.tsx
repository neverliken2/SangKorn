"use client";

import { useEffect, useState } from "react";
import { initializeLiff, getLiffProfile } from "@/lib/liff";
import {
  getShopSettings,
  getCategories,
  getMenuItems,
  getAllCategoryOptions,
  ShopSettings,
  Category,
  MenuItem,
  CategoryOption,
} from "@/lib/supabase";
import MenuSection from "@/components/MenuSection";
import CartButton from "@/components/CartButton";
import CartModal from "@/components/CartModal";
import OrderModal from "@/components/OrderModal";
import OrderHistoryButton from "@/components/OrderHistoryButton";

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedOptions?: Record<string, string | string[]>;
  optionsPrice?: number;
  notes?: string;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [shop, setShop] = useState<ShopSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize LIFF
      const liffInitialized = await initializeLiff();
      
      if (liffInitialized) {
        // Get LINE profile
        const profile = await getLiffProfile();
        if (profile) {
          setLineUserId(profile.userId);
          setCustomerName(profile.displayName);
        }
      }

      // Load shop data
      const [shopData, categoriesData, menuData, optionsData] = await Promise.all([
        getShopSettings(),
        getCategories(),
        getMenuItems(),
        getAllCategoryOptions(),
      ]);

      setShop(shopData);
      setCategories(categoriesData);
      setMenuItems(menuData);
      setCategoryOptions(optionsData);
    } catch (error) {
      console.error("Failed to initialize app:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (menuItem: MenuItem, quantity: number = 1, selectedOptions?: Record<string, string | string[]>, optionsPrice: number = 0) => {
    setCart((prev) => {
      // For items with options, we don't group them - each selection is unique
      if (selectedOptions && Object.keys(selectedOptions).length > 0) {
        return [...prev, { menuItem, quantity, selectedOptions, optionsPrice }];
      }
      
      // For items without options, group them
      const existingIndex = prev.findIndex(
        (item) => item.menuItem.id === menuItem.id && !item.selectedOptions
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { menuItem, quantity }];
    });
  };

  const updateCartItem = (index: number, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      const updated = [...prev];
      updated[index].quantity = quantity;
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + (item.menuItem.price + (item.optionsPrice || 0)) * item.quantity,
    0
  );

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredMenuItems = selectedCategory
    ? menuItems.filter((item) => item.category_id === selectedCategory)
    : menuItems;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-primary text-white sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {shop?.logo_url && (
                <img
                  src={shop.logo_url}
                  alt={shop.shop_name}
                  className="w-10 h-10 rounded-full object-cover bg-white"
                />
              )}
              <div>
                <h1 className="text-lg font-semibold">{shop?.shop_name || "ร้านอาหาร"}</h1>
                <p className="text-xs opacity-80">
                  {shop?.is_open ? "เปิดให้บริการ" : "ปิดให้บริการ"}
                </p>
              </div>
            </div>
            <OrderHistoryButton lineUserId={lineUserId} />
          </div>
        </div>

        {/* Categories */}
        <div className="px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                selectedCategory === null
                  ? "bg-white text-primary font-medium"
                  : "bg-primary-dark text-white"
              }`}
            >
              ทั้งหมด
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? "bg-white text-primary font-medium"
                    : "bg-primary-dark text-white"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Menu Items */}
      <MenuSection
        items={filteredMenuItems}
        onAddToCart={addToCart}
        categories={categories}
        categoryOptions={categoryOptions}
      />

      {/* Cart Button */}
      <CartButton
        itemCount={cartItemCount}
        total={cartTotal}
        onClick={() => setIsCartOpen(true)}
      />

      {/* Cart Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateItem={updateCartItem}
        onRemoveItem={removeFromCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsOrderModalOpen(true);
        }}
        total={cartTotal}
      />

      {/* Order Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        cart={cart}
        lineUserId={lineUserId}
        customerName={customerName}
        total={cartTotal}
        minPickupTime={shop?.min_pickup_time || 15}
        onOrderSuccess={() => {
          clearCart();
          setIsOrderModalOpen(false);
        }}
      />
    </main>
  );
}
