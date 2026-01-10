// src/components/ResetPassword.jsx
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Lock, Zap, Loader2 } from "lucide-react";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/"; // กลับหน้าหลัก
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4 font-sans text-black">
      <div className="w-full max-w-sm bg-white rounded-[3rem] shadow-2xl p-8 border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-black p-3 rounded-2xl mb-4 shadow-lg">
            <Zap size={32} className="text-white fill-white" />
          </div>
          <h2 className="text-2xl font-black italic tracking-tighter">RESET PASSWORD</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 text-center">
            กรุณาตั้งรหัสผ่านใหม่สำหรับบัญชี JODJUM
          </p>
        </div>

        {success ? (
          <div className="text-center py-8 animate-in zoom-in-95 duration-300">
            <div className="text-green-500 font-black text-xl mb-2 italic">SUCCESS!</div>
            <p className="text-sm text-gray-500 font-medium">เปลี่ยนรหัสผ่านเรียบร้อย กำลังพาคุณกลับ...</p>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="password"
                required
                placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)"
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 outline-none focus:border-black transition-all font-medium text-black"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <button
              disabled={loading || newPassword.length < 6}
              className="w-full bg-black text-white py-4 rounded-2xl font-black italic tracking-tighter hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "UPDATE PASSWORD"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}