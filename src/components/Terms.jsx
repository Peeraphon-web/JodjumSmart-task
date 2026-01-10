// src/components/Terms.jsx
import { X } from 'lucide-react';

export default function Terms({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden bg-white rounded-[3rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter text-black">LEGAL BUNDLE</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Terms & Privacy Policy</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white rounded-full hover:bg-gray-100 transition-all shadow-sm border border-gray-100 active:scale-90"
          >
            <X size={20} className="text-black" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 text-black">
          
          {/* Section 1: Privacy Policy */}
          <section className="space-y-4">
            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <div className="w-1.5 h-6 bg-yellow-400 rounded-full" />
              Privacy Policy
            </h3>
            <div className="space-y-3 text-sm text-gray-600 leading-relaxed font-medium">
              <p>เราให้ความสำคัญกับข้อมูลส่วนบุคคลของคุณ ข้อมูลที่ <span className="text-black font-bold">JODJUM</span> จัดเก็บประกอบด้วย:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><span className="text-black font-bold">Email:</span> ใช้สำหรับการระบุตัวตนและบันทึกข้อมูลงาน (Tasks) ของคุณผ่านระบบ Supabase</li>
                <li><span className="text-black font-bold">Usage Data:</span> ข้อมูลการเก็บ Level, EXP, Streak และธีมที่เลือก เพื่อใช้ในการให้บริการฟีเจอร์ Gamification</li>
                <li><span className="text-black font-bold">Payment:</span> สำหรับสมาชิกพรีเมียม ข้อมูลบัตรเครดิตจะถูกจัดการโดย <span className="text-black font-bold">Stripe</span> โดยตรง เราจะไม่เห็นหรือจัดเก็บข้อมูลทางการเงินของคุณไว้ในระบบ</li>
              </ul>
            </div>
          </section>

          {/* Section 2: Terms of Service */}
          <section className="space-y-4">
            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
              Terms of Service
            </h3>
            <div className="space-y-4 text-sm text-gray-600 leading-relaxed font-medium">
              <p>การใช้งานแอปพลิเคชัน JODJUM ถือว่าคุณยอมรับเงื่อนไขดังต่อไปนี้:</p>
              
              <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                <p className="font-bold text-black mb-2 italic underline">Premium & Refunds</p>
                <p>การอัปเกรดเป็นพรีเมียมเป็นการชำระเงินเพื่อเข้าถึงฟีเจอร์พิเศษ คุณสามารถยกเลิกการต่ออายุอัตโนมัติได้ทุกเมื่อผ่านหน้า Manage Billing อย่างไรก็ตาม เราขอสงวนสิทธิ์ไม่คืนเงิน (No Refund) สำหรับรอบเดือนที่ได้ชำระเงินมาแล้ว</p>
              </div>

              <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                <p className="font-bold text-black mb-2 italic underline">Level & Gamification</p>
                <p>คะแนนเลเวล, EXP และ Streak ในแอปเป็นเพียงระบบสมมติเพื่อความสนุกสนาน ไม่สามารถแลกเปลี่ยนเป็นเงินจริงหรือใช้เรียกร้องสิทธิประโยชน์ใดๆ ภายนอกแอปพลิเคชันได้</p>
              </div>

              <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                <p className="font-bold text-black mb-2 italic underline">Limitation of Liability</p>
                <p>JODJUM เป็นเครื่องมือช่วยจำ เรามุ่งมั่นพัฒนาให้ระบบเสถียรที่สุด แต่จะไม่รับผิดชอบต่อความสูญเสียใดๆ ที่เกิดจากการทำงานผิดพลาดของระบบหรือการสูญหายของข้อมูลในทุกกรณี</p>
              </div>
            </div>
          </section>

          <p className="text-[9px] text-center text-gray-300 font-bold uppercase tracking-widest pt-4">
            Last Updated: January 2024 • JODJUM Team
          </p>
        </div>
      </div>
    </div>
  );
}