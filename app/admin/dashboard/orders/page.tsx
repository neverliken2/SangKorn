"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getOrders, updateOrderStatus, getCategories, Order, Category } from "@/lib/supabase";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pendingStatus, setPendingStatus] = useState<Order["status"] | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousOrderIds = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play notification sound using Web Audio API
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const audioContext = audioContextRef.current;
      
      // Create oscillator for beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Two-tone notification sound
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      oscillator.frequency.setValueAtTime(1108, audioContext.currentTime + 0.1); // C#6
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2); // A5
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (error) {
      console.error("Failed to play notification sound:", error);
    }
  }, [soundEnabled]);

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 5 seconds for real-time updates
    const interval = setInterval(() => {
      refreshOrders();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const refreshOrders = async () => {
    try {
      const data = await getOrders();
      
      // Check for new orders
      const newOrders = data.filter(order => !previousOrderIds.current.has(order.id));
      
      // Only play sound if this isn't the initial load and there are new pending orders
      if (previousOrderIds.current.size > 0 && newOrders.some(o => o.status === 'pending')) {
        playNotificationSound();
      }
      
      // Update previous order IDs
      previousOrderIds.current = new Set(data.map(o => o.id));
      
      setOrders(data);
    } catch (error) {
      console.error("Failed to refresh orders:", error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ordersData, categoriesData] = await Promise.all([
        getOrders(),
        getCategories(false),
      ]);
      setOrders(ordersData);
      setCategories(categoriesData);
      // Initialize previous order IDs on first load
      previousOrderIds.current = new Set(ordersData.map(o => o.id));
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order["status"]) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    }
  };

  const getStatusBadge = (status: Order["status"]) => {
    const badges = {
      pending: { class: "badge-pending", text: "อยู่ในคิว" },
      ready: { class: "badge-ready", text: "พร้อมรับ" },
      completed: { class: "badge-completed", text: "เสร็จสิ้น" },
      cancelled: { class: "badge-cancelled", text: "ยกเลิก" },
    };
    return badges[status];
  };

  const filteredOrders = orders.filter((order) => {
    // Filter by status
    if (selectedStatus !== "all" && order.status !== selectedStatus) {
      return false;
    }
    // Filter by category (check if any item in order belongs to selected category)
    if (selectedCategory !== "all") {
      const hasItemInCategory = order.items?.some(
        (item) => item.menu_item_category_id === selectedCategory
      );
      if (!hasItemInCategory) {
        return false;
      }
    }
    return true;
  });

  const statusOptions = [
    { value: "all", label: "ทั้งหมด" },
    { value: "pending", label: "อยู่ในคิว" },
    { value: "ready", label: "พร้อมรับ" },
    { value: "completed", label: "เสร็จสิ้น" },
    { value: "cancelled", label: "ยกเลิก" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">จัดการออเดอร์</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled 
                ? 'bg-green-100 border-green-300 text-green-700' 
                : 'bg-gray-100 border-gray-300 text-gray-500'
            }`}
            title={soundEnabled ? 'ปิดเสียงแจ้งเตือน' : 'เปิดเสียงแจ้งเตือน'}
          >
            {soundEnabled ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>
          <button
            onClick={loadOrders}
            className="btn btn-outline flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">สถานะ</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedStatus(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedStatus === option.value
                  ? "bg-primary text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">หมวดสินค้า</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === "all"
                ? "bg-secondary text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            ทั้งหมด
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? "bg-secondary text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="spinner"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>ไม่มีออเดอร์</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            return (
              <div
                key={order.id}
                className="card p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900">{order.order_number}</span>
                      <span className={`badge ${badge.class}`}>{badge.text}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {order.customer_name} • {order.customer_phone}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.items?.map((item) => `${item.menu_item_name} x${item.quantity}`).join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      ฿{Number(order.total_amount).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString("th-TH", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {order.pickup_time && (
                      <p className="text-sm text-secondary">
                        รับเวลา{" "}
                        {new Date(order.pickup_time).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 fade-in">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setSelectedOrder(null);
              setPendingStatus(null);
            }}
          />
          <div className="absolute inset-4 lg:inset-y-8 lg:inset-x-1/4 bg-white rounded-2xl overflow-hidden flex flex-col slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold">{selectedOrder.order_number}</h2>
                <p className="text-sm text-gray-500">
                  {new Date(selectedOrder.created_at).toLocaleString("th-TH")}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setPendingStatus(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">ข้อมูลลูกค้า</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><span className="text-gray-500">ชื่อ:</span> {selectedOrder.customer_name}</p>
                  <p><span className="text-gray-500">เบอร์โทร:</span> {selectedOrder.customer_phone}</p>
                  {selectedOrder.pickup_time && (
                    <p>
                      <span className="text-gray-500">เวลารับ:</span>{" "}
                      {new Date(selectedOrder.pickup_time).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                  {selectedOrder.notes && (
                    <p><span className="text-gray-500">หมายเหตุ:</span> {selectedOrder.notes}</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">รายการอาหาร</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-900">{item.menu_item_name}</p>
                        <p className="text-sm text-gray-500">x{item.quantity}</p>
                      </div>
                      <p className="font-medium">฿{Number(item.total_price).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between font-semibold text-lg">
                  <span>รวมทั้งหมด</span>
                  <span className="text-primary">฿{Number(selectedOrder.total_amount).toLocaleString()}</span>
                </div>
              </div>

              {/* Status Update */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">อัพเดทสถานะ</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(["pending", "ready", "completed", "cancelled"] as Order["status"][]).map(
                    (status) => {
                      const badge = getStatusBadge(status);
                      const currentStatus = pendingStatus ?? selectedOrder.status;
                      const isActive = currentStatus === status;
                      return (
                        <button
                          key={status}
                          onClick={() => setPendingStatus(status)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            isActive
                              ? "ring-2 ring-primary ring-offset-2"
                              : ""
                          } ${badge.class.replace("badge-", "bg-").replace("-", "-100 text-")}`}
                          style={{
                            backgroundColor: isActive ? undefined : undefined,
                          }}
                        >
                          {badge.text}
                        </button>
                      );
                    }
                  )}
                </div>
                {/* Save Button */}
                {pendingStatus && pendingStatus !== selectedOrder.status && (
                  <button
                    onClick={async () => {
                      await handleStatusUpdate(selectedOrder.id, pendingStatus);
                      setPendingStatus(null);
                    }}
                    className="w-full mt-4 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
                    style={{
                      backgroundColor: 
                        pendingStatus === "pending" ? "#EAB308" :
                        pendingStatus === "ready" ? "#22C55E" :
                        pendingStatus === "completed" ? "#3B82F6" :
                        "#EF4444"
                    }}
                  >
                    {pendingStatus === "pending" ? "บันทึก - อยู่ในคิว" :
                     pendingStatus === "ready" ? "บันทึก - พร้อมรับ" :
                     pendingStatus === "completed" ? "บันทึก - เสร็จสิ้น" :
                     "บันทึก - ยกเลิก"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
