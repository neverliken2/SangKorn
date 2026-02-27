import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "สั่งอาหารล่วงหน้า",
  description: "ระบบสั่งอาหารออนไลน์ สั่งก่อนรับได้เลย",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
