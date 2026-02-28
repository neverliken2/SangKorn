import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IS_MOCK_MODE, mockShopSettings, mockCategories, mockMenuItems, mockOrders, mockAdmin } from './mock';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Only create real client if not in mock mode
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Log mock mode status
if (typeof window !== 'undefined' && IS_MOCK_MODE) {
  console.log('🔧 Running in MOCK MODE - Using mock data');
}

// Types
export interface ShopSettings {
  id: string;
  shop_name: string;
  shop_description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  phone: string | null;
  address: string | null;
  opening_hours: Record<string, { open: string; close: string }>;
  is_open: boolean;
  min_pickup_time: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  options?: CategoryOption[];
}

export interface CategoryOptionChoice {
  label: string;
  price: number;
}

export interface CategoryOption {
  id: string;
  category_id: string;
  name: string;
  choices: CategoryOptionChoice[];
  is_required: boolean;
  allow_multiple: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  is_recommended: boolean;
  preparation_time: number;
  sort_order: number;
  options: MenuItemOption[];
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface MenuItemOption {
  name: string;
  choices: { label: string; price: number }[];
}

export interface Order {
  id: string;
  order_number: string;
  line_user_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  status: 'pending' | 'ready' | 'completed' | 'cancelled';
  total_amount: number;
  pickup_time: string | null;
  notes: string | null;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  menu_item_name: string;
  menu_item_category_id?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  options: Record<string, string | string[]>;
  notes: string | null;
  created_at: string;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

// Shop Settings Functions
export const getShopSettings = async (): Promise<ShopSettings | null> => {
  if (IS_MOCK_MODE) return mockShopSettings as ShopSettings;

  const { data, error } = await supabase
    .from('shop_settings')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching shop settings:', error);
    return null;
  }
  return data;
};

export const updateShopSettings = async (id: string, settings: Partial<ShopSettings>): Promise<ShopSettings | null> => {
  const { data, error } = await supabase
    .from('shop_settings')
    .update(settings)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating shop settings:', error);
    return null;
  }
  return data;
};

// Category Functions
export const getCategories = async (activeOnly = true): Promise<Category[]> => {
  if (IS_MOCK_MODE) {
    return activeOnly ? mockCategories.filter(c => c.is_active) as Category[] : mockCategories as Category[];
  }

  let query = supabase.from('categories').select('*').order('sort_order');
  
  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data || [];
};

export const createCategory = async (category: Partial<Category>): Promise<Category | null> => {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    return null;
  }
  return data;
};

export const updateCategory = async (id: string, category: Partial<Category>): Promise<Category | null> => {
  const { data, error } = await supabase
    .from('categories')
    .update(category)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating category:', error);
    return null;
  }
  return data;
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    return false;
  }
  return true;
};

// Category Option Functions
export const getCategoryOptions = async (categoryId: string, activeOnly = true): Promise<CategoryOption[]> => {
  if (IS_MOCK_MODE) {
    const { mockCategoryOptions } = await import('./mock');
    let options = mockCategoryOptions.filter(o => o.category_id === categoryId);
    if (activeOnly) options = options.filter(o => o.is_active);
    return options as CategoryOption[];
  }

  let query = supabase
    .from('category_options')
    .select('*')
    .eq('category_id', categoryId)
    .order('sort_order');
  
  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching category options:', error);
    return [];
  }
  return data || [];
};

export const getAllCategoryOptions = async (activeOnly = true): Promise<CategoryOption[]> => {
  if (IS_MOCK_MODE) {
    const { mockCategoryOptions } = await import('./mock');
    return activeOnly ? mockCategoryOptions.filter(o => o.is_active) as CategoryOption[] : mockCategoryOptions as CategoryOption[];
  }

  let query = supabase
    .from('category_options')
    .select('*')
    .order('sort_order');
  
  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching all category options:', error);
    return [];
  }
  return data || [];
};

