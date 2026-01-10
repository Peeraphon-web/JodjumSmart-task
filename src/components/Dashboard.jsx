// src/components/Dashboard.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Circle,
  Plus,
  LogOut,
  Zap,
  Crown,
  Loader2,
  Settings,
  Trash2,
  LayoutGrid,
  History as HistoryIcon,
  ChevronDown,
  Search,
  User,
  CreditCard,
  ChevronRight,
  Lock,
  Sparkles,
  Edit2,
  Check,
  FolderPlus,
} from "lucide-react";

export default function Dashboard({ session }) {
  // --- [1] STATES SYSTEM ---
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

  // --- [2] INITIALIZATION ---
  const quotes = [
    "วันนี้เป็นวันที่ดีในการเริ่มทำสิ่งที่ค้างไว้!",
    "งานเล็กๆ ที่ทำสำเร็จ คือก้าวแรกของความสำเร็จที่ยิ่งใหญ่",
    "จดจำความพยายามของตัวเองในวันนี้ด้วยนะ",
    "Keep pushing!",
    "อย่าแค่จดจำ... แต่จงลงมือทำให้สำเร็จ",
  ];

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    fetchUserData();
    fetchTasks();
    fetchCategories();
    const sub = supabase
      .channel("profile_realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${session.user.id}`,
        },
        (payload) => {
          const newProfile = payload.new;
          if (oldLevel && newProfile.current_level > oldLevel) {
            setShowLevelUp(true);
            setTimeout(() => setShowLevelUp(false), 5000);
          }
          setOldLevel(newProfile.current_level);
          setProfile(newProfile);
          if (newProfile.selected_theme)
            setCurrentTheme(newProfile.selected_theme);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, [session.user.id, oldLevel]);

  useEffect(() => {
    fetchHistory();
  }, [tasks, showHistory]);

  // --- [3] CORE LOGIC FUNCTIONS ---
  const playSound = (type) => {
    const sounds = {
      success:
        "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
      levelUp:
        "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3",
      click:
        "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
    };
    const audio = new Audio(sounds[type]);
    audio.volume = 0.3;
    audio.play().catch(() => {});
    if (navigator.vibrate)
      navigator.vibrate(type === "levelUp" ? [100, 50, 100] : 40);
  };

  const fireConfetti = (isBig) => {
    if (isBig) {
      const duration = 3 * 1000;
      const end = Date.now() + duration;
      const interval = setInterval(() => {
        const timeLeft = end - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        confetti({
          particleCount: 50 * (timeLeft / duration),
          origin: { x: Math.random(), y: Math.random() - 0.2 },
        });
      }, 250);
    } else {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.8 },
        colors: ["#FFD700", "#FFA500", "#FF4500"],
      });
    }
  };

  const fetchUserData = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    if (data) {
      setProfile(data);
      setOldLevel(data.current_level);
      setTempUsername(data.username || "Explorer");
      if (data.selected_theme) setCurrentTheme(data.selected_theme);
    }
  };

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("is_hidden", false)
      .eq("is_deleted_from_tasks", false)
      .order("created_at", { ascending: false });
    setTasks(data || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error) setCategories(data || []);
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const activeTasksCount = tasks.filter((t) => t.status !== "done").length;
    if (!profile?.is_premium && activeTasksCount >= 10) {
      setIsSettingsOpen(true);
      alert("⚠️ สายฟรีจำกัด 10 งานครับ!");
      return;
    }
    const { error } = await supabase.from("tasks").insert([
      {
        title: newTask,
        user_id: session.user.id,
        priority: profile?.is_premium ? priority : "medium",
        category_id: profile?.is_premium ? selectedCategoryId : null,
      },
    ]);
    if (!error) {
      playSound("click");
      setNewTask("");
      fetchTasks();
    }
  };

  const toggleTaskStatus = async (task) => {
    const newStatus = task.status === "done" ? "active" : "done";
    playSound(newStatus === "done" ? "success" : "click");
    if (newStatus === "done") {
      fireConfetti(false);
      if (doneToday + 1 === (profile?.daily_goal_count || 3))
        fireConfetti(true);
    }
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", task.id);
    if (!error) {
      if (newStatus === "done") {
        await supabase.rpc("increment_exp", {
          user_id_input: session.user.id,
          amount: 10,
        });
        updateStreak();
      }
      fetchTasks();
      fetchUserData();
    }
  };

  const updateUsername = async () => {
    if (!tempUsername.trim()) return setIsEditingUsername(false);
    const { error } = await supabase
      .from("profiles")
      .update({ username: tempUsername })
      .eq("id", session.user.id);
    if (!error) {
      setProfile({ ...profile, username: tempUsername });
      setIsEditingUsername(false);
      playSound("click");
    }
  };

  const addCategory = async () => {
    if (!profile?.is_premium) {
      alert("🔒 Premium required!");
      setIsSettingsOpen(true);
      return;
    }
    if (!newCatName.trim()) return;
    const { error } = await supabase
      .from("categories")
      .insert([{ name: newCatName, user_id: session.user.id, icon: "📁" }]);
    if (!error) {
      setNewCatName("");
      setIsAddingCat(false);
      fetchCategories();
      playSound("click");
    }
  };

  const saveEdit = async (taskId) => {
    if (!editValue.trim()) return setEditingId(null);
    const { error } = await supabase
      .from("tasks")
      .update({ title: editValue })
      .eq("id", taskId);
    if (!error) {
      setEditingId(null);
      fetchTasks();
    }
  };

  const deleteTask = async (id) => {
    if (window.confirm("ต้องการลบ?")) {
      const { error } = await supabase
        .from("tasks")
        .update({ is_deleted_from_tasks: true })
        .eq("id", id);
      if (!error) {
        fetchTasks();
        fetchHistory();
      }
    }
  };

  const deleteHistoryPermanently = async (id) => {
    if (window.confirm("ลบถาวร?")) {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (!error) fetchHistory();
    }
  };

  const fetchHistory = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("status", "done")
      .order("updated_at", { ascending: false })
      .limit(20);
    setHistoryTasks(data || []);
  };

  const updateStreak = async () => {
    if (!profile) return;
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    let newStreak =
      profile.last_checkin_date === yesterdayStr
        ? (profile.streak_count || 0) + 1
        : 1;
    if (profile.last_checkin_date === today) return;
    await supabase
      .from("profiles")
      .update({ streak_count: newStreak, last_checkin_date: today })
      .eq("id", session.user.id);
    fetchUserData();
  };

  const changeTheme = async (id) => {
    playSound("click");
    setCurrentTheme(id);
    setIsThemeOpen(false);
    await supabase
      .from("profiles")
      .update({ selected_theme: id })
      .eq("id", session.user.id);
  };
  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const { data } = await supabase.functions.invoke("create-checkout", {
        body: { user_id: session.user.id, email: session.user.email },
      });
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      alert(e.message);
    } finally {
      setIsUpgrading(false);
    }
  };
  const handleManageSubscription = async () => {
    setIsOpeningPortal(true);
    try {
      const { data } = await supabase.functions.invoke("create-portal", {
        body: { customer_id: profile.stripe_customer_id },
      });
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      alert(err.message);
    } finally {
      setIsOpeningPortal(false);
    }
  };

  // --- [4] DEFINING MISSING VARIABLES ---
  const expPercentage = profile?.exp_points ? profile.exp_points % 100 : 0;
  const doneToday = tasks.filter(
    (t) =>
      t.status === "done" &&
      new Date(t.updated_at).toISOString().split("T")[0] ===
        new Date().toISOString().split("T")[0]
  ).length;

  const filteredTasks = tasks
    .filter((t) => {
      const matchesSearch = t.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategoryId
        ? t.category_id === selectedCategoryId
        : true;
      const matchesStatus =
        filterStatus === "all"
          ? true
          : filterStatus === "active"
          ? t.status !== "done"
          : t.status === "done";
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      const pMap = { high: 1, medium: 2, low: 3 };
      return (pMap[a.priority] || 2) - (pMap[b.priority] || 2);
    });

  const themes = {
    default: {
      icon: "⚡️",
      bg: "bg-[#F8F9FB]",
      card: "bg-white",
      accent: "bg-black",
      text: "text-[#1A1D21]",
      levelBox: "bg-black",
      bar: "bg-black",
      profileBg: "",
    },
    Darkmode: {
      icon: "🌙",
      bg: "bg-[#0D1117]",
      card: "bg-[#1C2128] border border-slate-700 shadow-xl",
      accent: "bg-[#7C3AED]",
      text: "text-slate-100",
      levelBox: "bg-gradient-to-br from-[#7C3AED] to-[#4F46E5]",
      bar: "bg-[#A78BFA]",
      profileBg:
        "url('https://www.popsci.com/wp-content/uploads/2022/12/21/moon-surface-orion.jpg?quality=85')",
    },
    cute: {
      icon: "🌸",
      bg: "bg-[#FFF5F7]",
      card: "bg-white/80 backdrop-blur-md",
      accent: "bg-[#FF85A1]",
      text: "text-[#4A4A4A]",
      levelBox: "bg-gradient-to-br from-[#FF85A1] to-[#FFB7C5]",
      bar: "bg-[#FF85A1]",
      profileBg:
        "url('https://img.freepik.com/free-vector/cute-pink-pattern-background_53876-116345.jpg')",
    },
    ocean: {
      icon: "🐙",
      bg: "bg-[#5784B1]",
      card: "bg-white/90",
      accent: "bg-[#D2F1F1]",
      text: "text-[#004D40]",
      levelBox: "bg-gradient-to-tr from-[#5784B1] to-[#D2F1F1]",
      bar: "bg-[#65B0CB]",
      profileBg:
        "url(https://marketplace.canva.com/EAFVfaYjBIc/1/0/1600w/canva-%E0%B8%AA%E0%B8%B5%E0%B8%9F%E0%B9%89%E0%B8%B2-%E0%B8%AA%E0%B8%B5%E0%B8%A1%E0%B9%88%E0%B8%A7%E0%B8%87-%E0%B8%AA%E0%B8%B5%E0%B8%A3%E0%B8%B5%E0%B8%9E%E0%B8%B2%E0%B8%AA%E0%B9%80%E0%B8%97%E0%B8%A5-%E0%B8%A7%E0%B8%AD%E0%B8%A5%E0%B9%80%E0%B8%9B%E0%B9%80%E0%B8%9B%E0%B8%AD%E0%B8%A3%E0%B9%8C-%E0%B8%84%E0%B8%AD%E0%B8%A1%E0%B8%9E%E0%B8%B4%E0%B8%A7%E0%B8%97%E0%B8%B4%E0%B8%A7%E0%B8%97%E0%B8%B1%E0%B8%A8%E0%B8%99%E0%B9%8C-%E0%B8%9B%E0%B8%A5%E0%B8%B2%E0%B8%A7%E0%B8%B2%E0%B8%AC-%E0%B9%83%E0%B8%95%E0%B9%89%E0%B8%97%E0%B8%B0%E0%B9%80%E0%B8%A5-XaqKiRjPe_0.jpg)",
    },
    forest: {
      icon: "🌲",
      bg: "bg-[#76584e]",
      card: "bg-white/90",
      accent: "bg-[#10B981]",
      text: "text-[#064E3B]",
      levelBox: "bg-[#d2d7a1]",
      bar: "bg-[#d2d7a1]",
      profileBg:
        "url(https://storage.googleapis.com/fastwork-static/1396be57-694a-42b3-a857-892a47482b22.jpg)",
    },
    cyber: {
      icon: "🦾",
      bg: "bg-[#1A1A1A]",
      card: "bg-zinc-900 border-zinc-700",
      accent: "bg-[#ADFF2F]",
      text: "text-zinc-100",
      levelBox: "bg-[#ADFF2F] !text-black",
      bar: "bg-[#ADFF2F]",
      profileBg:
        "url('https://cdn.mos.cms.futurecdn.net/iE4FXnNnPvYsZYc4q9PNiY.png')",
    },
    gold: {
      icon: "👑",
      bg: "bg-black",
      card: "bg-zinc-900 border-yellow-900",
      accent: "bg-[#EAB308]",
      text: "text-yellow-500",
      levelBox: "bg-gradient-to-b from-yellow-300 to-yellow-600 !text-black",
      bar: "bg-yellow-500",
      profileBg: "",
    },
  };

  const theme = themes[currentTheme] || themes.default;

  return (
    <div
      className={`min-h-screen ${theme.bg} ${theme.text} transition-all duration-500 pb-12 font-sans text-black`}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }`,
        }}
      />

      {/* --- LEVEL UP COMPONENT --- */}
      {showLevelUp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none overflow-hidden text-white">
          <div className="absolute inset-0 bg-yellow-400/10 backdrop-blur-[2px]"></div>
          <div className="relative animate-in zoom-in-50 duration-500 ease-out flex flex-col items-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-400/30 rounded-full blur-[60px] animate-pulse"></div>
            <div className="relative bg-black text-white px-10 py-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(250,204,21,0.4)] flex flex-col items-center border-t-2 border-yellow-300/50 min-w-[280px]">
              <div className="bg-yellow-400 p-3 rounded-2xl -mt-16 shadow-lg rotate-12 animate-bounce">
                <Zap size={36} className="fill-black text-black" />
              </div>
              <div className="mt-2 text-center text-white">
                <p className="text-yellow-400 font-black text-xs uppercase tracking-[0.3em] mb-1 animate-pulse">
                  New Achievement
                </p>
                <h2 className="text-4xl font-black italic tracking-tighter text-white">
                  LEVEL UP <span className="text-yellow-400 not-italic">!</span>
                </h2>
              </div>
              <div className="mt-4 flex items-center gap-3 bg-white/10 px-6 py-2 rounded-2xl border border-white/10">
                <span className="text-gray-400 font-bold text-sm uppercase tracking-widest text-white">
                  Reached
                </span>
                <span className="text-2xl font-black text-yellow-400">
                  LV.{profile?.current_level}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav
        className={`sticky top-0 z-40 ${theme.card} border-b border-gray-100 mb-8 px-4 py-3 shadow-sm text-black`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`${theme.accent} p-1.5 rounded-lg text-white`}>
              <Zap size={20} className="fill-white" />
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase text-black">
              JODJUM
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button
                onClick={() => setIsThemeOpen(!isThemeOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-100 bg-white/80 backdrop-blur-md shadow-sm active:scale-95 transition-all text-black"
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${theme.levelBox} text-white`}
                >
                  {theme.icon}
                </div>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 transition-transform ${
                    isThemeOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isThemeOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsThemeOpen(false)}
                  ></div>
                  <div
                    className={`absolute right-0 mt-3 w-56 rounded-[2rem] ${theme.card} shadow-2xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200`}
                  >
                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-1 space-y-1">
                      {Object.entries(themes).map(([id, t]) => {
                        const isLocked =
                          !profile?.is_premium &&
                          (id === "gold" || id === "cyber");
                        return (
                          <button
                            key={id}
                            disabled={isLocked}
                            onClick={() => changeTheme(id)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-bold ${
                              currentTheme === id
                                ? "bg-gray-100"
                                : "hover:bg-gray-50"
                            } ${
                              isLocked
                                ? "opacity-40 cursor-not-allowed text-black"
                                : "text-black"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <span>{t.icon}</span>
                              {id}
                            </span>
                            {isLocked && (
                              <Lock size={12} className="text-gray-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => {
                playSound("click");
                setIsSettingsOpen(true);
              }}
              className="p-2 hover:bg-gray-100 rounded-full border border-gray-50 shadow-sm text-gray-400 hover:text-black transition-all"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        <div className="lg:col-span-7 space-y-6 order-1">
          <div className="px-2 py-1">
            <h3 className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-2">
              {new Date().getHours() < 12
                ? "🌅 Good Morning"
                : new Date().getHours() < 18
                ? "☀️ Good Afternoon"
                : "🌙 Good Evening"}
              <span className="text-gray-300 not-italic">/</span>
              <span className={`${theme.text} opacity-50`}>
                {profile?.username || "Explorer"}
              </span>
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1 text-black">
              {tasks.filter((t) => t.status !== "done").length > 0
                ? `You have ${
                    tasks.filter((t) => t.status !== "done").length
                  } tasks waiting`
                : "Everything is clear."}
            </p>
          </div>

          <div
            className={`${theme.card} rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden bg-cover bg-center transition-all duration-700`}
            style={{ backgroundImage: theme.profileBg }}
          >
            {theme.profileBg && (
              <div className="absolute inset-0 bg-white/40 pointer-events-none"></div>
            )}
            <div
              className={`w-20 h-20 shrink-0 ${theme.levelBox} rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-lg z-10`}
            >
              {profile?.current_level || 1}
            </div>
            <div className="flex-1 w-full text-center sm:text-left z-10">
              <div className="flex items-center gap-3 mb-1 justify-center sm:justify-start">
                <h2 className="text-2xl font-black italic tracking-tighter uppercase text-black text-black">
                  Level Explorer
                </h2>
                {profile?.is_premium && (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-orange-500 blur-md opacity-50 group-hover:opacity-80"></div>
                    <div className="relative bg-gradient-to-r from-[#FFB800] via-[#FF6B00] to-[#FF3D00] text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg border border-white/20 flex items-center gap-1.5 animate-in zoom-in-50 duration-500">
                      <Crown size={12} className="fill-white" />{" "}
                      <span className="tracking-widest uppercase">Premium</span>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-[10px] font-bold text-gray-400 italic mb-2">
                "{quote}"
              </p>
              <div className="space-y-1 mt-2">
                <div className="w-full h-3 bg-gray-200/50 rounded-full overflow-hidden backdrop-blur-sm text-black">
                  <div
                    className={`h-full ${theme.bar} transition-all duration-1000`}
                    style={{ width: `${expPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-black text-gray-500 tracking-tighter text-black">
                  <span>
                    PROGRESS TO LV.{(profile?.current_level || 1) + 1}
                  </span>
                  <span>{100 - expPercentage} EXP LEFT</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* --- การ์ด Current Streak (ปรับให้เปลี่ยนสีเมื่อเติมไฟสำเร็จ) --- */}
            <div
              className={`${theme.card} p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden transition-all duration-500`}
            >
              {/* สายฟ้าพื้นหลัง: ถ้าทำภารกิจสำเร็จจะเปลี่ยนเป็นสีทองสว่างและขยายใหญ่ขึ้น */}
              <div
                className={`absolute -right-4 -bottom-4 transition-all duration-700 ${
                  doneToday >= (profile?.daily_goal_count || 3)
                    ? "opacity-20 text-yellow-400 scale-125 rotate-12"
                    : "opacity-10 text-orange-500"
                }`}
              >
                <Zap size={100} className="fill-current" />
              </div>

              {/* ไอคอนสายฟ้าเล็ก: ถ้าสำเร็จจะเปลี่ยนเป็นสีทองพร้อมเงาฟุ้ง (Glow) */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  doneToday >= (profile?.daily_goal_count || 3)
                    ? "bg-yellow-400 text-black shadow-[0_0_20px_rgba(250,204,21,0.6)] scale-110"
                    : "bg-orange-100 text-orange-500 shadow-inner"
                }`}
              >
                <Zap size={24} className="fill-current" />
              </div>

              <div className="relative z-10">
                <p
                  className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                    doneToday >= (profile?.daily_goal_count || 3)
                      ? "text-yellow-600"
                      : "text-gray-400"
                  }`}
                >
                  {doneToday >= (profile?.daily_goal_count || 3)
                    ? "⚡️ Fully Charged"
                    : "Current Streak"}
                </p>
                <div className="flex items-baseline gap-1 text-black">
                  <span
                    className={`text-2xl font-black transition-all ${
                      doneToday >= (profile?.daily_goal_count || 3)
                        ? "text-yellow-500 scale-110 inline-block"
                        : ""
                    }`}
                  >
                    {profile?.streak_count || 0}
                  </span>
                  <span className="text-xs font-bold text-gray-400 uppercase">
                    Days
                  </span>
                </div>
              </div>
            </div>

            {/* --- การ์ด Daily Mission (คงเดิม) --- */}
            <div
              className={`${theme.card} p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-center gap-2 text-black`}
            >
              <div className="flex justify-between items-center text-black">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Daily Mission
                </p>
                <span
                  className={`text-[10px] font-black transition-colors ${
                    doneToday >= (profile?.daily_goal_count || 3)
                      ? "text-green-500"
                      : "text-blue-500"
                  }`}
                >
                  {doneToday} / {profile?.daily_goal_count || 3}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    doneToday >= (profile?.daily_goal_count || 3)
                      ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                      : "bg-gradient-to-r from-blue-400 to-indigo-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      (doneToday / (profile?.daily_goal_count || 3)) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
              <p className="text-[9px] font-bold text-gray-400 italic">
                {doneToday >= (profile?.daily_goal_count || 3)
                  ? "Mission Complete! You're on fire! 🔥"
                  : "Finish your tasks to keep streak!"}
              </p>
            </div>
          </div>

          <div
            className={`${theme.card} rounded-[2.5rem] p-6 shadow-sm border border-gray-100 space-y-4`}
          >
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5 bg-gray-100/50 p-1 rounded-2xl border border-gray-100 relative group">
                {["high", "medium", "low"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      if (!profile?.is_premium && p !== "medium") {
                        setIsSettingsOpen(true);
                        alert("🔒 เฉพาะสมาชิก Premium เท่านั้น!");
                        return;
                      }
                      setPriority(p);
                      playSound("click");
                    }}
                    className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1 ${
                      priority === p
                        ? "bg-black text-white shadow-md"
                        : "text-gray-400 hover:text-black"
                    }`}
                  >
                    {p}
                    {!profile?.is_premium && p !== "medium" && (
                      <Lock size={8} className="opacity-50" />
                    )}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!profile?.is_premium) {
                    setIsSettingsOpen(true);
                    alert("🔒 ฟีเจอร์สร้างโฟลเดอร์สำหรับสมาชิก Premium!");
                    return;
                  }
                  setIsAddingCat(true);
                }}
                className={`flex items-center gap-2 px-4 py-2 border rounded-2xl text-[9px] font-black uppercase transition-all ${
                  profile?.is_premium
                    ? "bg-gray-100/50 border-gray-100 text-gray-600 hover:bg-gray-200 shadow-sm"
                    : "bg-gray-50 border-transparent text-gray-300 cursor-default"
                }`}
              >
                <FolderPlus size={14} />
                <span>New Folder</span>
                {!profile?.is_premium && <Lock size={12} className="ml-1" />}
              </button>
            </div>

            <form onSubmit={addTask} className="relative">
              <input
                type="text"
                placeholder="จดจำอะไรใหม่ๆ..."
                className="w-full pl-6 pr-16 py-4 bg-gray-100/50 rounded-[1.5rem] border border-transparent focus:bg-white focus:border-gray-100 outline-none text-lg transition-all font-bold text-black"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-90 transition-all shadow-lg text-black">
                <Plus size={24} className="text-white" />
              </button>
            </form>

            <div className="flex gap-2 overflow-x-auto py-1 custom-scrollbar text-black">
              <button
                onClick={() => setSelectedCategoryId(null)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap border-2 ${
                  selectedCategoryId === null
                    ? "bg-black text-white border-black shadow-lg text-white"
                    : "bg-white/50 text-black/40 border-transparent hover:border-black/10 text-black"
                }`}
              >
                All Tasks
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap border-2 ${
                    selectedCategoryId === cat.id
                      ? "bg-black text-white border-black shadow-lg text-white"
                      : "bg-white/50 text-black/40 border-transparent hover:border-black/10 text-black"
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
              {!profile?.is_premium && categories.length > 0 && (
                <span className="flex items-center gap-1 text-[8px] font-bold text-gray-300 italic uppercase ml-1">
                  <Lock size={8} /> Project filter premium
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full text-black text-black">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="ค้นหาภารกิจ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${theme.card} w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 text-sm outline-none text-black`}
              />
            </div>
            <div className="flex bg-gray-100 p-1 rounded-2xl overflow-x-auto whitespace-nowrap custom-scrollbar">
              {["all", "active", "done"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all text-black ${
                    filterStatus === status
                      ? theme.accent + " text-white shadow-md"
                      : "text-gray-400 hover:text-gray-600 text-black"
                  }`}
                >
                  {status === "all"
                    ? "ทั้งหมด"
                    : status === "active"
                    ? "กำลังทำ"
                    : "เสร็จแล้ว"}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`${theme.card} rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden min-h-[400px] flex flex-col text-black`}
          >
            <div className="divide-y divide-gray-50 flex-1 overflow-y-auto custom-scrollbar text-black text-black">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group relative flex items-center gap-4 p-5 hover:bg-gray-50/60 transition-all active:scale-[0.985] text-black"
                  >
                    <div
                      className={`absolute left-1.5 top-3 bottom-3 w-1.5 rounded-full transition-all duration-500 ${
                        task.priority === "high"
                          ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                          : task.priority === "low"
                          ? "bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.5)]"
                          : "bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.5)]"
                      }`}
                    />
                    <button
                      onClick={() => toggleTaskStatus(task)}
                      className="ml-2 shrink-0 transition-transform active:scale-150 text-black"
                    >
                      {task.status === "done" ? (
                        <CheckCircle2 className="text-green-500 w-6 h-6" />
                      ) : (
                        <Circle className="text-gray-300 w-6 h-6 hover:text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      {editingId === task.id ? (
                        <input
                          autoFocus
                          className="w-full bg-transparent border-b-2 border-black py-0.5 outline-none font-bold text-[17px] text-black"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => saveEdit(task.id)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && saveEdit(task.id)
                          }
                        />
                      ) : (
                        <span
                          className={`text-[17px] block truncate tracking-tight transition-all duration-300 text-black ${
                            task.status === "done"
                              ? "line-through text-gray-300 italic font-medium"
                              : "font-bold text-gray-800"
                          }`}
                        >
                          {task.title}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 text-black pr-1">
                      <button
                        onClick={() => {
                          playSound("click");
                          setEditingId(task.id);
                          setEditValue(task.title);
                        }}
                        className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Settings size={16} />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-in fade-in zoom-in duration-700 text-black">
                  <div className="relative mb-6 text-black">
                    <div
                      className={`absolute inset-0 ${theme.accent} opacity-10 blur-3xl rounded-full scale-150 text-black`}
                    ></div>
                    <div
                      className={`relative bg-white p-8 rounded-[3rem] shadow-xl border border-gray-50 text-gray-200`}
                    >
                      <Sparkles
                        size={64}
                        className="animate-pulse text-black"
                      />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-yellow-400 p-2 rounded-2xl shadow-lg rotate-12 text-black">
                      <Plus size={20} className="text-black" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2 text-black">
                    Everything is Clear
                  </h3>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8 relative order-2 text-black text-black">
          {!profile?.is_premium && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-gray-200 p-6 text-center text-black">
              <div className="bg-white p-4 rounded-3xl shadow-xl mb-4 border border-gray-50 text-gray-400 animate-bounce text-black text-black">
                <Lock size={32} />
              </div>
              <h3 className="font-black text-black italic text-xl tracking-tight mb-2 uppercase">
                HISTORY LOCKED
              </h3>
              <button
                onClick={handleUpgrade}
                className="bg-yellow-400 text-white px-8 py-3 rounded-2xl font-black italic shadow-lg hover:scale-105 active:scale-95 transition-all text-black"
              >
                UNLOCK NOW
              </button>
            </div>
          )}
          <div
            className={`${theme.card} rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden text-black`}
          >
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full p-6 border-b border-gray-50 flex justify-between items-center text-black text-black text-black"
            >
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 text-black text-black text-black">
                <HistoryIcon size={14} /> History
              </p>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform ${
                  showHistory ? "rotate-180" : ""
                } text-black`}
              />
            </button>
            {showHistory && (
              <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar text-black text-black">
                {historyTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl text-black text-black text-black text-black"
                  >
                    <CheckCircle2
                      size={14}
                      className="text-green-500 text-black"
                    />
                    <span className="text-sm flex-1 truncate line-through text-gray-400">
                      {t.title}
                    </span>
                    <button
                      onClick={() => deleteHistoryPermanently(t.id)}
                      className="text-gray-300 hover:text-red-500 text-black text-black text-black"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- ADD CATEGORY MODAL --- */}
      {isAddingCat && profile?.is_premium && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm text-black">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border border-white text-black">
            <h3 className="font-black italic uppercase text-lg mb-6 text-black text-black">
              New Project
            </h3>
            <input
              autoFocus
              className="w-full p-5 bg-gray-100 rounded-3xl outline-none mb-6 font-bold text-black"
              placeholder="ชื่อโฟลเดอร์..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setIsAddingCat(false)}
                className="flex-1 py-4 text-[12px] font-black uppercase opacity-40 text-black"
              >
                Cancel
              </button>
              <button
                onClick={addCategory}
                className="flex-1 py-4 bg-black text-white rounded-2xl text-[12px] font-black uppercase shadow-lg text-white"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SETTINGS MODAL --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsSettingsOpen(false)}
          ></div>
          <div className="relative w-full max-w-sm overflow-hidden bg-white rounded-[2.5rem] shadow-2xl text-black">
            <div className="p-8 pb-4 flex justify-between items-center text-black text-black text-black">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase text-black">
                SETTINGS
              </h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all text-black"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            <div className="p-8 pt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                  <div
                    className={`w-14 h-14 rounded-2xl ${theme.levelBox} flex items-center justify-center shadow-lg text-white text-xl font-black text-white text-white`}
                  >
                    {profile?.current_level}
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditingUsername ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          className="bg-transparent border-b-2 border-black font-black text-sm outline-none w-full text-black"
                          value={tempUsername}
                          onChange={(e) => setTempUsername(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && updateUsername()
                          }
                        />
                        <button
                          onClick={updateUsername}
                          className="p-1 bg-black text-white rounded-lg"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group text-black">
                        <p className="text-sm font-black truncate text-black">
                          {profile?.username || "Explorer"}
                        </p>
                        <button
                          onClick={() => setIsEditingUsername(true)}
                          className="opacity-0 group-hover:opacity-100 transition-all p-1 text-gray-400 hover:text-black"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 font-bold truncate text-black">
                      {session?.user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {!profile?.is_premium && (
                <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group text-white">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4 text-white">
                      <Crown size={20} className="fill-white" />
                      <span className="font-black italic uppercase text-base text-white">
                        Upgrade to Pro
                      </span>
                    </div>
                    <button
                      onClick={handleUpgrade}
                      disabled={isUpgrading}
                      className="w-full bg-black text-white py-3.5 rounded-2xl font-black italic tracking-tighter shadow-2xl hover:scale-[1.02] active:scale-95 transition-all text-white"
                    >
                      {isUpgrading ? (
                        <Loader2
                          className="animate-spin text-white"
                          size={18}
                        />
                      ) : (
                        <span>
                          UNLOCK PREMIUM <ChevronRight size={16} />
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {profile?.is_premium && (
                <div className="space-y-3">
                  <button
                    onClick={handleManageSubscription}
                    disabled={isOpeningPortal}
                    className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-black transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      {isOpeningPortal ? (
                        <Loader2
                          className="animate-spin text-black"
                          size={18}
                        />
                      ) : (
                        <CreditCard size={18} />
                      )}
                      <span className="text-sm font-bold text-black text-black">
                        Manage Billing
                      </span>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-gray-400 group-hover:text-black"
                    />
                  </button>
                </div>
              )}

              <button
                onClick={() => supabase.auth.signOut()}
                className="w-full py-4 text-sm font-black text-red-500 bg-red-50 rounded-2xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={16} /> LOGOUT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
