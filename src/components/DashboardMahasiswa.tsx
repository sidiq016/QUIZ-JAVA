import { useState, useEffect } from 'react';
import { User, QuizModule, QuizResult } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Play, GraduationCap, CheckCircle, XCircle, Bell, Clock, Search, Menu } from 'lucide-react';
import SidebarDrawer from './SidebarDrawer';
import { getModules, getResults, getUsers } from '../lib/localDb';

interface Props {
  user: User;
  onLogout: () => void;
  onStartGame: (module: QuizModule) => void;
}

export default function DashboardMahasiswa({ user: initialUser, onLogout, onStartGame }: Props) {
  const [user, setUser] = useState(initialUser);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeModule, setActiveModule] = useState<QuizModule | null>(null);
  const [myResults, setMyResults] = useState<QuizResult[]>([]);
  const [allModules, setAllModules] = useState<QuizModule[]>([]);
  const [notifications, setNotifications] = useState<{id: string, text: string, read: boolean, time: number}[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [newModuleNotification, setNewModuleNotification] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Keep user state updated if changed externally
    const u = getUsers().find(u => u.id === user.id);
    if (u) setUser(u);
  }, []);

  useEffect(() => {
    const fetchMahasiswaData = () => {
      const results = getResults().filter(r => r.studentId === user.id);
      setMyResults(results);
      
      const fetchedModules = getModules();
      
      setAllModules(prev => {
        if (prev.length > 0 && fetchedModules.length > prev.length) {
          // A new module was added!
          const newest = fetchedModules[fetchedModules.length - 1];
          const text = `Modul baru telah diunggah: ${newest.title}`;
          setNewModuleNotification(text);
          setTimeout(() => setNewModuleNotification(null), 5000);
          
          setNotifications(n => [{
            id: Math.random().toString(),
            text,
            read: false,
            time: Date.now()
          }, ...n]);
        }
        return fetchedModules;
      });
    };
    
    fetchMahasiswaData();
    const interval = setInterval(fetchMahasiswaData, 3000);
    return () => clearInterval(interval);
  }, [user.id]);

  const handleJoin = async (e: import("react").FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setLoading(true);
    setError('');

    try {
      const modules = getModules();
      const mod = modules.find(m => m.code === code.toUpperCase());
      
      if (mod) {
        // Check if student's class is allowed
        if (!mod.classes.includes('Semua') && !mod.classes.includes(user.kelas || '')) {
           setError('Kuis ini tidak tersedia untuk kelas Anda');
        } else {
           setActiveModule(mod);
        }
      } else {
        setError('Kode kuis tidak ditemukan');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 flex flex-col relative overflow-x-hidden">
      <SidebarDrawer 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        user={user} 
        onUpdateUser={setUser} 
      />

      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/20 rounded-full blur-[120px]" />

      <header className="relative z-20 flex items-center justify-between py-3 px-6 lg:px-12 border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-300">
            <Menu className="w-6 h-6" />
          </button>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight flex items-center gap-2">
            🚀 JAVA'S
          </h2>
        </div>
        <div className="flex items-center gap-6 relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) {
                setNotifications(notifications.map(n => ({...n, read: true})));
              }
            }}
            className="p-3 bg-white/10 hover:bg-white/20 text-slate-300 rounded-full transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0a0a0a]"></span>
            )}
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full right-16 mt-3 w-80 bg-[#151515] border border-white/10 shadow-2xl rounded-2xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-white/10 bg-white/5 text-left">
                  <h3 className="font-bold text-white">Notifikasi Terbaru</h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto text-left">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">Belum ada notifikasi</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-4 border-b border-white/5 text-sm ${!n.read ? 'bg-blue-500/10' : ''}`}>
                        <div className="text-slate-300 font-medium">{n.text}</div>
                        <div className="text-xs text-slate-500 mt-2 flex justify-between items-center">
                          {new Date(n.time).toLocaleTimeString()}
                          {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-right hidden sm:block">
            <div className="font-bold text-lg text-white">{user.name}</div>
            <div className="text-sm text-blue-400 font-medium">Mahasiswa Gen-Z • {user.kelas}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/20 overflow-hidden shrink-0 hidden sm:block">
            <img src={user.avatar ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.avatar}` : `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}`} alt="avatar" />
          </div>
          <button 
            onClick={onLogout}
            className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors text-red-400"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Real-time Notification Toast */}
      <AnimatePresence>
        {newModuleNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-indigo-500 to-purple-600 p-[2px] rounded-2xl shadow-2xl shadow-purple-500/50"
          >
            <div className="bg-slate-900 px-6 py-3 rounded-2xl flex items-center gap-3">
              <div className="bg-purple-500/20 p-2 rounded-full">
                <Bell className="w-5 h-5 text-purple-400 animate-bounce" />
              </div>
              <div className="font-semibold text-white tracking-wide">
                <span className="text-purple-400 mr-2">Update!</span>
                {newModuleNotification}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex-1 flex flex-col xl:flex-row gap-8 p-6 lg:p-12 max-w-[1400px] mx-auto w-full">
        {/* Left Col: Join / Active Module */}
        <div className="flex-1 max-w-xl">
          <AnimatePresence mode="wait">
            {!activeModule ? (
              <motion.div
                key="join-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Masuk ke Ruang Kuis</h1>
                <p className="text-slate-400 mb-8">Masukkan kode kuis yang diberikan oleh dosen Anda.</p>
                
                {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">{error}</div>}
                
                <form onSubmit={handleJoin} className="flex gap-4">
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: KUIS-123"
                    className="flex-1 bg-black/20 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-blue-500 text-lg uppercase tracking-wider font-mono"
                  />
                  <button
                    type="submit"
                    disabled={loading || !code}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-8 rounded-xl font-bold transition-colors"
                  >
                    {loading ? 'Mengecek...' : 'Gabung'}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="module-info"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 p-10 rounded-3xl shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Play className="w-48 h-48" />
                </div>
                <h2 className="text-sm font-bold text-emerald-400 tracking-wider uppercase mb-2">Modul Siap</h2>
                <h1 className="text-4xl font-bold mb-4">{activeModule.title}</h1>
                
                <div className="grid grid-cols-2 gap-4 mb-10 max-w-sm">
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="text-slate-400 text-sm mb-1">Jumlah Soal</div>
                    <div className="text-2xl font-bold">{activeModule.settings.questionCount}</div>
                  </div>
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="text-slate-400 text-sm mb-1">Waktu / Soal</div>
                    <div className="text-2xl font-bold">{activeModule.settings.timePerQuestion}s</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => onStartGame(activeModule)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-bold text-lg py-4 px-8 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Mulai 3D Kuis
                  </button>
                  <button
                    onClick={() => setActiveModule(null)}
                    className="px-6 py-4 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Module Gallery / List */}
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              📚 Daftar Modul Tersedia
            </h3>
            <div className="grid gap-3 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {allModules.length === 0 ? (
                <div className="text-slate-500 italic p-4 text-center bg-white/5 rounded-xl border border-white/5">
                  Belum ada modul yang diunggah.
                </div>
              ) : (
                allModules.map(mod => (
                  <div 
                    key={mod.id} 
                    onClick={() => {
                      setCode(mod.code);
                      setActiveModule(null);
                      setError('');
                    }}
                    className="bg-white/5 border border-white/10 hover:border-blue-500/50 p-4 rounded-xl cursor-pointer hover:bg-white/10 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{mod.title}</div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {mod.settings.questionCount} Soal</span>
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-slate-300">
                          {mod.classes.includes(user.kelas) ? '✅ Kelas Kamu' : '🔒 Kelas Lain'}
                        </span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Search className="w-4 h-4" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Result History */}
        <div className="w-full xl:w-96">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 h-full flex flex-col">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Riwayat Kuis Saya
            </h3>
            
            <div className="space-y-4">
              {myResults.length === 0 ? (
                <div className="text-slate-500 text-center py-8">Belum ada riwayat kuis.</div>
              ) : (
                myResults.map(r => (
                  <div key={r.id} className="bg-black/20 border border-white/5 p-4 rounded-2xl">
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-semibold text-sm text-slate-300">Skor Akhir</div>
                      <div className="text-2xl font-black text-white">{Math.round((r.score / (r.correctAnswers + r.wrongAnswers)) * 100 || 0)}</div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle className="w-4 h-4" /> {r.correctAnswers} Benar
                      </div>
                      <div className="flex items-center gap-1 text-red-400">
                        <XCircle className="w-4 h-4" /> {r.wrongAnswers} Salah
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 w-full py-4 text-center border-t border-white/5 bg-black/20 backdrop-blur-md">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pointer-events-none drop-shadow-sm">
          &copy; Property By Jawa X Java's Studios Company
        </p>
      </footer>
    </div>
  );
}
