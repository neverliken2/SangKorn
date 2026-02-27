# Food Ordering System - Database Structure

> ⚠️ **สำคัญ**: ห้ามแก้ไขโครงสร้างนี้โดยไม่ได้รับอนุญาตจากผู้ใช้ก่อน

---

## Tables Overview

| ตาราง | คำอธิบาย |
|-------|---------|
| shop_settings | ข้อมูลร้านค้า |
| admins | ผู้ดูแลระบบ |
| categories | หมวดหมู่อาหาร || category_options | ตัวเลือกประจำหมวดหมู่ || menu_items | รายการอาหาร |
| orders | ออเดอร์ |
| order_items | รายการอาหารในออเดอร์ |

---

## 1. shop_settings (ข้อมูลร้านค้า)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| shop_name | VARCHAR(200) | ชื่อร้าน |
| shop_description | TEXT | คำอธิบายร้าน |
| logo_url | TEXT | URL รูปโลโก้ |
| cover_image_url | TEXT | URL รูปปก |
| phone | VARCHAR(50) | เบอร์โทร |
| address | TEXT | ที่อยู่ |
| opening_hours | JSONB | เวลาเปิด-ปิด แต่ละวัน |
| is_open | BOOLEAN | สถานะเปิด/ปิดร้าน |
| min_pickup_time | INTEGER | เวลาขั้นต่ำในการรับ (นาที) |
| created_at | TIMESTAMP | วันที่สร้าง |
| updated_at | TIMESTAMP | วันที่อัปเดต |

---

## 2. admins (ผู้ดูแลระบบ)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| email | VARCHAR(255) | อีเมล (Unique) |
| password_hash | VARCHAR(255) | รหัสผ่านเข้ารหัส SHA-256 |
| name | VARCHAR(100) | ชื่อ |
| role | VARCHAR(20) | `admin` หรือ `super_admin` |
| is_active | BOOLEAN | สถานะใช้งาน |
| last_login | TIMESTAMP | เข้าสู่ระบบล่าสุด |
| created_at | TIMESTAMP | วันที่สร้าง |
| updated_at | TIMESTAMP | วันที่อัปเดต |

---

## 3. categories (หมวดหมู่อาหาร)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| name | VARCHAR(100) | ชื่อหมวดหมู่ |
| description | TEXT | คำอธิบาย |
| sort_order | INTEGER | ลำดับการแสดงผล |
| is_active | BOOLEAN | สถานะใช้งาน |
| created_at | TIMESTAMP | วันที่สร้าง |
| updated_at | TIMESTAMP | วันที่อัปเดต |

---

## 4. category_options (ตัวเลือกประจำหมวดหมู่)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| category_id | UUID | FK → categories (CASCADE DELETE) |
| name | VARCHAR(100) | ชื่อ option group (เช่น "ความหวาน", "ประเภทการคั่ว") |
| choices | JSONB | ตัวเลือก (ดู format ด้านล่าง) |
| is_required | BOOLEAN | บังคับเลือกหรือไม่ |
| allow_multiple | BOOLEAN | เลือกได้หลายอย่างหรือไม่ |
| sort_order | INTEGER | ลำดับการแสดงผล |
| is_active | BOOLEAN | สถานะใช้งาน |
| created_at | TIMESTAMP | วันที่สร้าง |
| updated_at | TIMESTAMP | วันที่อัปเดต |

**choices format:**
```json
[
  { "label": "ปกติ", "price": 0 },
  { "label": "หวานน้อย", "price": 0 },
  { "label": "หวานมาก", "price": 5 }
]
```

---

