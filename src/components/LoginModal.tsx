import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Role } from '../types';
import { Users, GraduationCap, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { getUsers, getModules, saveUser } from '../lib/localDb';

interface LoginModalProps {
  onLogin: (user: User) => void;
}

export default function LoginModal({ onLogin }: LoginModalProps) {
  const [role, setRole] = useState<Role | null>(null);

  // Mahasiswa fields
  const [name, setName] = useState('');
  const [nim, setNim] = useState('');
  const [kelas, setKelas] = useState('');
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);

  // Admin/Dosen fields
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClasses = () => {
      try {
        const modules = getModules();
        const classes = new Set<string>();
        modules.forEach(mod => {
          if (mod.classes && Array.isArray(mod.classes)) { 
             mod.classes.forEach(c => classes.add(c));
          }
        });
        setAvailableClasses(Array.from(classes));
      } catch (err) {
        console.error(err);
      }
    };
    fetchClasses();
  }, []);

  const handleLogin = async (e: import("react").FormEvent) => {
    e.preventDefault();

    if (role === 'mahasiswa' && (!name || !nim || !kelas)) {
      setError('Harap isi semua data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (role === 'mahasiswa') {
        const users = getUsers();
        const existingUser = users.find(u => u.nim === nim && u.role === 'mahasiswa');
        let uid = '';
        
        if (existingUser) {
          uid = existingUser.id;
        } else {
          uid = `mhs_${nim}_${Date.now()}`;
        }
        
        const userData: User = {
          id: uid,
          role: 'mahasiswa',
          name,
          nim,
          kelas,
          avatar: existingUser ? existingUser.avatar : undefined
        };
        
        saveUser(userData);
        onLogin(userData);
      } else {
        // Validation for Admin / Dosen
        if (!name) { 
          setError("Harap isi nama lengkap Anda.");
          setLoading(false);
          return;
        }

        if (role === 'admin' && verificationCode !== 'F1R6M6N6') {
          setError('Kode verifikasi keamanan Admin salah.');
          setLoading(false);
          return;
        }
        if (role === 'dosen' && verificationCode !== 'D0S3N26') {
          setError('Kode verifikasi keamanan Dosen salah.');
          setLoading(false);
          return;
        }

        let userRole: Role = role === 'admin' ? 'admin' : 'dosen';
        
        const users = getUsers();
        const existingUser = users.find(u => u.name === name && u.role === userRole);
        let uid = '';

        if (existingUser) {
          uid = existingUser.id;
        } else {
          uid = `${userRole}_${Date.now()}`;
        }
        
        const userData: User = {
          id: uid,
          role: userRole,
          name: name,
          avatar: existingUser ? existingUser.avatar : undefined
        };
        
        saveUser(userData);
        onLogin(userData);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat masuk.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 mix-blend-overlay"></div>
          <h2 className="relative z-10 text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">
            JAVA'S
          </h2>
          <p className="relative z-10 text-slate-400 mt-2">Portal Kuis 3D Interaktif</p>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {!role ? (
              <motion.div
                key="role-selection"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-slate-800 mb-6 text-center">Pilih Peran Anda</h3>
                
                <button
                  onClick={() => setRole('mahasiswa')}
                  className="w-full flex items-center p-4 border border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                >
                  <div className="bg-blue-100 p-3 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <span className="ml-4 font-semibold text-slate-700">Mahasiswa</span>
                  <ArrowRight className="ml-auto w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                </button>

                <button
                  onClick={() => setRole('dosen')}
                  className="w-full flex items-center p-4 border border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-colors group"
                >
                  <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="ml-4 font-semibold text-slate-700">Dosen</span>
                  <ArrowRight className="ml-auto w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                </button>

                <button
                  onClick={() => setRole('admin')}
                  className="w-full flex items-center p-4 border border-slate-200 rounded-2xl hover:border-purple-500 hover:bg-purple-50 transition-colors group"
                >
                  <div className="bg-purple-100 p-3 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="ml-4 font-semibold text-slate-700">Admin</span>
                  <ArrowRight className="ml-auto w-5 h-5 text-slate-400 group-hover:text-purple-500" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="flex items-center mb-6">
                  <button 
                    onClick={() => { setRole(null); setError(''); }}
                    className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    ← Kembali
                  </button>
                  <h3 className="ml-auto text-lg font-semibold text-slate-800 capitalize">
                    Login {role}
                  </h3>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                  {role === 'mahasiswa' ? (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Lengkap</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="Masukkan nama"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">NIM</label>
                        <input
                          type="text"
                          value={nim}
                          onChange={(e) => setNim(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="Masukkan NIM"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Rombel / Kelas</label>
                        <input
                          type="text"
                          list="class-options"
                          value={kelas}
                          onChange={(e) => setKelas(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="Masukkan atau pilih kelas"
                        />
                        <datalist id="class-options">
                          {availableClasses.map(c => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Lengkap</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder={`Masukkan nama ${role}`}
                        />
                      </div>
                      <div className="w-full mb-6 text-left">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Kode Verifikasi Keamanan</label>
                        <input
                          type="password"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                          placeholder={`Masukkan kode verifikasi ${role}`}
                        />
                      </div>
                    </>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 text-white font-semibold p-4 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-50 flex justify-center"
                  >
                    {loading ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Masuk'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <div className="fixed bottom-4 left-0 w-full text-center text-xs font-bold text-slate-400 uppercase tracking-widest pointer-events-none drop-shadow-sm">
        &copy; Property By Jawa X Java's Studios Company
      </div>
    </div>
  );
}
