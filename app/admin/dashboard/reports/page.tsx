"use client";

import { useEffect, useState, useMemo } from "react";
import {
  getCategories,
  getAllMenuItems,
  getSalesReportOrders,
  calculateSalesByCategory,
  calculateSalesByMenuItem,
  calculateDailySales,
  Category,
  MenuItem,
  SalesReportFilters,
  SalesReportOrder,
  SalesByCategory,
  SalesByMenuItem,
  DailySales,
} from "@/lib/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Chart colors
const CHART_COLORS = [
  "#8B5CF6", // primary (purple)
  "#4ECDC4", // secondary (teal)
  "#F39C12", // warning
  "#2ECC71", // success
  "#E74C3C", // danger
  "#3498DB", // blue
  "#9B59B6", // violet
  "#1ABC9C", // turquoise
  "#E67E22", // orange
  "#34495E", // dark gray
];

export default function ReportsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<SalesReportOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>("all");
  const [menuSearchQuery, setMenuSearchQuery] = useState<string>("");

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Reload orders when date changes
  useEffect(() => {
    if (categories.length > 0) {
      loadOrders();
    }
  }, [startDate, endDate]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [categoriesData, menuItemsData] = await Promise.all([
        getCategories(false),
        getAllMenuItems(),
      ]);
      setCategories(categoriesData);
      setMenuItems(menuItemsData);

      // Load orders
      const ordersData = await getSalesReportOrders({
        startDate,
        endDate,
      });
      setOrders(ordersData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const ordersData = await getSalesReportOrders({
        startDate,
        endDate,
      });
      setOrders(ordersData);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Current filters
  const filters: SalesReportFilters = useMemo(
    () => ({
      startDate,
      endDate,
      categoryId: selectedCategory !== "all" ? selectedCategory : undefined,
      menuItemId: selectedMenuItem !== "all" ? selectedMenuItem : undefined,
    }),
    [startDate, endDate, selectedCategory, selectedMenuItem]
  );

  // Calculate report data
  const salesByCategory: SalesByCategory[] = useMemo(
    () => calculateSalesByCategory(orders, categories, filters),
    [orders, categories, filters]
  );

  const salesByMenuItem: SalesByMenuItem[] = useMemo(
    () => calculateSalesByMenuItem(orders, categories, filters),
    [orders, categories, filters]
  );

  const dailySales: DailySales[] = useMemo(
    () => calculateDailySales(orders, filters),
    [orders, filters]
  );

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalRevenue = salesByMenuItem.reduce((sum, item) => sum + item.totalSales, 0);
    const totalQuantity = salesByMenuItem.reduce((sum, item) => sum + item.totalQuantity, 0);
    const orderCount = dailySales.reduce((sum, day) => sum + day.orderCount, 0);
    const avgPerOrder = orderCount > 0 ? totalRevenue / orderCount : 0;
    const topItem = salesByMenuItem[0] || null;

    return {
      totalRevenue,
      totalQuantity,
      orderCount,
      avgPerOrder,
      topItem,
    };
  }, [salesByMenuItem, dailySales]);

  // Filter menu items by search query
  const filteredMenuItems = useMemo(() => {
    if (!menuSearchQuery) return menuItems;
    const query = menuSearchQuery.toLowerCase();
    return menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query)
    );
  }, [menuItems, menuSearchQuery]);

  // Export CSV
  const exportCSV = () => {
    const headers = ["รหัสสินค้า", "ชื่อสินค้า", "หมวดหมู่", "จำนวนขาย", "ยอดขาย (บาท)"];
    const rows = salesByMenuItem.map((item) => [
      item.menuItemId,
      item.menuItemName,
      item.categoryName,
      item.totalQuantity,
      item.totalSales.toFixed(2),
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `sales-report-${startDate}-to-${endDate}.csv`;
    link.click();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date for chart
  const formatChartDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">รายงานยอดขาย</h1>
        <button
          onClick={exportCSV}
          className="btn btn-outline flex items-center gap-2"
          disabled={salesByMenuItem.length === 0}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Date Filter */}
      <div className="card p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">ช่วงวันที่</p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input"
          />
          <span className="text-gray-500">ถึง</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input"
          />
          <button onClick={loadOrders} className="btn btn-primary">
            ค้นหา
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">หมวดหมู่</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => {
              setSelectedCategory("all");
              setSelectedMenuItem("all");
            }}
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
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedMenuItem("all");
              }}
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

      {/* Menu Item Filter */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">สินค้า</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              value={menuSearchQuery}
              onChange={(e) => setMenuSearchQuery(e.target.value)}
              className="input pr-8"
            />
            {menuSearchQuery && (
              <button
                onClick={() => setMenuSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <select
            value={selectedMenuItem}
            onChange={(e) => setSelectedMenuItem(e.target.value)}
            className="input"
          >
            <option value="all">-- เลือกสินค้า --</option>
            {filteredMenuItems
              .filter((item) => selectedCategory === "all" || item.category_id === selectedCategory)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
          {selectedMenuItem !== "all" && (
            <button
              onClick={() => setSelectedMenuItem("all")}
              className="text-sm text-secondary hover:underline"
            >
              ล้างการเลือก
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ยอดขายรวม</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(summaryStats.totalRevenue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">จำนวนออเดอร์</p>
                  <p className="text-xl font-bold text-gray-900">{summaryStats.orderCount}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">เฉลี่ย/ออเดอร์</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(summaryStats.avgPerOrder)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ขายดีสุด</p>
                  <p className="text-xl font-bold text-gray-900 truncate max-w-[150px]">
                    {summaryStats.topItem?.menuItemName || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Daily Sales Chart */}
            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 mb-4">ยอดขายรายวัน</h3>
              {dailySales.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  ไม่มีข้อมูล
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailySales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatChartDate}
                      tick={{ fontSize: 12 }}
                      stroke="#9CA3AF"
                    />
                    <YAxis
                      tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 12 }}
                      stroke="#9CA3AF"
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), "ยอดขาย"]}
                      labelFormatter={(label) => formatChartDate(String(label))}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="totalSales" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Category Pie Chart */}
            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 mb-4">สัดส่วนตามหมวดหมู่</h3>
              {salesByCategory.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  ไม่มีข้อมูล
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={salesByCategory}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                      dataKey="totalSales"
                      nameKey="categoryName"
                      label={({ name, percent }) =>
                        `${name} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {salesByCategory.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), "ยอดขาย"]}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Menu Item Sales Table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">รายละเอียดสินค้า</h3>
              <p className="text-sm text-gray-500 mt-1">
                แสดง {salesByMenuItem.length} รายการ
              </p>
            </div>
            {salesByMenuItem.length === 0 ? (
              <div className="p-8 text-center text-gray-500">ไม่มีข้อมูล</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">#</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        ชื่อสินค้า
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        หมวดหมู่
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                        จำนวนขาย
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                        ยอดขาย
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {salesByMenuItem.map((item, index) => (
                      <tr key={item.menuItemId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">{item.menuItemName}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.categoryName}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {item.totalQuantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-primary">
                          {formatCurrency(item.totalSales)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan={3} className="px-4 py-3 text-sm text-gray-900">
                        รวมทั้งหมด
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {summaryStats.totalQuantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-primary">
                        {formatCurrency(summaryStats.totalRevenue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
