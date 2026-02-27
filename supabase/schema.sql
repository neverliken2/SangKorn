-- =============================================
-- Food Ordering System Database Schema
-- =============================================

-- =============================================
-- 1. Shop Settings (ข้อมูลร้านค้า)
-- =============================================
CREATE TABLE IF NOT EXISTS shop_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_name VARCHAR(200) NOT NULL,
  shop_description TEXT,
  logo_url TEXT, -- เก็บ URL จาก Supabase Storage
  cover_image_url TEXT,
  phone VARCHAR(50),
  address TEXT,
  opening_hours JSONB DEFAULT '{"monday": {"open": "09:00", "close": "21:00"}, "tuesday": {"open": "09:00", "close": "21:00"}, "wednesday": {"open": "09:00", "close": "21:00"}, "thursday": {"open": "09:00", "close": "21:00"}, "friday": {"open": "09:00", "close": "21:00"}, "saturday": {"open": "09:00", "close": "21:00"}, "sunday": {"open": "09:00", "close": "21:00"}}',
  is_open BOOLEAN DEFAULT true,
  min_pickup_time INTEGER DEFAULT 15, -- นาที
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default shop settings
INSERT INTO shop_settings (shop_name, shop_description) 
VALUES ('ร้านอาหารของฉัน', 'ยินดีต้อนรับ')
ON CONFLICT DO NOTHING;

-- =============================================
-- 2. Admin Users (ผู้ดูแลระบบ)
-- =============================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for admin lookup
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- =============================================
-- 3. Categories (หมวดหมู่อาหาร)
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for category queries
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- =============================================
-- 4. Category Options (ตัวเลือกประจำหมวดหมู่)
-- =============================================
CREATE TABLE IF NOT EXISTS category_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- ชื่อ option group เช่น "ความหวาน", "ประเภทการคั่ว"
  choices JSONB NOT NULL DEFAULT '[]', -- [{"label": "ปกติ", "price": 0}, {"label": "น้อย", "price": 0}]
  is_required BOOLEAN DEFAULT false, -- บังคับเลือกหรือไม่
  allow_multiple BOOLEAN DEFAULT false, -- เลือกได้หลายอันไหม
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for category options
CREATE INDEX IF NOT EXISTS idx_category_options_category_id ON category_options(category_id);
CREATE INDEX IF NOT EXISTS idx_category_options_is_active ON category_options(is_active);

-- =============================================
-- 5. Menu Items (รายการอาหาร)
-- =============================================
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  is_recommended BOOLEAN DEFAULT false,
  preparation_time INTEGER DEFAULT 15, -- นาที
  sort_order INTEGER DEFAULT 0,
  options JSONB DEFAULT '[]', -- ตัวเลือกเพิ่มเติม เช่น ระดับความเผ็ด
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for menu queries
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_recommended ON menu_items(is_recommended);

-- =============================================
-- 6. Orders (ออเดอร์)
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  line_user_id VARCHAR(100),
  customer_name VARCHAR(200),
  customer_phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'completed', 'cancelled')),
  total_amount DECIMAL(10, 2) NOT NULL,
  pickup_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  cancelled_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for order queries
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_line_user_id ON orders(line_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- =============================================
-- 7. Order Items (รายการอาหารในออเดอร์)
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  menu_item_name VARCHAR(200) NOT NULL, -- เก็บชื่อไว้กรณีเมนูถูกลบ
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  options JSONB DEFAULT '{}', -- ตัวเลือกที่ลูกค้าเลือก
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for order item queries
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);

-- =============================================
-- Functions
-- =============================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  date_prefix VARCHAR(20);
  sequence_num INTEGER;
  new_order_number VARCHAR(20);
BEGIN
  -- Format: ORD-YYYYMMDD-XXX
  date_prefix := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD');

  -- Get the next sequence number for today
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM orders
  WHERE order_number LIKE date_prefix || '%';

  -- Generate order number
  new_order_number := date_prefix || '-' || LPAD(sequence_num::TEXT, 3, '0');

  NEW.order_number := new_order_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-generate order number
DROP TRIGGER IF EXISTS generate_order_number_trigger ON orders;
CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION generate_order_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-update updated_at
DROP TRIGGER IF EXISTS update_shop_settings_updated_at ON shop_settings;
CREATE TRIGGER update_shop_settings_updated_at
  BEFORE UPDATE ON shop_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Row Level Security
-- =============================================

ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public read access for shop_settings, categories, menu_items
CREATE POLICY "Allow public read shop_settings" ON shop_settings FOR SELECT USING (true);
CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public read menu_items" ON menu_items FOR SELECT USING (true);

-- Public access for orders
CREATE POLICY "Allow public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public update orders" ON orders FOR UPDATE USING (true);

-- Public access for order_items
CREATE POLICY "Allow public insert order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read order_items" ON order_items FOR SELECT USING (true);

-- Admin policies (full access)
CREATE POLICY "Allow admin full access shop_settings" ON shop_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin full access categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin full access menu_items" ON menu_items FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- Supabase Storage Setup (run in Supabase dashboard)
-- =============================================
-- Create buckets:
-- 1. shop-images (for shop logo and cover)
-- 2. menu-images (for category and menu item images)
--
-- Set public access for both buckets to allow image viewing

-- Example storage policies (run in Supabase SQL Editor):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('shop-images', 'shop-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true);
