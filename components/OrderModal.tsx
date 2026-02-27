"use client";

import { useState } from "react";
import { CartItem } from "@/app/page";
import { createOrder } from "@/lib/supabase";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  lineUserId: string | null;
  customerName: string | null;
  total: number;
  minPickupTime: number;
  onOrderSuccess: () => void;
}

export default function OrderModal({
  isOpen,
  onClose,
  cart,
  lineUserId,
  customerName: initialCustomerName,
  total,
  minPickupTime,
  onOrderSuccess,
}: OrderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState(initialCustomerName || "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [pickupTime, setPickupTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minPickupTime);
    return now.toTimeString().slice(0, 5);
  });
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsSubmitting(true);

    try {
      // Create pickup datetime
      const pickupDateTime = new Date();
      const [hours, minutes] = pickupTime.split(":").map(Number);
      pickupDateTime.setHours(hours, minutes, 0, 0);

      // If pickup time is earlier than now, assume tomorrow
      if (pickupDateTime < new Date()) {
        pickupDateTime.setDate(pickupDateTime.getDate() + 1);
      }

      const order = await createOrder(
        {
          line_user_id: lineUserId,
          customer_name: customerName,
          customer_phone: customerPhone,
          total_amount: total,
          pickup_time: pickupDateTime.toISOString(),
          notes: notes || null,
        },
        cart.map((item) => ({
          menu_item_id: item.menuItem.id,
          menu_item_name: item.menuItem.name,
          quantity: item.quantity,
          unit_price: item.menuItem.price + (item.optionsPrice || 0),
          total_price: (item.menuItem.price + (item.optionsPrice || 0)) * item.quantity,
          options: item.selectedOptions || {},
          notes: item.notes || null,
        }))
      );

      if (order) {
        setOrderSuccess({ orderNumber: order.order_number });
      }
    } catch (error) {
      console.error("Failed to create order:", error);
      alert("ไม่สามารถสั่งอาหารได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (orderSuccess) {
      onOrderSuccess();
      setOrderSuccess(null);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] flex flex-col slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            {orderSuccess ? "สั่งอาหารสำเร็จ" : "ยืนยันการสั่งอาหาร"}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {orderSuccess ? (
          /* Success View */
          <div className="flex-1 px-4 py-8 text-center">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">สั่งอาหารเรียบร้อย!</h3>
            <p className="text-gray-500 mb-6">หมายเลขออเดอร์ของคุณคือ</p>
            <div className="bg-primary/10 text-primary text-2xl font-bold py-4 px-6 rounded-xl mb-6">
              {orderSuccess.orderNumber}
            </div>
            <p className="text-sm text-gray-500">
              กรุณามารับอาหารตามเวลาที่กำหนด<br />
              ขอบคุณที่ใช้บริการ
            </p>
            <button
              onClick={handleClose}
              className="mt-8 w-full btn btn-primary py-4"
            >
              กลับหน้าหลัก
            </button>
          </div>
        ) : (
          /* Order Form */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="px-4 py-4 space-y-4">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-medium text-gray-900 mb-3">รายการอาหาร</h3>
                <div className="space-y-2">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.menuItem.name} x{item.quantity}
                      </span>
                      <span className="text-gray-900">
                        ฿{(item.menuItem.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-semibold">
                  <span>รวมทั้งหมด</span>
                  <span className="text-primary">฿{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อผู้รับ <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="input"
                    placeholder="ชื่อของคุณ"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เบอร์โทรศัพท์ <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="input"
                    placeholder="0xx-xxx-xxxx"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เวลารับอาหาร <span className="text-danger">*</span>
                  </label>
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="input"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    * เวลาเตรียมอาหารขั้นต่ำ {minPickupTime} นาที
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หมายเหตุเพิ่มเติม
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input"
                    placeholder="เช่น ไม่ใส่ผักชี, เผ็ดน้อย"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="px-4 py-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner"></div>
                    กำลังสั่งอาหาร...
                  </span>
                ) : (
                  `ยืนยันสั่งอาหาร ฿${total.toLocaleString()}`
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