export const createCategoryOption = async (option: Partial<CategoryOption>): Promise<CategoryOption | null> => {
  const { data, error } = await supabase
    .from('category_options')
    .insert(option)
    .select()
    .single();

  if (error) {
    console.error('Error creating category option:', error);
    return null;
  }
  return data;
};

export const updateCategoryOption = async (id: string, option: Partial<CategoryOption>): Promise<CategoryOption | null> => {
  const { data, error } = await supabase
    .from('category_options')
    .update(option)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating category option:', error);
    return null;
  }
  return data;
};

export const deleteCategoryOption = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('category_options')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting category option:', error);
    return false;
  }
  return true;
};

// Menu Item Functions
export const getMenuItems = async (categoryId?: string, availableOnly = true): Promise<MenuItem[]> => {
  if (IS_MOCK_MODE) {
    let items = mockMenuItems as MenuItem[];
    if (categoryId) items = items.filter(i => i.category_id === categoryId);
    if (availableOnly) items = items.filter(i => i.is_available);
    return items;
  }

  let query = supabase
    .from('menu_items')
    .select('*, category:categories(*)')
    .order('sort_order');

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (availableOnly) {
    query = query.eq('is_available', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
  return data || [];
};

export const getRecommendedMenuItems = async (): Promise<MenuItem[]> => {
  if (IS_MOCK_MODE) {
    return mockMenuItems.filter(i => i.is_available && i.is_recommended) as MenuItem[];
  }

  const { data, error } = await supabase
    .from('menu_items')
    .select('*, category:categories(*)')
    .eq('is_available', true)
    .eq('is_recommended', true)
    .order('sort_order');

  if (error) {
    console.error('Error fetching recommended items:', error);
    return [];
  }
  return data || [];
};

export const createMenuItem = async (item: Partial<MenuItem>): Promise<MenuItem | null> => {
  const { data, error } = await supabase
    .from('menu_items')
    .insert(item)
    .select()
    .single();

  if (error) {
    console.error('Error creating menu item:', error);
    return null;
  }
  return data;
};

export const updateMenuItem = async (id: string, item: Partial<MenuItem>): Promise<MenuItem | null> => {
  const { data, error } = await supabase
    .from('menu_items')
    .update(item)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating menu item:', error);
    return null;
  }
  return data;
};

export const deleteMenuItem = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting menu item:', error);
    return false;
  }
  return true;
};

// Order Functions
export const createOrder = async (
  order: Partial<Order>,
  items: Partial<OrderItem>[]
): Promise<Order | null> => {
  // Create order
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    return null;
  }

  // Create order items
  const orderItems = items.map(item => ({
    ...item,
    order_id: orderData.id,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    // Still return the order even if items failed
  }

  return orderData;
};

export const getOrders = async (status?: string, limit = 50): Promise<Order[]> => {
  if (IS_MOCK_MODE) {
    let orders = [...mockOrders] as Order[];
    if (status) orders = orders.filter(o => o.status === status);
    return orders.slice(0, limit);
  }

  let query = supabase
    .from('orders')
    .select('*, items:order_items(*, menu_item:menu_items(category_id))')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  // Map category_id from nested menu_item to order item
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ordersWithCategory = (data || []).map((order: any) => ({
    ...order,
    items: order.items?.map((item: any) => ({
      ...item,
      menu_item_category_id: item.menu_item?.category_id || null,
      menu_item: undefined,
    })),
  }));

  return ordersWithCategory;
};

export const getOrdersByCustomer = async (lineUserId: string): Promise<Order[]> => {
  if (IS_MOCK_MODE) {
    return mockOrders.filter(o => o.line_user_id === lineUserId) as Order[];
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('line_user_id', lineUserId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching customer orders:', error);
    return [];
  }
  return data || [];
};

// Get active orders in queue (for customers to see queue)
export const getActiveOrders = async (): Promise<Order[]> => {
  if (IS_MOCK_MODE) {
    const activeStatuses = ['pending', 'ready'];
    return mockOrders.filter(o => activeStatuses.includes(o.status)) as Order[];
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .in('status', ['pending', 'ready'])
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching active orders:', error);
    return [];
  }
  return data || [];
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return null;
  }
  return data;
};

export const updateOrderStatus = async (orderId: string, status: Order['status'], cancelledReason?: string): Promise<Order | null> => {
  const updates: Partial<Order> = { status };
  if (cancelledReason) {
    updates.cancelled_reason = cancelledReason;
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating order status:', error);
    return null;
  }
  return data;
};

// Image Upload Functions
export const uploadImage = async (
  bucket: 'shop-images' | 'menu-images',
  file: File,
  path: string
): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });

  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};

