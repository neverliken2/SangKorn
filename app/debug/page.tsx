"use client";

import { useEffect, useState } from "react";

export default function DebugPage() {
  const [info, setInfo] = useState<Record<string, string>>({});

  useEffect(() => {
    setInfo({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT SET",
      supabaseKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) || "NOT SET",
      liffId: process.env.NEXT_PUBLIC_LIFF_ID || "NOT SET",
    });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Info</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(info, null, 2)}
      </pre>
    </div>
  );
}