## 5. menu_items (รายการอาหาร)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| category_id | UUID | FK → categories |
| name | VARCHAR(200) | ชื่อเมนู |
| description | TEXT | คำอธิบาย |
| price | DECIMAL(10,2) | ราคา |
| is_available | BOOLEAN | พร้อมขาย |
| is_recommended | BOOLEAN | เมนูแนะนำ |
| preparation_time | INTEGER | เวลาเตรียม (นาที) |
| sort_order | INTEGER | ลำดับการแสดงผล |
| options | JSONB | ตัวเลือกเพิ่มเติม |
| created_at | TIMESTAMP | วันที่สร้าง |
| updated_at | TIMESTAMP | วันที่อัปเดต |

**options format:**
```json
[
  {
    "name": "ระดับความเผ็ด",
    "choices": [
      { "label": "ไม่เผ็ด", "price": 0 },
      { "label": "เผ็ดน้อย", "price": 0 },
      { "label": "เผ็ดมาก", "price": 0 }
    ]
  }
]
```

---

## 6. orders (ออเดอร์)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| order_number | VARCHAR(20) | เลขออเดอร์ (Auto: ORD-YYYYMMDD-XXX) |
| line_user_id | VARCHAR(100) | LINE User ID |
| customer_name | VARCHAR(200) | ชื่อลูกค้า |
| customer_phone | VARCHAR(50) | เบอร์โทร |
| status | VARCHAR(20) | สถานะ (ดูด้านล่าง) |
| total_amount | DECIMAL(10,2) | ยอดรวม |
| pickup_time | TIMESTAMP | เวลารับอาหาร |
| notes | TEXT | หมายเหตุ |
| cancelled_reason | TEXT | เหตุผลยกเลิก |
| created_at | TIMESTAMP | วันที่สร้าง |
| updated_at | TIMESTAMP | วันที่อัปเดต |

**Order Status:**
- `pending` - อยู่ในคิว
- `ready` - พร้อมรับ
- `completed` - เสร็จสิ้น
- `cancelled` - ยกเลิก

---

## 7. order_items (รายการอาหารในออเดอร์)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| order_id | UUID | FK → orders (CASCADE DELETE) |
| menu_item_id | UUID | FK → menu_items |
| menu_item_name | VARCHAR(200) | ชื่อเมนู (เก็บไว้กรณีเมนูถูกลบ) |
| quantity | INTEGER | จำนวน |
| unit_price | DECIMAL(10,2) | ราคาต่อหน่วย |
| total_price | DECIMAL(10,2) | ราคารวม |
| options | JSONB | ตัวเลือกที่ลูกค้าเลือก |
| notes | TEXT | หมายเหตุ |
| created_at | TIMESTAMP | วันที่สร้าง |

---

## Storage Buckets

| Bucket | Usage |
|--------|-------|
| shop-images | รูป logo และ cover ของร้าน |

---

## Relations Diagram

```
shop_settings (standalone)

admins (standalone)

categories ─┬─< category_options
            │
            └─< menu_items

orders ──────< order_items ──> menu_items
```

---

## Indexes

- `idx_admins_email` - admins(email)
- `idx_categories_is_active` - categories(is_active)
- `idx_categories_sort_order` - categories(sort_order)
- `idx_menu_items_category_id` - menu_items(category_id)
- `idx_menu_items_is_available` - menu_items(is_available)
- `idx_menu_items_is_recommended` - menu_items(is_recommended)
- `idx_orders_status` - orders(status)
- `idx_orders_line_user_id` - orders(line_user_id)
- `idx_orders_created_at` - orders(created_at)
- `idx_orders_order_number` - orders(order_number)
- `idx_order_items_order_id` - order_items(order_id)
- `idx_order_items_menu_item_id` - order_items(menu_item_id)

---

## Triggers

1. **generate_order_number_trigger** - สร้างเลขออเดอร์อัตโนมัติ (ORD-YYYYMMDD-XXX)
2. **update_*_updated_at** - อัปเดต updated_at อัตโนมัติเมื่อแก้ไขข้อมูล

---

## Row Level Security

- ทุกตารางเปิดใช้ RLS
- shop_settings, categories, menu_items - public read
- orders, order_items - public insert/read/update

---

*Last updated: February 2026*