export const deleteImage = async (bucket: 'shop-images' | 'menu-images', path: string): Promise<boolean> => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error('Error deleting image:', error);
    return false;
  }
  return true;
};

// Sales Report Types and Functions
export interface SalesReportFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  menuItemId?: string;
}

export interface SalesReportOrder extends Order {
  items: (OrderItem & { menu_item_category_id?: string | null })[];
}

export interface SalesByCategory {
  categoryId: string;
  categoryName: string;
  totalSales: number;
  totalQuantity: number;
}

export interface SalesByMenuItem {
  menuItemId: string;
  menuItemName: string;
  categoryId: string | null;
  categoryName: string;
  totalSales: number;
  totalQuantity: number;
}

export interface DailySales {
  date: string;
  totalSales: number;
  orderCount: number;
}

// Get completed orders for sales report with filters
export const getSalesReportOrders = async (filters: SalesReportFilters): Promise<SalesReportOrder[]> => {
  if (IS_MOCK_MODE) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orders = (mockOrders as any[]).filter(o => o.status === 'completed') as SalesReportOrder[];
    
    if (filters.startDate) {
      orders = orders.filter(o => new Date(o.created_at) >= new Date(filters.startDate!));
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      orders = orders.filter(o => new Date(o.created_at) <= endDate);
    }
    return orders;
  }

  let query = supabase
    .from('orders')
    .select('*, items:order_items(*, menu_item:menu_items(category_id))')
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters.endDate) {
    // Add time to include the full end date
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999);
    query = query.lte('created_at', endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching sales report orders:', error);
    return [];
  }

  // Map category_id from nested menu_item to order item
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ordersWithCategory = (data || []).map((order: any) => ({
    ...order,
    items: order.items?.map((item: any) => ({
      ...item,
      menu_item_category_id: item.menu_item?.category_id || null,
      menu_item: undefined,
    })),
  }));

  return ordersWithCategory;
};

// Calculate sales by category from orders
export const calculateSalesByCategory = (
  orders: SalesReportOrder[],
  categories: Category[],
  filters: SalesReportFilters
): SalesByCategory[] => {
  const categoryMap = new Map<string, { totalSales: number; totalQuantity: number }>();
  
  // Initialize all categories
  categories.forEach(cat => {
    categoryMap.set(cat.id, { totalSales: 0, totalQuantity: 0 });
  });

  // Aggregate sales
  orders.forEach(order => {
    order.items?.forEach(item => {
      const categoryId = item.menu_item_category_id;
      if (!categoryId) return;
      
      // Filter by category if specified
      if (filters.categoryId && filters.categoryId !== categoryId) return;
      
      // Filter by menu item if specified
      if (filters.menuItemId && item.menu_item_id !== filters.menuItemId) return;

      const existing = categoryMap.get(categoryId) || { totalSales: 0, totalQuantity: 0 };
      categoryMap.set(categoryId, {
        totalSales: existing.totalSales + Number(item.total_price),
        totalQuantity: existing.totalQuantity + item.quantity,
      });
    });
  });

  // Convert to array and add category names
  return Array.from(categoryMap.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: categories.find(c => c.id === categoryId)?.name || 'ไม่ระบุ',
      totalSales: data.totalSales,
      totalQuantity: data.totalQuantity,
    }))
    .filter(c => c.totalSales > 0)
    .sort((a, b) => b.totalSales - a.totalSales);
};

