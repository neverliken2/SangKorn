"use client";

import { useEffect, useState } from "react";
import { getOrders, getMenuItems, getCategories, Order } from "@/lib/supabase";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    todayOrders: 0,
    pendingOrders: 0,
    totalMenuItems: 0,
    totalCategories: 0,
    todayRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [orders, menuItems, categories] = await Promise.all([
        getOrders(undefined, 100),
        getMenuItems(undefined, false),
        getCategories(false),
      ]);

      // Calculate stats
      const today = new Date().toDateString();
      const todayOrders = orders.filter(
        (o) => new Date(o.created_at).toDateString() === today
      );
      const pendingOrders = orders.filter((o) => o.status === "pending");
      const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

      setStats({
        todayOrders: todayOrders.length,
        pendingOrders: pendingOrders.length,
        totalMenuItems: menuItems.length,
        totalCategories: categories.length,
        todayRevenue,
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">ภาพรวม</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="ออเดอร์วันนี้"
          value={stats.todayOrders}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          color="primary"
        />
        <StatCard
          title="รอดำเนินการ"
          value={stats.pendingOrders}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="warning"
        />
        <StatCard
          title="รายได้วันนี้"
          value={`฿${stats.todayRevenue.toLocaleString()}`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="success"
        />
        <StatCard
          title="เมนูทั้งหมด"
          value={stats.totalMenuItems}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
          color="secondary"
        />
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">ออเดอร์ล่าสุด</h2>
          <a href="/admin/dashboard/orders" className="text-sm text-primary hover:underline">
            ดูทั้งหมด →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  หมายเลข
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ลูกค้า
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ยอดรวม
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  เวลา
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    ยังไม่มีออเดอร์
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">{order.order_number}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {order.customer_name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                        ฿{Number(order.total_amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${badge.class}`}>{badge.text}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                        {new Date(order.created_at).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: "primary" | "secondary" | "success" | "warning" | "danger";
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
  };

  return (
    <div className="card p-4">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
