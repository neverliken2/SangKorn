"use client";

interface CartButtonProps {
  itemCount: number;
  total: number;
  onClick: () => void;
}

export default function CartButton({ itemCount, total, onClick }: CartButtonProps) {
  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 slide-up z-50">
      <button
        onClick={onClick}
        className="w-full btn btn-primary flex items-center justify-between py-4"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="absolute -top-2 -right-2 bg-white text-primary text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          </div>
          <span className="font-medium">ดูตะกร้า</span>
        </div>
        <span className="font-semibold">฿{total.toLocaleString()}</span>
      </button>
    </div>
  );
}