// Calculate sales by menu item from orders
export const calculateSalesByMenuItem = (
  orders: SalesReportOrder[],
  categories: Category[],
  filters: SalesReportFilters
): SalesByMenuItem[] => {
  const menuItemMap = new Map<string, {
    menuItemName: string;
    categoryId: string | null;
    totalSales: number;
    totalQuantity: number;
  }>();

  // Aggregate sales
  orders.forEach(order => {
    order.items?.forEach(item => {
      const categoryId = item.menu_item_category_id;
      
      // Filter by category if specified
      if (filters.categoryId && categoryId !== filters.categoryId) return;
      
      // Filter by menu item if specified
      if (filters.menuItemId && item.menu_item_id !== filters.menuItemId) return;

      const itemId = item.menu_item_id || item.menu_item_name;
      const existing = menuItemMap.get(itemId) || {
        menuItemName: item.menu_item_name,
        categoryId: categoryId ?? null,
        totalSales: 0,
        totalQuantity: 0,
      };
      
      menuItemMap.set(itemId, {
        menuItemName: existing.menuItemName,
        categoryId: existing.categoryId,
        totalSales: existing.totalSales + Number(item.total_price),
        totalQuantity: existing.totalQuantity + item.quantity,
      });
    });
  });

  // Convert to array and add category names
  return Array.from(menuItemMap.entries())
    .map(([menuItemId, data]) => ({
      menuItemId,
      menuItemName: data.menuItemName,
      categoryId: data.categoryId,
      categoryName: categories.find(c => c.id === data.categoryId)?.name || 'ไม่ระบุ',
      totalSales: data.totalSales,
      totalQuantity: data.totalQuantity,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);
};

// Calculate daily sales from orders
export const calculateDailySales = (
  orders: SalesReportOrder[],
  filters: SalesReportFilters
): DailySales[] => {
  const dailyMap = new Map<string, { totalSales: number; orderCount: number }>();

  orders.forEach(order => {
    // Check if order has items matching filters
    const hasMatchingItems = order.items?.some(item => {
      if (filters.categoryId && item.menu_item_category_id !== filters.categoryId) return false;
      if (filters.menuItemId && item.menu_item_id !== filters.menuItemId) return false;
      return true;
    });

    if (!hasMatchingItems && (filters.categoryId || filters.menuItemId)) return;

    const date = new Date(order.created_at).toISOString().split('T')[0];
    
    // Calculate filtered total for this order
    let orderTotal = 0;
    if (filters.categoryId || filters.menuItemId) {
      order.items?.forEach(item => {
        if (filters.categoryId && item.menu_item_category_id !== filters.categoryId) return;
        if (filters.menuItemId && item.menu_item_id !== filters.menuItemId) return;
        orderTotal += Number(item.total_price);
      });
    } else {
      orderTotal = Number(order.total_amount);
    }

    const existing = dailyMap.get(date) || { totalSales: 0, orderCount: 0 };
    dailyMap.set(date, {
      totalSales: existing.totalSales + orderTotal,
      orderCount: existing.orderCount + 1,
    });
  });

  // Convert to array and sort by date
  return Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      totalSales: data.totalSales,
      orderCount: data.orderCount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

// Get all menu items (for filter dropdown)
export const getAllMenuItems = async (): Promise<MenuItem[]> => {
  if (IS_MOCK_MODE) {
    return mockMenuItems as MenuItem[];
  }

  const { data, error } = await supabase
    .from('menu_items')
    .select('*, category:categories(name)')
    .order('name');

  if (error) {
    console.error('Error fetching all menu items:', error);
    return [];
  }
  return data || [];
};
