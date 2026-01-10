// src/App.jsx
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import ResetPassword from "./components/ResetPassword"; // 1. นำเข้า Component ใหม่
import { Loader2 } from "lucide-react";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("home"); // 2. เพิ่ม State สำหรับควบคุมหน้า

  useEffect(() => {
    // เช็คสถานะปัจจุบัน
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // ฟังการเปลี่ยนแปลงสถานะ (Login/Logout/Recovery)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      
      // 3. ดักจับถ้าเป็นการกู้คืนรหัสผ่าน
      if (event === "PASSWORD_RECOVERY") {
        setPage("reset-password");
      } else {
        setLoading(false);
      }
    });

    // 4. เช็คจาก URL Hash (สำหรับกรณีบาง Browser ที่ Event ไม่ทำงานทันที)
    if (window.location.hash.includes("type=recovery")) {
      setPage("reset-password");
    }

    return () => subscription.unsubscribe();
  }, []);

  // หน้าจอรอขณะเช็คสถานะ
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
        <Loader2 className="animate-spin text-gray-300" size={32} />
      </div>
    );
  }

  // 5. เงื่อนไขการแสดงหน้าจอ
  
  // กรณีแสดงหน้าตั้งรหัสผ่านใหม่
  if (page === "reset-password") {
    return <ResetPassword />;
  }

  // กรณีที่ยังไม่ได้ Login: แสดงเฉพาะหน้า Auth
  if (!session) {
    return <Auth />;
  }

  // กรณีที่ Login แล้ว: แสดงหน้า Dashboard
  return <Dashboard session={session} />;
}

export default App;