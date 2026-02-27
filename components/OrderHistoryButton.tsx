"use client";

import { useState, useEffect, useRef } from "react";
import { Order, getOrdersByCustomer, getActiveOrders } from "@/lib/supabase";

interface OrderHistoryButtonProps {
  lineUserId: string | null;
}

export default function OrderHistoryButton({ lineUserId }: OrderHistoryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"queue" | "mine">("queue");
  const [queueOrders, setQueueOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-refresh when modal is open
  useEffect(() => {
    if (isOpen) {
      intervalRef.current = setInterval(() => {
        refreshData();
      }, 5000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen, lineUserId]);

  const refreshData = async () => {
    try {
      const queueData = await getActiveOrders();
      setQueueOrders(queueData);

      if (lineUserId) {
        const myData = await getOrdersByCustomer(lineUserId);
        setMyOrders(myData);
      }
    } catch (error) {
      console.error("Failed to refresh orders:", error);
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);
    setIsLoading(true);

    try {
      // Load queue orders
      const queueData = await getActiveOrders();
      setQueueOrders(queueData);

      // Load my orders if logged in
      if (lineUserId) {
        const myData = await getOrdersByCustomer(lineUserId);
        setMyOrders(myData);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="p-2 hover:bg-primary-dark rounded-full transition-colors"
        title="ประวัติการสั่ง"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 fade-in">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />

          {/* Modal */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">ประวัติการสั่ง</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("queue")}
                className={`flex-1 py-3 text-center font-medium transition-colors ${
                  activeTab === "queue"
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                คิวทั้งหมด ({queueOrders.length})
              </button>
              <button
                onClick={() => setActiveTab("mine")}
                className={`flex-1 py-3 text-center font-medium transition-colors ${
                  activeTab === "mine"
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                ออเดอร์ของฉัน ({myOrders.length})
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="spinner"></div>
                </div>
              ) : activeTab === "queue" ? (
                queueOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p>ไม่มีออเดอร์ในคิว</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {queueOrders.map((order, index) => {
                      const badge = getStatusBadge(order.status);
                      const isMyOrder = order.line_user_id === lineUserId;
                      return (
                        <div
                          key={order.id}
                          className={`card p-4 ${isMyOrder ? "ring-2 ring-primary bg-primary/5" : ""}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-900">{order.order_number}</p>
                                  {isMyOrder && (
                                    <span className="badge badge-primary text-xs">ของคุณ</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                              </div>
                            </div>
                            <span className={`badge ${badge.class}`}>{badge.text}</span>
                          </div>

                          {/* แสดงรายละเอียดเฉพาะออเดอร์ของตัวเอง */}
                          {isMyOrder && order.items && order.items.length > 0 && (
                            <div className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-100">
                              {order.items.map((item, idx) => (
                                <span key={item.id}>
                                  {item.menu_item_name} x{item.quantity}
                                  {idx < order.items!.length - 1 && ", "}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : myOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>ยังไม่มีประวัติการสั่ง</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myOrders.map((order) => {
                    const badge = getStatusBadge(order.status);
                    return (
                      <div key={order.id} className="card p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-900">{order.order_number}</p>
                            <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                          </div>
                          <span className={`badge ${badge.class}`}>{badge.text}</span>
                        </div>

                        {order.items && order.items.length > 0 && (
                          <div className="text-sm text-gray-600 mb-3">
                            {order.items.map((item, index) => (
                              <span key={item.id}>
                                {item.menu_item_name} x{item.quantity}
                                {index < order.items!.length - 1 && ", "}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <span className="text-sm text-gray-500">
                            {order.pickup_time && (
                              <>
                                รับเวลา{" "}
                                {new Date(order.pickup_time).toLocaleTimeString("th-TH", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </>
                            )}
                          </span>
                          <span className="font-semibold text-primary">
                            ฿{order.total_amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
