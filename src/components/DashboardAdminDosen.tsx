import { useState, useEffect } from 'react';
import { User, QuizModule, QuizResult } from '../types';
import { UploadCloud, FileText, CheckCircle, LogOut, Settings, PlayCircle, Users, Activity, Trash2, Edit3, Download, UserPlus, X, XCircle, Eye, Key, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import SidebarDrawer from './SidebarDrawer';
import { getUsers, getModules, getResults, saveModule, deleteModule, saveUser, deleteUser } from '../lib/localDb';

interface Props {
  user: User;
  onLogout: () => void;
}

export default function DashboardAdminDosen({ user: initialUser, onLogout }: Props) {
  const [user, setUser] = useState(initialUser);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'modules'|'results'|'users'>('modules');
  
  // Data state
  const [modules, setModules] = useState<QuizModule[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [classes, setClasses] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // User Management state
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState<Partial<User>>({});
  const [isEditingUser, setIsEditingUser] = useState(false);
  
  // Manual Module Creation State
  const [creationMode, setCreationMode] = useState<'ai' | 'manual'>('ai');
  const [manualTitle, setManualTitle] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [manualClasses, setManualClasses] = useState('');
  const [manualQuestions, setManualQuestions] = useState([{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  
  // Answer Key state
  const [viewingKeys, setViewingKeys] = useState<QuizModule | null>(null);
  
  // View Details State
  const [viewingResult, setViewingResult] = useState<QuizResult | null>(null);
  
  // Module Editing
  const [editingModule, setEditingModule] = useState<QuizModule | null>(null);
  
  // Deletion state
  const [deleteConfirm, setDeleteConfirm] = useState<{type: 'module' | 'user', id: string} | null>(null);

  useEffect(() => {
    const fetchData = () => {
      setModules(getModules());
      setResults(getResults());
      if (user.role === 'admin') {
        setUsersList(getUsers());
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [user.role]);

  const handleUpload = async () => {
    if (!file || !title || !code || !classes) {
      setError('Harap isi semua field dan pilih file');
      return;
    }
    setLoading(true); setError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('code', code);
    formData.append('classes', classes);
    formData.append('createdBy', user.name || user.username || '');

    try {
      const res = await fetch('/api/modules', { method: 'POST', body: formData });
      if (!res.ok) {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          setError(json.error || 'Gagal generate kuis');
        } catch {
          if (res.status === 413) setError('Ukuran file terlalu besar. Maksimal 1MB untuk keamanan.');
          else if (res.status === 504) setError('Koneksi terputus karena proses terlalu lama (Timeout).');
          else setError(`Terjadi kesalahan server (${res.status}): AI gagal memproses dokumen.`);
        }
        return;
      }
      const data = await res.json();
      if (data.success && data.module) {
        // Save to firestore
        saveModule(data.module);
        
        setFile(null); setTitle(''); setCode(''); setClasses('');
        setActiveTab('modules');
      } else {
        setError(data.error || 'Gagal generate kuis');
      }
    } catch (err: any) {
      setError('Terjadi kesalahan jaringan atau koneksi terputus.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualTitle || !manualCode || !manualClasses || manualQuestions.length === 0) {
      setError('Harap isi semua field judul, kode, kelas, dan minimal 1 pertanyaan');
      return;
    }
    
    // Validate questions
    for (let i = 0; i < manualQuestions.length; i++) {
      const q = manualQuestions[i];
      if (!q.question.trim()) {
        setError(`Pertanyaan ke-${i+1} belum diisi`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j].trim()) {
          setError(`Pilihan ${String.fromCharCode(65+j)} pada pertanyaan ke-${i+1} belum diisi`);
          return;
        }
      }
    }

    setLoading(true); setError('');
    try {
      const res = await fetch('/api/modules/manual', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manualTitle,
          code: manualCode,
          classes: manualClasses,
          createdBy: user.name || user.username || '',
          questions: manualQuestions
        })
      });
      const data = await res.json();
      if (data.success && data.module) {
        saveModule(data.module);
        
        setManualTitle(''); setManualCode(''); setManualClasses('');
        setManualQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
        setCreationMode('ai');
        setActiveTab('modules');
      } else {
        setError(data.error || 'Gagal menyimpan modul');
      }
    } catch (err: any) {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (modId: string, settings: any) => {
    const modules = getModules(); const m = modules.find(x => x.id === modId); if(m) { m.settings = settings; saveModule(m); }
  };

  const handleSaveModule = async (e: import("react").FormEvent) => {
    e.preventDefault();
    if (!editingModule) return;
    
    setLoading(true);
    try {
      saveModule(editingModule);
      setEditingModule(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteModuleHandler = async (modId: string) => {
    deleteModule(modId);
    setDeleteConfirm(null);
  };

  const handleDeleteUser = async (id: string) => {
    deleteUser(id);
    setDeleteConfirm(null);
  };

  const handleSaveUser = async (e: import("react").FormEvent) => {
    e.preventDefault();
    if (!userForm.role) return;
    
    setLoading(true);
    try {
      const userData = { ...userForm } as any;
      
      // Assign ID generated from email if it's dosen
      if (!userData.id) {
         userData.id = userData.email || crypto.randomUUID();
      }
      
      saveUser(userData as User);
      
      setShowUserModal(false);
      setUserForm({});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = results.map(r => ({
      'Nama Mahasiswa': r.studentName,
      'NIM': r.studentNim,
      'Kelas': r.studentKelas,
      'Skor Akhir': r.score,
      'Jawaban Benar': r.correctAnswers,
      'Jawaban Salah': r.wrongAnswers,
      'Indikasi Nyontek': r.cheatingFlags > 0 ? `${r.cheatingFlags}x Pindah Tab` : 'Aman',
      'Waktu Selesai': new Date(r.submittedAt).toLocaleString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hasil Kuis");
    
    // Auto adjust column widths
    const maxWidths = [25, 15, 15, 12, 15, 15, 20, 25];
    worksheet['!cols'] = maxWidths.map(w => ({ wch: w }));

    XLSX.writeFile(workbook, "Hasil_Kuis_Mahasiswa.xlsx");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 flex flex-col font-sans overflow-x-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

      {/* Header with Hamburger */}
      <header className="relative z-20 flex items-center justify-between p-6 lg:px-12 border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-300">
            <Menu className="w-6 h-6" />
          </button>
          <h2 className="text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight flex items-center gap-2">
            🚀 JAVA'S <span className="text-white font-medium text-lg ml-2 hidden sm:inline">Panel {user.role === 'admin' ? 'Admin' : 'Dosen'}</span>
          </h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{user.role}</div>
            <div className="font-bold text-emerald-400 text-lg capitalize">{user.name || user.username}</div>
          </div>
          <button 
            onClick={onLogout}
            className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors font-bold flex items-center gap-2"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <SidebarDrawer 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        user={user} 
        onUpdateUser={setUser} 
        allUsers={usersList}
      />
      
      {/* Sidebar Navigation Tabs (Horizontal for below header or integrated? The user requested 'filter' hidden/shown by hamburger. 
          Actually, I can just use a secondary horizontal tab bar here, or keep the tabs in the SidebarDrawer.
          Wait, I'll put a tab bar below the header. ) */}
      <div className="relative z-10 w-full flex justify-center mt-6 px-6">
        <div className="bg-white/5 border border-white/10 backdrop-blur-md p-1.5 rounded-2xl flex gap-1 overflow-x-auto w-full max-w-xl">
          <button 
            onClick={() => setActiveTab('modules')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${activeTab === 'modules' ? 'bg-white/10 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
          >
            <UploadCloud className="w-4 h-4" /> Modul
          </button>
          <button 
            onClick={() => setActiveTab('results')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${activeTab === 'results' ? 'bg-white/10 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
          >
            <Activity className="w-4 h-4" /> Hasil
          </button>
          {user.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${activeTab === 'users' ? 'bg-white/10 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
            >
              <Users className="w-4 h-4" /> Pengguna
            </button>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-6 lg:p-12 overflow-y-auto relative z-10 w-full">
        
        {activeTab === 'modules' && (
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white">Manajemen Modul Kuis</h1>
                <p className="text-slate-400 mt-2">Buat kuis baru atau atur modul yang sudah ada.</p>
              </div>
            </div>

            {/* Create New Form */}
            <div className="bg-white/5 p-8 rounded-3xl shadow-xl border border-white/10 mb-10 backdrop-blur-md">
              <div className="flex gap-4 mb-8 bg-white/5 p-1 rounded-xl w-max">
                <button 
                  onClick={() => setCreationMode('ai')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${creationMode === 'ai' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Buat Modul dari Dokumen (AI)
                </button>
                <button 
                  onClick={() => setCreationMode('manual')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${creationMode === 'manual' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Buat Modul Manual
                </button>
              </div>

              {creationMode === 'ai' ? (
                <>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white"><FileText className="text-blue-400"/> Buat Modul Baru dari Dokumen</h3>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-300">Judul Modul</label>
                      <input type="text" value={title} onChange={e=>setTitle(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 text-white rounded-xl placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors" placeholder="Contoh: Kuis Pertemuan 1" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-300">Kode Akses Kuis</label>
                      <input type="text" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} className="w-full p-3 bg-white/5 border border-white/10 text-white rounded-xl uppercase font-mono placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors" placeholder="KODE-123" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold mb-2 text-slate-300">Rombel / Kelas (Pisahkan dengan koma)</label>
                      <input type="text" value={classes} onChange={e=>setClasses(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 text-white rounded-xl placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors" placeholder="Contoh: TI 3A, TI 3B, Pmh 3 a" />
                    </div>
                  </div>
                  
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors mb-6 relative group">
                    <input type="file" onChange={e => setFile(e.target.files?.[0]||null)} accept=".pdf,.docx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    {file ? (
                      <div className="text-emerald-400 font-semibold flex items-center gap-2"><CheckCircle className="w-5 h-5"/> {file.name}</div>
                    ) : (
                      <>
                        <UploadCloud className="w-10 h-10 text-slate-500 mb-3 group-hover:text-blue-400 transition-colors" />
                        <div className="font-semibold text-slate-300">Klik atau drop file PDF/Word di sini</div>
                        <div className="text-sm text-slate-500 mt-1">Maksimal 30,000 karakter akan diproses AI</div>
                      </>
                    )}
                  </div>

                  {error && <div className="p-4 bg-red-500/20 text-red-300 border border-red-500/20 rounded-xl text-sm font-medium mb-6">{error}</div>}

                  <button onClick={handleUpload} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><PlayCircle/> Generate Soal Kuis (AI)</>}
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white"><Edit3 className="text-emerald-400"/> Buat Modul Manual</h3>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-300">Judul Modul</label>
                      <input type="text" value={manualTitle} onChange={e=>setManualTitle(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 text-white rounded-xl placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="Contoh: Kuis Harian" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-300">Kode Akses Kuis</label>
                      <input type="text" value={manualCode} onChange={e=>setManualCode(e.target.value.toUpperCase())} className="w-full p-3 bg-white/5 border border-white/10 text-white rounded-xl uppercase font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="KODE-123" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold mb-2 text-slate-300">Rombel / Kelas (Pisahkan dengan koma)</label>
                      <input type="text" value={manualClasses} onChange={e=>setManualClasses(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 text-white rounded-xl placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="Contoh: TI 3A, TI 3B" />
                    </div>
                  </div>

                  <div className="space-y-6 mb-6">
                    {manualQuestions.map((q, qIndex) => (
                      <div key={qIndex} className="bg-black/30 p-6 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-white">Soal {qIndex + 1}</h4>
                          {manualQuestions.length > 1 && (
                            <button onClick={() => setManualQuestions(mq => mq.filter((_, i) => i !== qIndex))} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
                              <Trash2 className="w-4 h-4"/> Hapus
                            </button>
                          )}
                        </div>
                        <textarea 
                          dir="auto"
                          value={q.question} 
                          onChange={(e) => {
                            const newQs = [...manualQuestions];
                            newQs[qIndex].question = e.target.value;
                            setManualQuestions(newQs);
                          }}
                          className="w-full p-3 bg-white/5 border border-white/10 text-white rounded-xl mb-4 placeholder:text-slate-500 min-h-[100px] focus:outline-none focus:border-emerald-500"
                          placeholder="Tuliskan soal pertanyaan di sini..."
                        />
                        <div className="grid md:grid-cols-2 gap-3">
                          {q.options.map((opt, oIndex) => (
                            <div key={oIndex} className="flex gap-2 items-center">
                              <button 
                                onClick={() => {
                                  const newQs = [...manualQuestions];
                                  newQs[qIndex].correctAnswer = oIndex;
                                  setManualQuestions(newQs);
                                }}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors shrink-0 ${q.correctAnswer === oIndex ? 'bg-emerald-500 text-white border-2 border-emerald-400' : 'bg-white/10 text-slate-400 hover:bg-white/20 border-2 border-transparent'}`}
                                title={`Jadikan pilihan ${String.fromCharCode(65 + oIndex)} sebagai jawaban benar`}
                              >
                                {String.fromCharCode(65 + oIndex)}
                              </button>
                              <input 
                                dir="auto"
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newQs = [...manualQuestions];
                                  newQs[qIndex].options[oIndex] = e.target.value;
                                  setManualQuestions(newQs);
                                }}
                                className={`flex-1 p-3 bg-white/5 border rounded-xl text-white ${q.correctAnswer === oIndex ? 'border-emerald-500/50' : 'border-white/10'} focus:outline-none focus:border-emerald-500`}
                                placeholder={`Pilihan ${String.fromCharCode(65 + oIndex)}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setManualQuestions(mq => [...mq, { question: '', options: ['', '', '', ''], correctAnswer: 0 }])}
                    className="w-full p-4 border-2 border-dashed border-white/20 text-slate-300 hover:text-white hover:border-white/40 hover:bg-white/5 rounded-2xl font-bold transition-colors mb-6 flex justify-center items-center gap-2"
                  >
                    <UserPlus className="w-5 h-5"/> Tambah Soal
                  </button>

                  {error && <div className="p-4 bg-red-500/20 text-red-300 border border-red-500/20 rounded-xl text-sm font-medium mb-6">{error}</div>}

                  <button 
                    onClick={handleManualSubmit} disabled={loading}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><CheckCircle className="w-6 h-6"/> Simpan & Tayangkan Modul</>}
                  </button>
                </>
              )}
            </div>

            {/* Existing Modules */}
            <h3 className="text-xl font-bold mb-6 text-white">Modul Aktif</h3>
            <div className="grid gap-6">
              {modules.map(mod => (
                <div key={mod.id} className="bg-white/5 p-6 rounded-3xl shadow-xl border border-white/10 flex flex-col md:flex-row gap-6 backdrop-blur-md">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        {editingModule?.id === mod.id ? (
                          <input type="text" value={editingModule.title} onChange={e => setEditingModule({...editingModule, title: e.target.value})} className="w-full p-2 bg-white/10 text-white rounded border border-white/20 mb-2" />
                        ) : (
                          <h4 className="text-xl font-bold text-white">{mod.title}</h4>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-sm">
                          {editingModule?.id === mod.id ? (
                            <input type="text" value={editingModule.code} onChange={e => setEditingModule({...editingModule, code: e.target.value.toUpperCase()})} className="w-24 p-1 bg-white/10 text-white rounded border border-white/20 uppercase font-mono" />
                          ) : (
                            <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-lg font-mono font-bold border border-blue-500/30">{mod.code}</span>
                          )}
                          
                          {editingModule?.id === mod.id ? (
                            <input type="text" value={editingModule.classes.join(', ')} onChange={e => setEditingModule({...editingModule, classes: e.target.value.split(',').map(c=>c.trim())})} className="w-48 p-1 bg-white/10 text-white rounded border border-white/20" />
                          ) : (
                            <span className="text-slate-400">Kelas: {mod.classes.join(', ')}</span>
                          )}
                        </div>
                      </div>
                      {user.role === 'admin' && (
                        <div className="flex items-center gap-2">
                          {editingModule?.id === mod.id ? (
                            <button onClick={handleSaveModule} className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"><CheckCircle className="w-5 h-5"/></button>
                          ) : (
                            <button onClick={() => setEditingModule(mod)} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"><Edit3 className="w-5 h-5"/></button>
                          )}
                          <button onClick={() => setDeleteConfirm({ type: 'module', id: mod.id })} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 className="w-5 h-5"/></button>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 text-sm text-slate-500 flex gap-4">
                      <span>Total Soal Asli: {mod.questions.length}</span>
                      <span>Dibuat oleh: {mod.createdBy}</span>
                    </div>
                    <div className="mt-4">
                      <button 
                        onClick={() => setViewingKeys(mod)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 text-slate-300 font-semibold rounded-lg hover:bg-white/10 hover:text-white transition-colors border border-white/10"
                      >
                        <Eye className="w-4 h-4" /> Lihat Kunci Jawaban
                      </button>
                    </div>
                  </div>
                  <div className="w-full md:w-72 bg-black/20 p-4 rounded-2xl border border-white/5">
                    <h5 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-1"><Settings className="w-3 h-3"/> Pengaturan Kuis</h5>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-400">Tampilkan Soal:</span>
                        <input type="number" min="1" max={mod.questions.length} value={mod.settings.questionCount} onChange={e => updateSettings(mod.id, {...mod.settings, questionCount: Number(e.target.value)})} className="w-16 p-1 text-center border border-white/10 rounded bg-white/5 text-white" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-400">Waktu/Soal (dtk):</span>
                        <input type="number" min="5" value={mod.settings.timePerQuestion} onChange={e => updateSettings(mod.id, {...mod.settings, timePerQuestion: Number(e.target.value)})} className="w-16 p-1 text-center border border-white/10 rounded bg-white/5 text-white" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-emerald-400">Poin Jika Benar:</span>
                        <input type="number" value={mod.settings.pointsCorrect ?? 10} onChange={e => updateSettings(mod.id, {...mod.settings, pointsCorrect: Number(e.target.value)})} className="w-16 p-1 text-center border border-emerald-500/30 rounded bg-emerald-500/10 text-emerald-400 font-bold" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-red-400">Poin Jika Salah:</span>
                        <input type="number" value={mod.settings.pointsWrong ?? 0} onChange={e => updateSettings(mod.id, {...mod.settings, pointsWrong: Number(e.target.value)})} className="w-16 p-1 text-center border border-red-500/30 rounded bg-red-500/10 text-red-400 font-bold" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-white">Statistik Hasil & Anti-Cheat</h1>
              
              <button 
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Download className="w-5 h-5" />
                Export Data ke Excel
              </button>
            </div>
            
            <div className="bg-white/5 rounded-3xl shadow-xl border border-white/10 overflow-hidden backdrop-blur-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-sm text-slate-400 uppercase tracking-wider border-b border-white/10">
                    <th className="p-4 font-bold">Mahasiswa</th>
                    <th className="p-4 font-bold">Kelas</th>
                    <th className="p-4 font-bold">Skor</th>
                    <th className="p-4 font-bold">Benar / Salah</th>
                    <th className="p-4 font-bold">Indikasi Nyontek (Tab)</th>
                    <th className="p-4 font-bold">Waktu Kumpul</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {results.map(r => (
                    <tr key={r.id} onClick={() => setViewingResult(r)} className="hover:bg-white/10 transition-colors cursor-pointer group">
                      <td className="p-4">
                        <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{r.studentName}</div>
                        <div className="text-xs text-slate-400">{r.studentNim}</div>
                      </td>
                      <td className="p-4 font-medium text-slate-300">{r.studentKelas}</td>
                      <td className="p-4 font-black text-xl text-emerald-400">{r.score}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-emerald-400 font-bold">{r.correctAnswers}</span> / 
                          <span className="text-red-400">{r.wrongAnswers}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {r.cheatingFlags > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-red-500/20 border border-red-500/30 text-red-400 px-3 py-1 rounded-full text-xs font-bold">
                            <Activity className="w-3 h-3" /> {r.cheatingFlags}x Pindah Tab
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-medium text-sm">Aman</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-400 flex justify-between items-center">
                        {new Date(r.submittedAt).toLocaleString()}
                        <Eye className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                      </td>
                    </tr>
                  ))}
                  {results.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">Belum ada data hasil kuis.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && user.role === 'admin' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-white">Manajemen Pengguna</h1>
              <button 
                onClick={() => { setIsEditingUser(false); setUserForm({ role: 'mahasiswa' }); setShowUserModal(true); }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <UserPlus className="w-5 h-5" />
                Tambah Anggota Baru
              </button>
            </div>
            
            <div className="grid gap-4">
              {usersList.map(u => (
                <div key={u.id} className="bg-white/5 p-4 rounded-2xl shadow-xl border border-white/10 flex justify-between items-center backdrop-blur-md">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white overflow-hidden bg-white/10 shrink-0 border border-white/20">
                      <img src={u.avatar ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.avatar}` : `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.id}`} alt="avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-bold text-white">{u.name || u.username}</div>
                      <div className="text-sm text-slate-400 capitalize">{u.role} {u.nim ? `• ${u.nim}` : ''} {u.kelas ? `• ${u.kelas}` : ''}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setIsEditingUser(true); setUserForm(u); setShowUserModal(true); }}
                      className="p-2 bg-white/5 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"
                      title="Edit Pengguna"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm({ type: 'user', id: u.id })}
                      className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                      title="Hapus Pengguna"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#0f0f0f] border border-white/10 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-500/30">
                  <Trash2 className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="font-bold text-xl text-white mb-2">Konfirmasi Hapus</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Apakah Anda yakin ingin menghapus {deleteConfirm.type === 'module' ? 'modul' : 'pengguna'} ini? Data yang dihapus tidak dapat dikembalikan.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors">
                    Batal
                  </button>
                  <button 
                    onClick={() => deleteConfirm.type === 'module' ? deleteModuleHandler(deleteConfirm.id) : handleDeleteUser(deleteConfirm.id)} 
                    className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {viewingKeys && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 py-10"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#0f0f0f] border border-white/10 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-full"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                <h3 className="font-bold text-xl flex items-center gap-2 text-white">
                  <Key className="w-5 h-5 text-blue-400" /> 
                  Kunci Jawaban: {viewingKeys.title}
                </h3>
                <button onClick={() => setViewingKeys(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6">
                {viewingKeys.questions.map((q, i) => (
                  <div key={i} className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <h4 dir="auto" className="font-bold text-white mb-4">{i + 1}. {q.question}</h4>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      {q.options.map((opt, optIdx) => (
                        <div 
                          key={optIdx} 
                          className={`p-3 rounded-xl flex items-center gap-2 ${optIdx === q.correctAnswer ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30' : 'bg-white/5 border border-white/10 text-slate-300'}`}
                        >
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${optIdx === q.correctAnswer ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <span dir="auto" className="flex-1">{opt}</span>
                          {optIdx === q.correctAnswer && <CheckCircle className="w-4 h-4 shrink-0 ml-auto text-emerald-400" />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {viewingResult && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 py-10"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#0f0f0f] border border-white/10 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-full"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                <h3 className="font-bold text-xl flex items-center gap-2 text-white">
                  <Activity className="w-5 h-5 text-emerald-400" /> 
                  Detail Jawaban: {viewingResult.studentName}
                </h3>
                <button onClick={() => setViewingResult(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6">
                {!viewingResult.details || viewingResult.details.length === 0 ? (
                  <div className="text-center text-slate-400 italic">Detail jawaban tidak tersedia.</div>
                ) : (
                  viewingResult.details.map((detail, idx) => {
                    const mod = modules.find(m => m.id === viewingResult.moduleId);
                    const q = mod?.questions[detail.questionIdx];
                    if (!q) return null;
                    const isCorrect = detail.selectedIdx === detail.correctIdx;
                    return (
                      <div key={idx} className={`bg-white/5 rounded-2xl p-5 border ${isCorrect ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <h4 dir="auto" className="font-bold text-white flex-1">{idx + 1}. {q.question}</h4>
                          {isCorrect ? <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 ml-4" /> : <XCircle className="w-6 h-6 text-red-400 shrink-0 ml-4" />}
                        </div>
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          {q.options.map((opt, optIdx) => {
                            let style = 'bg-white/5 border border-white/10 text-slate-400';
                            let badge = null;
                            if (optIdx === detail.correctIdx) {
                              style = 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30';
                              badge = <CheckCircle className="w-4 h-4 shrink-0 ml-auto text-emerald-400" />;
                            } else if (optIdx === detail.selectedIdx) {
                              style = 'bg-red-500/20 text-red-400 font-bold border border-red-500/30';
                              badge = <XCircle className="w-4 h-4 shrink-0 ml-auto text-red-400" />;
                            }
                            return (
                              <div key={optIdx} className={`p-3 rounded-xl flex items-center gap-2 ${style}`}>
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${optIdx === detail.correctIdx ? 'bg-emerald-500 text-white' : optIdx === detail.selectedIdx ? 'bg-red-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </div>
                                <span dir="auto" className="flex-1">{opt}</span>
                                {badge}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showUserModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#0f0f0f] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="font-bold text-xl text-white">{isEditingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
                <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-300">Peran (Role)</label>
                  <select 
                    value={userForm.role || ''} 
                    onChange={e => setUserForm({...userForm, role: e.target.value as any})}
                    className="w-full p-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    <option value="mahasiswa">Mahasiswa</option>
                    <option value="dosen">Dosen</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-300">Nama Lengkap</label>
                  <input type="text" value={userForm.name || ''} onChange={e=>setUserForm({...userForm, name: e.target.value})} className="w-full p-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500" required />
                </div>

                {userForm.role === 'mahasiswa' ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-300">NIM</label>
                      <input type="text" value={userForm.nim || ''} onChange={e=>setUserForm({...userForm, nim: e.target.value})} className="w-full p-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-300">Kelas / Rombel</label>
                      <input type="text" value={userForm.kelas || ''} onChange={e=>setUserForm({...userForm, kelas: e.target.value})} className="w-full p-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500" required />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-300">Username (Login)</label>
                      <input type="text" value={userForm.username || ''} onChange={e=>setUserForm({...userForm, username: e.target.value})} className="w-full p-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-300">Password</label>
                      <input type="text" value={userForm.password || ''} onChange={e=>setUserForm({...userForm, password: e.target.value})} className="w-full p-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500" placeholder={isEditingUser ? '(Biarkan kosong jika tidak diubah)' : ''} required={!isEditingUser} />
                    </div>
                  </>
                )}

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors">Batal</button>
                  <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
                    {loading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
