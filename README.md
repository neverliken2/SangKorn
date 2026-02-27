# ระบบสั่งอาหารล่วงหน้า (Food Ordering System)

ระบบสั่งอาหารออนไลน์ผ่าน LINE สำหรับร้านอาหาร ลูกค้าสามารถสั่งอาหารก่อนมารับได้

## Features

### สำหรับลูกค้า (LINE Login)
- ✅ ดูเมนูอาหารตามหมวดหมู่
- ✅ เพิ่มอาหารลงตะกร้า
- ✅ เลือกเวลารับอาหาร
- ✅ สั่งซื้อและดูสถานะออเดอร์
- ✅ ดูประวัติการสั่ง

### สำหรับ Admin (Email/Password Login)
- ✅ Dashboard ภาพรวมร้าน
- ✅ จัดการหมวดหมู่อาหาร (เพิ่ม/แก้ไข/ลบ)
- ✅ จัดการเมนูอาหาร (ชื่อ, ราคา, รูป, หมวดหมู่)
- ✅ ดูรายการออเดอร์และอัพเดทสถานะ
- ✅ ตั้งค่าร้าน (ชื่อ, โลโก้, ที่อยู่, เวลาทำการ)

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **Authentication:** LINE LIFF SDK (ลูกค้า), Custom Auth (Admin)
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (รูปภาพ)

## Getting Started

### 1. ติดตั้ง Dependencies

```bash
cd food-ordering-system
npm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` จาก `.env.example`:

```bash
cp .env.example .env.local
```

แก้ไขค่าตามข้อมูลของคุณ:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# LINE LIFF
NEXT_PUBLIC_LIFF_ID=your_liff_id
```

### 3. ตั้งค่า Supabase

1. สร้าง Project ใหม่ที่ [Supabase](https://supabase.com)
2. ไปที่ SQL Editor และรัน SQL ใน `supabase/schema.sql`
3. สร้าง Storage Buckets:
   - `shop-images` (public)
   - `menu-images` (public)

### 4. ตั้งค่า LINE LIFF

1. ไปที่ [LINE Developers Console](https://developers.line.biz)
2. สร้าง Provider และ Channel (LINE Login)
3. สร้าง LIFF App และคัดลอก LIFF ID

### 5. สร้าง Admin Account

รัน SQL ใน Supabase SQL Editor เพื่อสร้าง admin:

```sql
-- Password: admin123 (SHA-256 hash)
INSERT INTO admins (email, password_hash, name, role)
VALUES (
  'admin@example.com',
  '240be518fabd2724ddb6f04eeb9d5639b30d7647f6b7a9c3838f69e91dce5f46',
  'Admin',
  'super_admin'
);
```

> ⚠️ เปลี่ยน password หลังจาก login ครั้งแรก!

### 6. รัน Development Server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## Project Structure

```
food-ordering-system/
├── app/
│   ├── page.tsx              # หน้าลูกค้า (เมนู, ตะกร้า)
│   ├── layout.tsx
│   ├── globals.css
│   └── admin/
│       ├── page.tsx          # Admin Login
│       └── dashboard/
│           ├── page.tsx      # Dashboard
│           ├── orders/       # จัดการออเดอร์
│           ├── menu/         # จัดการเมนู
│           ├── categories/   # จัดการหมวดหมู่
│           └── settings/     # ตั้งค่าร้าน
├── components/
│   ├── MenuSection.tsx
│   ├── CartButton.tsx
│   ├── CartModal.tsx
│   ├── OrderModal.tsx
│   └── OrderHistoryButton.tsx
├── lib/
│   ├── liff.ts              # LINE LIFF utilities
│   ├── supabase.ts          # Supabase client & functions
│   └── auth.ts              # Admin authentication
├── supabase/
│   └── schema.sql           # Database schema
└── public/
```

## Database Schema

| Table | Description |
|-------|-------------|
| `shop_settings` | ข้อมูลร้าน (ชื่อ, โลโก้, ที่อยู่) |
| `admins` | ผู้ดูแลระบบ |
| `categories` | หมวดหมู่อาหาร |
| `menu_items` | รายการอาหาร |
| `customers` | ข้อมูลลูกค้าจาก LINE |
| `orders` | ออเดอร์ |
| `order_items` | รายการอาหารในออเดอร์ |

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

อย่าลืมตั้งค่า Environment Variables ใน Vercel!

## URLs

- **ลูกค้า:** `/` (ต้องเปิดผ่าน LINE LIFF)
- **Admin Login:** `/admin`
- **Admin Dashboard:** `/admin/dashboard`

## License

MIT
