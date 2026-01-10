// src/components/Auth.jsx
import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Zap, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import Terms from "./Terms";

export default function Auth() {
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleUpdatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      alert("ไม่สามารถเปลี่ยนรหัสได้: " + error.message);
    } else {
      alert("เปลี่ยนรหัสผ่านสำเร็จ! คุณสามารถใช้งานแอปต่อได้ทันที");
      // พาผู้ใช้กลับไปหน้า Dashboard
      window.location.href = "/";
    }
  };
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert("กรุณากรอกข้อมูลให้ครบ");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert("กรุณากรอกข้อมูลให้ครบ");
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(error.message);
    } else {
      alert("สมัครสมาชิกสำเร็จ! กรุณาเช็คอีเมลเพื่อยืนยันตัวตน");
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    const email = prompt("กรุณากรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน:");
    if (!email) return;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // URL ที่จะให้ผู้ใช้กลับมาหลังจากกดลิงก์ในอีเมล (เช่น หน้า dashboard หรือหน้าเปลี่ยนรหัส)
      redirectTo: 'http://localhost:5173/reset-password',
    });

    if (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } else {
      alert(
        "ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว! กรุณาตรวจสอบใน Inbox หรือ Junk mail"
      );
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#F8F9FB] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans text-black">
      {/* Background Glows - แสงฟุ้งด้านหลัง */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] sm:w-[40%] h-[40%] bg-blue-100 rounded-full blur-[80px] sm:blur-[120px] opacity-60 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] sm:w-[40%] h-[40%] bg-pink-100 rounded-full blur-[80px] sm:blur-[120px] opacity-60 animate-pulse"></div>

      <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in-95 duration-700">
        {/* Auth Card - รวม Branding ไว้ด้านในเพื่อความกระชับ */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.08)] border border-white/50 mx-auto">
          {/* New Integrated Branding */}
          <div className="text-center mb-10">
            <div className="inline-flex p-3 sm:p-4 bg-black rounded-2xl sm:rounded-[1.5rem] text-white shadow-xl mb-6 transform hover:rotate-6 transition-transform">
              <Zap size={32} className="sm:w-8 sm:h-8 fill-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase italic text-black leading-none">
              JODJUM
            </h1>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="h-[1px] w-4 bg-gray-200"></div>
              <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.3em]">
                Level Up Your Tasks
              </p>
              <div className="h-[1px] w-4 bg-gray-200"></div>
            </div>
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">
              ยินดีต้อนรับกลับมา
            </h2>
            <p className="text-gray-500 text-xs font-medium mt-1">
              สะสม EXP และพิชิตเป้าหมายของคุณ
            </p>
          </div>

          <form className="space-y-4 sm:space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                Email Address
              </label>
              <div className="relative group text-black">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors"
                  size={18}
                />
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-3.5 sm:py-4 bg-gray-50/50 border border-gray-100 rounded-[1.2rem] outline-none focus:ring-4 focus:ring-black/5 focus:bg-white transition-all font-bold text-sm sm:text-base placeholder:text-gray-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                Password
              </label>
              <div className="relative group text-black">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors"
                  size={18}
                />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 sm:py-4 bg-gray-50/50 border border-gray-100 rounded-[1.2rem] outline-none focus:ring-4 focus:ring-black/5 focus:bg-white transition-all font-bold text-sm sm:text-base placeholder:text-gray-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end w-full mt-2">
              <button
                type="button"
                onClick={async () => {
                  const email = prompt("กรุณากรอกอีเมลเพื่อรีเซ็ตรหัสผ่าน:");
                  if (email) {
                    const { error } = await supabase.auth.resetPasswordForEmail(
                      email,
                      {
                        redirectTo: `${window.location.origin}/reset-password`,
                      }
                    );
                    if (error) alert(error.message);
                    else alert("ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว!");
                  }
                }}
                className="text-[10px] font-bold text-gray-400 hover:text-black underline uppercase tracking-widest"
              >
                Forgot Password?
              </button>
            </div>
            {/* Action Buttons */}
            <div className="pt-4 flex flex-col gap-3">
              <button
                disabled={loading}
                onClick={handleLogin}
                className="w-full bg-black text-white py-4 rounded-[1.2rem] font-black text-xs sm:text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    LOG IN <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 my-1 px-4">
                <div className="h-[1px] flex-1 bg-gray-100"></div>
                <span className="text-[8px] font-bold text-gray-300 uppercase">
                  OR
                </span>
                <div className="h-[1px] flex-1 bg-gray-100"></div>
              </div>

              <button
                disabled={loading}
                onClick={handleSignUp}
                className="w-full bg-white text-black border-2 border-gray-100 py-4 rounded-[1.2rem] font-black text-xs sm:text-sm hover:bg-gray-50 active:scale-95 transition-all"
              >
                CREATE ACCOUNT
              </button>
            </div>
          </form>
        </div>
        <div className="mt-8 text-[10px] text-gray-400 leading-relaxed max-w-[280px] mx-auto text-center">
          การเข้าใช้งานถือว่าคุณยอมรับ
          <button
            onClick={() => setShowTerms(true)}
            className="underline mx-1 hover:text-black"
          >
            เงื่อนไขการบริการ
          </button>
          และนโยบายความเป็นส่วนตัว
        </div>

        {/* เรียกใช้ Component Terms */}
        <Terms isOpen={showTerms} onClose={() => setShowTerms(false)} />
        {/* Footer */}
        <div className="text-center mt-10">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.5em] opacity-50">
            © 2026 JODJUM SYSTEM
          </p>
        </div>
      </div>
    </div>
  );
}
