// src/components/Dashboard.jsx
import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import confetti from "canvas-confetti";
import {
  CheckCircle2, Circle, Plus, LogOut, Zap, Crown, Loader2, Settings,
  Trash2, LayoutGrid, History as HistoryIcon, ChevronDown, Search,
  User, CreditCard, ChevronRight, Lock, Sparkles, Edit2, Check, FolderPlus, KeyRound
} from "lucide-react";

export default function Dashboard({ session }) {
  // --- [1] ALL STATES (คงเดิม 100%) ---
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [newTask, setNewTask] = useState("");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [historyTasks, setHistoryTasks] = useState([]);
  const [showHistory, setShowHistory] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [oldLevel, setOldLevel] = useState(null);
  const [currentTheme, setCurrentTheme] = useState("default");
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [priority, setPriority] = useState("medium");
  const [quote, setQuote] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState("");

  // --- [2] INITIALIZATION & REALTIME ---
  const quotes = ["วันนี้เป็นวันที่ดีในการเริ่มทำสิ่งที่ค้างไว้!", "งานเล็กๆ ที่ทำสำเร็จ คือก้าวแรกของความสำเร็จที่ยิ่งใหญ่", "จดจำความพยายามของตัวเองในวันนี้ด้วยนะ", "Keep pushing!", "อย่าแค่จดจำ... แต่จงลงมือทำให้สำเร็จ"];

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    fetchUserData();
    fetchTasks();
    fetchCategories();
    const sub = supabase.channel("profile_realtime").on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${session.user.id}` }, (payload) => {
        const newProfile = payload.new;
        if (oldLevel && newProfile.current_level > oldLevel) {
          setShowLevelUp(true);
          setTimeout(() => setShowLevelUp(false), 5000);
        }
        setOldLevel(newProfile.current_level);
        setProfile(newProfile);
        if (newProfile.selected_theme) setCurrentTheme(newProfile.selected_theme);
      }).subscribe();
    return () => supabase.removeChannel(sub);
  }, [session.user.id, oldLevel]);

  useEffect(() => { fetchHistory(); }, [tasks, showHistory]);

  // --- [3] CORE LOGIC FUNCTIONS ---
  const playSound = (type) => {
    const sounds = { success: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3", levelUp: "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3", click: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3" };
    const audio = new Audio(sounds[type]); audio.volume = 0.3; audio.play().catch(() => {});
    if (navigator.vibrate) navigator.vibrate(type === "levelUp" ? [100, 50, 100] : 40);
  };

  const fireConfetti = (isBig) => {
    confetti({ particleCount: isBig ? 150 : 40, spread: 70, origin: { y: 0.8 }, colors: ["#FFD700", "#FFA500", "#FF4500"] });
  };

  const fetchUserData = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    if (data) { setProfile(data); setOldLevel(data.current_level); setTempUsername(data.username || "Explorer"); if (data.selected_theme) setCurrentTheme(data.selected_theme); }
  };

  const fetchTasks = async () => {
    const { data } = await supabase.from("tasks").select("*").eq("user_id", session.user.id).eq("is_hidden", false).eq("is_deleted_from_tasks", false).order("created_at", { ascending: false });
    setTasks(data || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("created_at", { ascending: true });
    if (!error) setCategories(data || []);
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const activeTasksCount = tasks.filter((t) => t.status !== "done").length;
    if (!profile?.is_premium && activeTasksCount >= 10) { setIsSettingsOpen(true); alert("⚠️ สายฟรีจำกัด 10 งานครับ!"); return; }
    const { error } = await supabase.from("tasks").insert([{ title: newTask, user_id: session.user.id, priority: priority, category_id: selectedCategoryId }]);
    if (!error) { playSound("click"); setNewTask(""); fetchTasks(); }
  };

  const toggleTaskStatus = async (task) => {
    const newStatus = task.status === "done" ? "active" : "done";
    playSound(newStatus === "done" ? "success" : "click");
    if (newStatus === "done") {
      fireConfetti(false);
      if (doneToday + 1 === (profile?.daily_goal_count || 3)) fireConfetti(true);
    }
    const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id);
    if (!error) {
      if (newStatus === "done") { await supabase.rpc("increment_exp", { user_id_input: session.user.id, amount: 10 }); updateStreak(); }
      fetchTasks(); fetchUserData();
    }
  };

  const updateUsername = async () => {
    if (!tempUsername.trim()) return setIsEditingUsername(false);
    const { error } = await supabase.from("profiles").update({ username: tempUsername }).eq("id", session.user.id);
    if (!error) { setProfile({ ...profile, username: tempUsername }); setIsEditingUsername(false); playSound("click"); }
  };

  // --- [NEW] FORGOT PASSWORD LOGIC ---
  const handleForgotPassword = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) alert(error.message);
    else alert("📧 ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว!");
  };

  // --- [FIXED] LOGOUT LOGIC ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/"; // บังคับกลับไปหน้าแรกเพื่อป้องกัน 403 Forbidden
  };

  const addCategory = async () => {
    if (!profile?.is_premium) { alert("🔒 Premium required!"); setIsSettingsOpen(true); return; }
    if (!newCatName.trim()) return;
    const { error } = await supabase.from("categories").insert([{ name: newCatName, user_id: session.user.id, icon: "📁" }]);
    if (!error) { setNewCatName(""); setIsAddingCat(false); fetchCategories(); playSound("click"); }
  };

  const saveEdit = async (taskId) => {
    if (!editValue.trim()) return setEditingId(null);
    const { error } = await supabase.from("tasks").update({ title: editValue }).eq("id", taskId);
    if (!error) { setEditingId(null); fetchTasks(); }
  };

  const deleteTask = async (id) => {
    if (window.confirm("ต้องการลบ?")) {
      const { error } = await supabase.from("tasks").update({ is_deleted_from_tasks: true }).eq("id", id);
      if (!error) { fetchTasks(); fetchHistory(); }
    }
  };

  const deleteHistoryPermanently = async (id) => {
    if (window.confirm("ลบถาวร?")) {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (!error) fetchHistory();
    }
  };

  const fetchHistory = async () => {
    const { data } = await supabase.from("tasks").select("*").eq("user_id", session.user.id).eq("status", "done").order("updated_at", { ascending: false }).limit(20);
    setHistoryTasks(data || []);
  };

  const updateStreak = async () => {
    if (!profile) return;
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    let newStreak = profile.last_checkin_date === yesterdayStr ? (profile.streak_count || 0) + 1 : 1;
    if (profile.last_checkin_date === today) return;
    await supabase.from("profiles").update({ streak_count: newStreak, last_checkin_date: today }).eq("id", session.user.id);
    fetchUserData();
  };

  const changeTheme = async (id) => {
    playSound("click"); setCurrentTheme(id); setIsThemeOpen(false);
    await supabase.from("profiles").update({ selected_theme: id }).eq("id", session.user.id);
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", { body: { user_id: session.user.id, email: session.user.email } });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e) { alert(e.message); } finally { setIsUpgrading(false); }
  };

  const handleManageSubscription = async () => {
    setIsOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal", { body: { customer_id: profile.stripe_customer_id } });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err) { alert(err.message); } finally { setIsOpeningPortal(false); }
  };

  // --- [4] DEFINING COMPUTED VARIABLES (useMemo) ---
  const expPercentage = useMemo(() => profile?.exp_points ? profile.exp_points % 100 : 0, [profile]);
  const doneToday = useMemo(() => tasks.filter((t) => t.status === "done" && new Date(t.updated_at).toISOString().split("T")[0] === new Date().toISOString().split("T")[0]).length, [tasks]);
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategoryId ? t.category_id === selectedCategoryId : true;
      const matchesStatus = filterStatus === "all" ? true : filterStatus === "active" ? t.status !== "done" : t.status === "done";
      return matchesSearch && matchesCategory && matchesStatus;
    }).sort((a, b) => {
      const pMap = { high: 1, medium: 2, low: 3 };
      return (pMap[a.priority] || 2) - (pMap[b.priority] || 2);
    });
  }, [tasks, searchTerm, selectedCategoryId, filterStatus]);

  const themes = {
    default: { icon: "⚡️", bg: "bg-[#F8F9FB]", card: "bg-white", accent: "bg-black", text: "text-[#1A1D21]", levelBox: "bg-black", bar: "bg-black", profileBg: "" },
    Darkmode: { icon: "🌙", bg: "bg-[#0D1117]", card: "bg-[#1C2128] border border-slate-700 shadow-xl", accent: "bg-[#7C3AED]", text: "text-slate-100", levelBox: "bg-gradient-to-br from-[#7C3AED] to-[#4F46E5]", bar: "bg-[#A78BFA]", profileBg: "url('https://www.popsci.com/wp-content/uploads/2022/12/21/moon-surface-orion.jpg?quality=85')" },
    gold: { icon: "👑", bg: "bg-black", card: "bg-zinc-900 border-yellow-900", accent: "bg-[#EAB308]", text: "text-yellow-500", levelBox: "bg-gradient-to-b from-yellow-300 to-yellow-600 !text-black", bar: "bg-yellow-500", profileBg: "" },
  };
  const theme = themes[currentTheme] || themes.default;

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} transition-all duration-500 pb-12 font-sans text-black`}>
      <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }` }} />

      {/* --- LEVEL UP --- */}
      {showLevelUp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none overflow-hidden text-white">
          <div className="absolute inset-0 bg-yellow-400/10 backdrop-blur-[2px]"></div>
          <div className="relative animate-in zoom-in-50 duration-500 ease-out flex flex-col items-center">
            <div className="bg-black text-white px-10 py-6 rounded-[2.5rem] shadow-2xl flex flex-col items-center border-t-2 border-yellow-300/50">
              <Zap size={36} className="text-yellow-400 fill-yellow-400 animate-bounce mb-2" />
              <h2 className="text-4xl font-black italic">LEVEL UP !</h2>
              <p className="text-2xl font-black text-yellow-400">LV.{profile?.current_level}</p>
            </div>
          </div>
        </div>
      )}

      {/* --- TOP NAVIGATION --- */}
      <nav className={`sticky top-0 z-40 ${theme.card} border-b border-gray-100 mb-8 px-4 py-3 shadow-sm text-black`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`${theme.accent} p-1.5 rounded-lg text-white`}><Zap size={20} className="fill-white" /></div>
            <h1 className="text-xl font-black tracking-tighter uppercase">JODJUM</h1>
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-gray-100 rounded-full border border-gray-50 shadow-sm text-gray-400 hover:text-black transition-all"><Settings size={20} /></button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        <div className="lg:col-span-7 space-y-6 order-1 text-black">
          <div className={`${theme.card} rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden bg-cover bg-center transition-all duration-700`} style={{ backgroundImage: theme.profileBg }}>
            <div className={`w-20 h-20 shrink-0 ${theme.levelBox} rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-lg z-10`}>{profile?.current_level || 1}</div>
            <div className="flex-1 w-full z-10">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase text-black">Level Explorer</h2>
              <p className="text-[10px] font-bold text-gray-400 italic mb-2">"{quote}"</p>
              <div className="w-full h-3 bg-gray-200/50 rounded-full overflow-hidden">
                <div className={`h-full ${theme.bar} transition-all duration-1000`} style={{ width: `${expPercentage}%` }}></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Current Streak (Supercharged Color Change) */}
            <div className={`${theme.card} p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden transition-all`}>
               <div className={`absolute -right-4 -bottom-4 transition-all ${doneToday >= 3 ? "text-yellow-400 opacity-20 scale-125" : "text-orange-500 opacity-10"}`}><Zap size={80} fill="currentColor" /></div>
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${doneToday >= 3 ? "bg-yellow-400 text-black shadow-lg" : "bg-orange-100 text-orange-500"}`}><Zap size={24} fill="currentColor" /></div>
               <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{doneToday >= 3 ? "Supercharged" : "Current Streak"}</p><span className="text-2xl font-black">{profile?.streak_count || 0} Days</span></div>
            </div>
            <div className={`${theme.card} p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-center gap-2`}>
              <div className="flex justify-between items-center"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Daily Mission</p><span className="text-[10px] font-black text-blue-500">{doneToday} / 3</span></div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(doneToday / 3) * 100}%` }}></div></div>
            </div>
          </div>

          {/* Action Bar & Add Task */}
          <div className={`${theme.card} rounded-[2.5rem] p-6 shadow-sm border border-gray-100 space-y-4`}>
             <div className="flex items-center justify-between mb-2">
                <div className="flex gap-1.5 bg-gray-50 p-1 rounded-2xl">
                  {['high', 'medium', 'low'].map(p => (
                    <button key={p} onClick={() => { if(!profile?.is_premium && p !== 'medium') return alert("Premium Only!"); setPriority(p); }} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${priority === p ? 'bg-black text-white' : 'text-gray-400'}`}>
                      {p} {!profile?.is_premium && p !== 'medium' && <Lock size={8}/>}
                    </button>
                  ))}
                </div>
                <button onClick={() => { if(!profile?.is_premium) return alert("Premium Only!"); setIsAddingCat(true); }} className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl text-[9px] font-black uppercase text-gray-500"><FolderPlus size={14}/> Folder</button>
             </div>

             <form onSubmit={addTask} className="relative">
                <input type="text" placeholder="จดจำอะไรใหม่ๆ..." className="w-full pl-6 pr-16 py-4 bg-gray-50 rounded-[1.5rem] outline-none text-lg font-bold" value={newTask} onChange={(e) => setNewTask(e.target.value)} />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center"><Plus size={24}/></button>
             </form>
          </div>

          {/* Task List */}
          <div className={`${theme.card} rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden min-h-[400px]`}>
            <div className="divide-y divide-gray-50">
              {filteredTasks.map(task => (
                <div key={task.id} className="group flex items-center gap-4 p-5 hover:bg-gray-50/60 transition-all">
                  <div className={`w-1 h-6 rounded-full ${task.priority === "high" ? "bg-red-500" : task.priority === "low" ? "bg-blue-400" : "bg-orange-400"}`} />
                  <button onClick={() => toggleTaskStatus(task)} className="shrink-0">{task.status === "done" ? <CheckCircle2 className="text-green-500 w-6 h-6" /> : <Circle className="text-gray-300 w-6 h-6" />}</button>
                  <span className={`flex-1 text-[17px] truncate ${task.status === "done" ? "line-through text-gray-300 italic" : "font-bold text-gray-800"}`}>{task.title}</span>
                  <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar History Area */}
        <div className="lg:col-span-5 space-y-8 relative order-2">
          {!profile?.is_premium && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-gray-200 p-6 text-center">
              <Lock size={32} className="text-gray-400 mb-4" />
              <h3 className="font-black italic text-xl mb-4 uppercase">HISTORY LOCKED</h3>
              <button onClick={handleUpgrade} className="bg-yellow-400 text-white px-8 py-3 rounded-2xl font-black italic shadow-lg">UNLOCK NOW</button>
            </div>
          )}
          <div className={`${theme.card} rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden`}>
             <button onClick={() => setShowHistory(!showHistory)} className="w-full p-6 border-b border-gray-50 flex justify-between items-center text-black font-black text-[10px] uppercase tracking-widest"><div className="flex items-center gap-2"><HistoryIcon size={14} /> History</div><ChevronDown size={16}/></button>
             {showHistory && (
                <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {historyTasks.map(t => (<div key={t.id} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl text-black"><CheckCircle2 size={14} className="text-green-500" /><span className="text-sm flex-1 truncate line-through text-gray-400">{t.title}</span><button onClick={() => deleteHistoryPermanently(t.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button></div>))}
                </div>
             )}
          </div>
        </div>
      </main>

      {/* --- MODALS (Settings & Forgot Password) --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsSettingsOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black italic uppercase mb-8">Settings</h2>
            
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100 mb-6">
               <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">{profile?.current_level}</div>
               <div className="flex-1 min-w-0">
                  {isEditingUsername ? (
                    <div className="flex items-center gap-2"><input autoFocus className="bg-transparent border-b-2 border-black font-black text-sm outline-none w-full" value={tempUsername} onChange={(e) => setTempUsername(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && updateUsername()} /><button onClick={updateUsername} className="p-1 bg-black text-white rounded-lg"><Check size={14}/></button></div>
                  ) : (
                    <div className="flex items-center gap-2 group"><p className="text-sm font-black truncate">{profile?.username || "Explorer"}</p><button onClick={() => setIsEditingUsername(true)} className="p-1 text-gray-300 hover:text-black"><Edit2 size={12}/></button></div>
                  )}
                  <p className="text-[10px] text-gray-400 font-bold truncate">{session?.user?.email}</p>
               </div>
            </div>

            {/* Change Password Button */}
            <button onClick={handleForgotPassword} className="w-full py-4 text-xs font-black text-gray-500 bg-gray-50 rounded-2xl mb-4 hover:bg-gray-100 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
              <KeyRound size={16} /> Forgot Password?
            </button>

            {!profile?.is_premium && (
              <button onClick={handleUpgrade} disabled={isUpgrading} className="w-full bg-gradient-to-r from-[#FFB800] to-[#FF3D00] text-white py-4 rounded-2xl font-black italic shadow-lg mb-4 flex items-center justify-center gap-2">
                {isUpgrading ? <Loader2 className="animate-spin" /> : <><Crown size={18} fill="white" /> UNLOCK PRO FEATURES</>}
              </button>
            )}

            <button onClick={handleLogout} className="w-full py-4 text-xs font-black text-red-500 bg-red-50 rounded-2xl hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest">LOGOUT</button>
          </div>
        </div>
      )}

      {/* New Folder Modal (คงเดิม) */}
      {isAddingCat && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl">
            <h3 className="font-black italic text-lg mb-6 uppercase">New Folder</h3>
            <input autoFocus className="w-full p-4 bg-gray-100 rounded-3xl outline-none mb-6 font-bold" placeholder="Folder Name..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
            <div className="flex gap-3"><button onClick={() => setIsAddingCat(false)} className="flex-1 py-4 text-[12px] font-black uppercase opacity-40">Cancel</button><button onClick={addCategory} className="flex-1 py-4 bg-black text-white rounded-2xl text-[12px] font-black uppercase shadow-lg">Create</button></div>
          </div>
        </div>
      )}
    </div>
  );
}