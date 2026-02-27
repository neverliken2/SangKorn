import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - ระบบจัดการร้าน",
  description: "ระบบจัดการร้านอาหารสำหรับผู้ดูแล",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
