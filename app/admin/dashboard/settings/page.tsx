"use client";

import { useEffect, useState } from "react";
import { getShopSettings, updateShopSettings, uploadImage, ShopSettings } from "@/lib/supabase";

export default function SettingsPage() {
  const [shop, setShop] = useState<ShopSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    shop_name: "",
    shop_description: "",
    phone: "",
    address: "",
    min_pickup_time: "15",
    is_open: true,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getShopSettings();
      if (data) {
        setShop(data);
        setFormData({
          shop_name: data.shop_name,
          shop_description: data.shop_description || "",
          phone: data.phone || "",
          address: data.address || "",
          min_pickup_time: data.min_pickup_time.toString(),
          is_open: data.is_open,
        });
        setLogoPreview(data.logo_url);
        setCoverPreview(data.cover_image_url);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let logoUrl = shop?.logo_url || null;
      let coverUrl = shop?.cover_image_url || null;

      // Upload logo if changed
      if (logoFile) {
        const path = `shop/logo-${Date.now()}.${logoFile.name.split(".").pop()}`;
        const uploadedUrl = await uploadImage("shop-images", logoFile, path);
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        }
      }

      // Upload cover if changed
      if (coverFile) {
        const path = `shop/cover-${Date.now()}.${coverFile.name.split(".").pop()}`;
        const uploadedUrl = await uploadImage("shop-images", coverFile, path);
        if (uploadedUrl) {
          coverUrl = uploadedUrl;
        }
      }

      const data = {
        shop_name: formData.shop_name,
        shop_description: formData.shop_description || null,
        phone: formData.phone || null,
        address: formData.address || null,
        min_pickup_time: parseInt(formData.min_pickup_time),
        is_open: formData.is_open,
        logo_url: logoUrl,
        cover_image_url: coverUrl,
      };

      if (!shop?.id) {
        console.error("No shop ID found");
        alert("ไม่พบข้อมูลร้าน กรุณาโหลดหน้าใหม่");
        return;
      }
      const updated = await updateShopSettings(shop.id, data);
      if (updated) {
        setShop(updated);
        alert("บันทึกข้อมูลเรียบร้อย");
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("ไม่สามารถบันทึกได้ กรุณาลองใหม่");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าร้าน</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo & Cover */}
        <div className="card p-6 space-y-6">
          <h2 className="font-semibold text-gray-900">รูปภาพร้าน</h2>

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">โลโก้ร้าน</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" className="btn btn-outline cursor-pointer">
                  เปลี่ยนโลโก้
                </label>
                <p className="text-xs text-gray-500 mt-2">แนะนำ: 200x200 pixels, รูปสี่เหลี่ยมจัตุรัส</p>
              </div>
            </div>
          </div>

          {/* Cover */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">รูปปก</label>
            <div className="space-y-3">
              <div className="w-full h-40 bg-gray-100 rounded-xl overflow-hidden">
                {coverPreview ? (
                  <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                  id="cover-upload"
                />
                <label htmlFor="cover-upload" className="btn btn-outline cursor-pointer">
                  เปลี่ยนรูปปก
                </label>
                <span className="text-xs text-gray-500 ml-2">แนะนำ: 1200x400 pixels</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shop Info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">ข้อมูลร้าน</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อร้าน <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.shop_name}
              onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
            <textarea
              value={formData.shop_description}
              onChange={(e) => setFormData({ ...formData, shop_description: e.target.value })}
              className="input"
              rows={3}
              placeholder="อธิบายเกี่ยวกับร้านของคุณ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input"
              placeholder="0xx-xxx-xxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input"
              rows={2}
              placeholder="ที่อยู่ร้าน"
            />
          </div>
        </div>

        {/* Order Settings */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">การตั้งค่าออเดอร์</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เวลาเตรียมอาหารขั้นต่ำ (นาที)</label>
            <input
              type="number"
              value={formData.min_pickup_time}
              onChange={(e) => setFormData({ ...formData, min_pickup_time: e.target.value })}
              className="input"
              min="1"
            />
            <p className="text-xs text-gray-500 mt-1">ลูกค้าจะไม่สามารถเลือกเวลารับอาหารน้อยกว่านี้ได้</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">สถานะร้าน</p>
              <p className="text-sm text-gray-500">เปิด/ปิดรับออเดอร์</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_open}
                onChange={(e) => setFormData({ ...formData, is_open: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary px-8 disabled:opacity-50"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <div className="spinner"></div>
                กำลังบันทึก...
              </span>
            ) : (
              "บันทึกการตั้งค่า"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
