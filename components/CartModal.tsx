"use client";

import { CartItem } from "@/app/page";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateItem: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onCheckout: () => void;
  total: number;
}

export default function CartModal({
  isOpen,
  onClose,
  cart,
  onUpdateItem,
  onRemoveItem,
  onCheckout,
  total,
}: CartModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">ตะกร้าสินค้า</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p>ตะกร้าว่างเปล่า</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, index) => (
                <CartItemRow
                  key={index}
                  item={item}
                  onUpdate={(quantity) => onUpdateItem(index, quantity)}
                  onRemove={() => onRemoveItem(index)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="px-4 py-4 border-t border-gray-200 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">รวมทั้งหมด</span>
              <span className="text-xl font-bold text-primary">฿{total.toLocaleString()}</span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full btn btn-primary py-4 text-lg"
            >
              สั่งอาหาร
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface CartItemRowProps {
  item: CartItem;
  onUpdate: (quantity: number) => void;
  onRemove: () => void;
}

function CartItemRow({ item, onUpdate, onRemove }: CartItemRowProps) {
  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
      {/* Icon */}
      <div className="w-12 h-12 flex-shrink-0 bg-violet-100 rounded-lg flex items-center justify-center">
        <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{item.menuItem.name}</h4>
        {/* Show selected options */}
        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
          <div className="mt-1 space-y-0.5">
            {Object.entries(item.selectedOptions).map(([key, value]) => (
              <p key={key} className="text-xs text-gray-500">
                {key}: {Array.isArray(value) ? value.join(", ") : value}
              </p>
            ))}
          </div>
        )}
        <p className="text-primary font-semibold mt-1">
          ฿{((item.menuItem.price + (item.optionsPrice || 0)) * item.quantity).toLocaleString()}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdate(item.quantity - 1)}
          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
        >
          {item.quantity === 1 ? (
            <svg className="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          )}
        </button>
        <span className="w-8 text-center font-medium">{item.quantity}</span>
        <button
          onClick={() => onUpdate(item.quantity + 1)}
          className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
