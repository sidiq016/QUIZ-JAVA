import React, { useState } from 'react';
import { getModules, saveModule, deleteModule, getResults } from '../lib/localDb';

interface Props {
  user: any;
  onLogout: () => void;
  onStartProjector: (module: any) => void;
}

// 10 Karakter Bawaan Asli Proyek
const AVATARS = [
  { id: 'av-1', name: 'Karakter 1', icon: '👦' },
  { id: 'av-2', name: 'Karakter 2', icon: '👧' },
  { id: 'av-3', name: 'Karakter 3', icon: '👨‍🎓' },
  { id: 'av-4', name: 'Karakter 4', icon: '👩‍🎓' },
  { id: 'av-5', name: 'Karakter 5', icon: '🧑‍💼' },
  { id: 'av-6', name: 'Karakter 6', icon: '👩‍💼' },
  { id: 'av-7', name: 'Karakter 7', icon: '🧑‍💻' },
  { id: 'av-8', name: 'Karakter 8', icon: '🧑‍🏫' },
  { id: 'av-9', name: 'Karakter 9', icon: '🧓' },
  { id: 'av-10', name: 'Karakter 10', icon: '👵' },
];

const DashboardAdminDosen: React.FC<Props> = ({ user, onLogout, onStartProjector }) => {
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('java_quiz_active_user');
      return saved ? JSON.parse(saved) : (user || { name: 'firman', role: 'dosen', nim: '1253040007', class: 'pmh', avatarId: 'av-1' });
    } catch {
      return user || { name: 'firman', role: 'dosen', nim: '1253040007', class: 'pmh', avatarId: 'av-1' };
    }
  });

  const [modules, setModules] = useState<any[]>(() => {
    try { return getModules() || []; } catch { return []; }
  });
  const [results, setResults] = useState<any[]>(() => {
    try { return getResults() || []; } catch { return []; }
  });

  // State Input Pembuat Kuis AI
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [classes, setClasses] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State Drawer Pengaturan
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(currentUser?.name || 'firman');
  const [profileNim, setProfileNim] = useState(currentUser?.nim || '1253040007');
  const [profileClass, setProfileClass] = useState(currentUser?.class || 'pmh');
  const [selectedAvatarId, setSelectedAvatarId] = useState(currentUser?.avatarId || 'av-1');

  // Modal State
  const [editingModule, setEditingModule] = useState<any | null>(null);
  const [viewQuestionsModule, setViewQuestionsModule] = useState<any | null>(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);

  const refreshData = () => {
    try {
      setModules(getModules() || []);
      setResults(getResults() || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...currentUser,
      name: profileName,
      nim: profileNim,
      class: profileClass,
      avatarId: selectedAvatarId
    };
    setCurrentUser(updated);
    localStorage.setItem('java_quiz_active_user', JSON.stringify(updated));
    setIsEditingProfile(false);
  };

  const handleDeleteModule = (id: string) => {
    if (window.confirm('Hapus modul kuis ini?')) {
      deleteModule(id);
      refreshData();
    }
  };

  const openEditModal = (mod: any) => {
    setEditingModule({
      ...mod,
      classesStr: Array.isArray(mod.classes) ? mod.classes.join(', ') : (mod.classes || ''),
      settings: {
        questionCount: mod.settings?.questionCount ?? mod.questions?.length ?? 10,
        timePerQuestion: mod.settings?.timePerQuestion ?? 30,
        pointsCorrect: mod.settings?.pointsCorrect ?? 10,
        pointsWrong: mod.settings?.pointsWrong ?? 0,
        pointsUnanswered: mod.settings?.pointsUnanswered ?? 0,
        projectorMode: mod.settings?.projectorMode ?? false
      }
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule) return;
    const updated = {
      ...editingModule,
      classes: editingModule.classesStr.split(',').map((c: string) => c.trim()).filter(Boolean),
      settings: {
        ...editingModule.settings,
        questionCount: Number(editingModule.settings.questionCount),
        timePerQuestion: Number(editingModule.settings.timePerQuestion),
        pointsCorrect: Number(editingModule.settings.pointsCorrect),
        pointsWrong: Number(editingModule.settings.pointsWrong),
        pointsUnanswered: Number(editingModule.settings.pointsUnanswered)
      }
    };
    delete updated.classesStr;
    saveModule(updated);
    setEditingModule(null);
    refreshData();
  };

  const handleSaveQuestionsEdit = () => {
    if (!viewQuestionsModule) return;
    saveModule(viewQuestionsModule);
    setViewQuestionsModule(null);
    refreshData();
    alert('Kunci jawaban berhasil disimpan!');
  };

  const handleCorrectAnswerChange = (qIndex: number, newCorrectIdx: number) => {
    if (!viewQuestionsModule) return;
    const updatedQuestions = [...viewQuestionsModule.questions];
    updatedQuestions[qIndex].correctAnswer = newCorrectIdx;
    setViewQuestionsModule({ ...viewQuestionsModule, questions: updatedQuestions });
  };

  const handleExportExcel = () => {
    if (results.length === 0) {
      alert('Belum ada data nilai mahasiswa.');
      return;
    }
    const headers = ['Nama Mahasiswa', 'NIM', 'Kelas', 'Modul Kuis', 'Skor Akhir', 'Jawaban Benar', 'Jawaban Salah', 'Nomor Soal Salah', 'Indikasi Nyontek', 'Waktu Selesai'];
    const rows = results.map((r: any) => {
      const wrongList = Array.isArray(r.wrongQuestions) && r.wrongQuestions.length > 0 ? r.wrongQuestions.join('; ') : '-';
      const cheatStatus = (r.tabSwitchCount && r.tabSwitchCount > 0) ? `Terdeteksi (${r.tabSwitchCount}x Pindah Tab)` : (r.cheatingStatus || 'Aman');
      const completedTime = r.completedAt ? new Date(r.completedAt).toLocaleString('id-ID') : (r.timeFinished || '-');

      return [
        `"${r.studentName || '-'}"`, `"${r.nim || '-'}"`, `"${r.className || '-'}"`, `"${r.moduleTitle || '-'}"`,
        r.score ?? 0, r.correctAnswers ?? 0, r.wrongAnswers ?? (r.totalQuestions ? r.totalQuestions - (r.correctAnswers || 0) : 0),
        `"${wrongList}"`, `"${cheatStatus}"`, `"${completedTime}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Hasil_Kuis_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    if (!file || !title || !code || !classes) {
      setError('Harap isi semua field dan pilih file materi');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) throw new Error('API Key belum diatur di Vercel (VITE_GEMINI_API_KEY).');

      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = err => reject(err);
      });

      const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      const promptText = `Anda adalah pembuat kuis akademik. Buat 10 soal pilihan ganda dari teks dokumen terlampir dalam JSON Array murni:
[
  {
    "question": "pertanyaan",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0
  }
]
Ketentuan: correctAnswer berupa index integer 0, 1, 2, atau 3.`;

      const availableModels = ['gemini-3.6-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      let resData: any = null;
      let lastErrorMessage = '';

      for (const modelName of availableModels) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }, { inline_data: { mime_type: mimeType, data: base64Data } }] }],
              generationConfig: { responseMimeType: "application/json" }
            })
          });
          const data = await response.json().catch(() => null);
          if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            resData = data;
            break;
          } else {
            lastErrorMessage = data?.error?.message || `Gagal pada model ${modelName}`;
          }
        } catch (err: any) {
          lastErrorMessage = err.message || 'Koneksi error';
        }
      }

      if (!resData) throw new Error(lastErrorMessage || 'Gagal memanggil AI Gemini.');

      const questions = JSON.parse(resData.candidates[0].content.parts[0].text);
      if (!Array.isArray(questions) || questions.length === 0) throw new Error('AI tidak berhasil menyusun soal.');

      const newModule = {
        id: crypto.randomUUID(),
        title,
        code,
        classes: classes.split(',').map((c: string) => c.trim()),
        questions,
        settings: {
          questionCount: questions.length,
          timePerQuestion: 30,
          projectorMode: false,
          pointsCorrect: 10,
          pointsWrong: 0,
          pointsUnanswered: 0
        },
        createdBy: currentUser?.name || 'Dosen',
        createdAt: Date.now()
      };

      saveModule(newModule as any);
      setFile(null);
      setTitle('');
      setCode('');
      setClasses('');
      refreshData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kendala pemrosesan AI.');
    } finally {
      setLoading(false);
    }
  };

  const activeAvatar = AVATARS.find(a => a.id === selectedAvatarId) || AVATARS[0];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans select-none">
      {/* Topbar Persis Akun Mahasiswa */}
      <header className="border-b border-slate-800/80 bg-[#0c1220]/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-1.5 text-slate-400 hover:text-white transition cursor-pointer"
            title="Pengaturan"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl">🚀</span>
            <span className="text-xl font-black tracking-wider text-cyan-400">JAVA'S</span>
          </div>
        </div>

        {/* Profil Mini Kanan Atas */}
        <div className="flex items-center gap-4">
          <button className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm">
            🔔
          </button>
          <div
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition"
          >
            <div className="text-right hidden sm:block">
              <span className="font-bold text-xs text-white block leading-tight">{currentUser?.name || 'firman'}</span>
              <span className="text-[10px] text-cyan-400 font-medium leading-tight">
                {currentUser?.role === 'dosen' ? 'Dosen' : 'Mahasiswa'} • {currentUser?.class || 'pmh'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#0d172a] border border-cyan-500/40 flex items-center justify-center text-base shadow-sm">
              {activeAvatar.icon}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
            title="Keluar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Konten 2 Kolom Persis Halaman Mahasiswa */}
      <main className="max-w-7xl mx-auto w-full px-6 py-6 flex-1 grid lg:grid-cols-12 gap-6">
        
        {/* Kolom Kiri: Input Generator & Daftar Modul Tersedia */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Card Pembuat Kuis Dokumen (Menempati Posisi Masuk ke Ruang Kuis) */}
          <div className="bg-[#0e1628]/80 border border-slate-800/90 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-lg">
                🎓
              </div>
              <div>
                <h2 className="text-sm font-bold text-white leading-tight">Buat Modul Kuis (AI)</h2>
                <p className="text-[11px] text-slate-400 leading-tight">Unggah file dokumen materi untuk generate soal otomatis</p>
              </div>
            </div>

            {error && (
              <div className="p-2.5 mb-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[11px]">
                {error}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Judul Modul"
                  className="bg-[#070b14] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="Kode Kuis"
                  className="bg-[#070b14] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <input
                type="text"
                value={classes}
                onChange={e => setClasses(e.target.value)}
                placeholder="Rombel / Kelas (contoh: PMH 3A, HES)"
                className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className="w-full text-[11px] text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 cursor-pointer"
                />
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50 whitespace-nowrap cursor-pointer"
                >
                  {loading ? 'Proses...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>

          {/* Card Daftar Modul Tersedia */}
          <div className="bg-[#0e1628]/80 border border-slate-800/90 rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
              <span>📚</span> Daftar Modul Tersedia
            </h3>

            {modules.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                Belum ada modul yang dibuat.
              </div>
            ) : (
              <div className="space-y-2.5">
                {modules.map(mod => (
                  <div
                    key={mod.id}
                    className="p-3.5 bg-[#070b14] border border-slate-800/90 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{mod.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400">⏱ {mod.questions?.length || 0} Soal</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-medium">
                          Kode: {mod.code}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onStartProjector(mod)}
                        className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                        title="Mulai Proyektor"
                      >
                        ▶
                      </button>
                      <button
                        onClick={() => setViewQuestionsModule(JSON.parse(JSON.stringify(mod)))}
                        className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 flex items-center justify-center text-xs transition cursor-pointer"
                        title="Kunci Jawaban"
                      >
                        📝
                      </button>
                      <button
                        onClick={() => openEditModal(mod)}
                        className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 flex items-center justify-center text-xs transition cursor-pointer"
                        title="Atur Pengaturan"
                      >
                        ⚙️
                      </button>
                      <button
                        onClick={() => handleDeleteModule(mod.id)}
                        className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center text-xs transition cursor-pointer"
                        title="Hapus"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Rekap Hasil & Nilai (Menempati Posisi Riwayat Kuis Saya) */}
        <div className="lg:col-span-6">
          <div className="bg-[#0e1628]/80 border border-slate-800/90 rounded-2xl p-5 shadow-xl h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <span>📋</span> Rekap Nilai Mahasiswa
              </h3>
              <button
                onClick={handleExportExcel}
                className="px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer flex items-center gap-1.5"
              >
                <span>📊</span> Export CSV
              </button>
            </div>

            {results.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs py-12">
                Belum ada mahasiswa yang menyelesaikan kuis.
              </div>
            ) : (
              <div className="overflow-y-auto space-y-2 flex-1 max-h-[600px] pr-1 text-xs">
                {results.map((res: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#070b14] border border-slate-800/90 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{res.studentName || res.name || '-'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({res.nim || '-'})</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px]">
                        <span className="text-slate-400">Kelas: {res.className || '-'}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-emerald-400 font-semibold">{res.correctAnswers ?? 0} Benar</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-red-400 font-semibold">{res.wrongAnswers ?? 0} Salah</span>
                        {res.tabSwitchCount ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/10 text-red-400">
                            {res.tabSwitchCount}x Tab
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-cyan-400">{res.score ?? 0}</span>
                      <button
                        onClick={() => setSelectedStudentDetail(res)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-[11px] font-semibold border border-cyan-500/20 transition cursor-pointer"
                      >
                        Periksa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Footer Hak Cipta Persis Video */}
      <footer className="text-center py-4 text-[10px] text-slate-600 tracking-wider">
        © PROPERTY BY JAWA X JAVA'S STUDIOS COMPANY
      </footer>

      {/* DRAWER PENGATURAN KIRI PERSIS VIDEO */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-[#0c1424] border-r border-slate-800 text-slate-100 flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <span className="text-cyan-400 text-lg">⚙️</span>
                <span className="font-bold text-sm tracking-wide text-white">Pengaturan</span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-slate-400 hover:text-white text-lg p-1 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <span>👤</span> PROFIL & KARAKTER
              </div>

              {!isEditingProfile ? (
                /* Card Profil Tersimpan (Sesuai Video) */
                <div className="bg-[#111c33] border border-slate-800/90 rounded-2xl p-5 text-center shadow-lg">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-[#080d19] border-2 border-cyan-400 flex items-center justify-center text-4xl shadow-md shadow-cyan-500/20">
                    {activeAvatar.icon}
                  </div>
                  <h3 className="font-bold text-base text-white">{currentUser?.name || 'firman'}</h3>
                  <p className="text-xs text-slate-400 capitalize">{currentUser?.role || 'Dosen'}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    NIM: {currentUser?.nim || '1253040007'} • Kelas: {currentUser?.class || 'pmh'}
                  </p>

                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="mt-5 w-full py-2 rounded-xl text-xs font-semibold bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 border border-cyan-500/30 transition cursor-pointer"
                  >
                    Edit Profil
                  </button>
                </div>
              ) : (
                /* Form Edit Karakter & Biodata */
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-[#080d19] border-2 border-cyan-400 flex items-center justify-center text-4xl shadow-lg shadow-cyan-500/25">
                      {activeAvatar.icon}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1.5 font-medium">Pilih Karakter:</label>
                    <div className="grid grid-cols-5 gap-1.5 bg-[#080d19] p-2 rounded-xl border border-slate-800">
                      {AVATARS.map((av) => (
                        <button
                          type="button"
                          key={av.id}
                          onClick={() => setSelectedAvatarId(av.id)}
                          className={`h-9 rounded-lg flex items-center justify-center text-xl transition-all cursor-pointer ${
                            selectedAvatarId === av.id
                              ? 'bg-cyan-500/30 border border-cyan-400 scale-105 shadow-sm shadow-cyan-400'
                              : 'bg-slate-800/40 hover:bg-slate-800 border border-transparent'
                          }`}
                        >
                          {av.icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-1 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Nama</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={e => setProfileName(e.target.value)}
                        required
                        className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">NIM</label>
                      <input
                        type="text"
                        value={profileNim}
                        onChange={e => setProfileNim(e.target.value)}
                        required
                        className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Kelas</label>
                      <input
                        type="text"
                        value={profileClass}
                        onChange={e => setProfileClass(e.target.value)}
                        className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 py-2 rounded-xl text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition shadow-md shadow-cyan-500/20 cursor-pointer"
                    >
                      Simpan
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Modul */}
      {editingModule && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1527] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Edit Modul & Aturan Nilai</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Judul Modul</label>
                <input
                  type="text"
                  value={editingModule.title}
                  onChange={e => setEditingModule({ ...editingModule, title: e.target.value })}
                  className="w-full bg-[#080d19] border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Kode Ruang</label>
                <input
                  type="text"
                  value={editingModule.code}
                  onChange={e => setEditingModule({ ...editingModule, code: e.target.value })}
                  className="w-full bg-[#080d19] border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Rombel Kelas</label>
                <input
                  type="text"
                  value={editingModule.classesStr}
                  onChange={e => setEditingModule({ ...editingModule, classesStr: e.target.value })}
                  className="w-full bg-[#080d19] border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div>
                  <label className="block text-emerald-400 text-[10px] mb-1">Benar (+)</label>
                  <input
                    type="number"
                    value={editingModule.settings.pointsCorrect}
                    onChange={e => setEditingModule({
                      ...editingModule,
                      settings: { ...editingModule.settings, pointsCorrect: e.target.value }
                    })}
                    className="w-full bg-[#080d19] border border-slate-800 rounded-lg px-2 py-1 text-white text-center"
                  />
                </div>
                <div>
                  <label className="block text-red-400 text-[10px] mb-1">Salah (-)</label>
                  <input
                    type="number"
                    value={editingModule.settings.pointsWrong}
                    onChange={e => setEditingModule({
                      ...editingModule,
                      settings: { ...editingModule.settings, pointsWrong: e.target.value }
                    })}
                    className="w-full bg-[#080d19] border border-slate-800 rounded-lg px-2 py-1 text-white text-center"
                  />
                </div>
                <div>
                  <label className="block text-amber-400 text-[10px] mb-1">Kosong (0)</label>
                  <input
                    type="number"
                    value={editingModule.settings.pointsUnanswered}
                    onChange={e => setEditingModule({
                      ...editingModule,
                      settings: { ...editingModule.settings, pointsUnanswered: e.target.value }
                    })}
                    className="w-full bg-[#080d19] border border-slate-800 rounded-lg px-2 py-1 text-white text-center"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingModule(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Bank Soal */}
      {viewQuestionsModule && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1527] border border-slate-800 rounded-2xl w-full max-w-2xl p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="text-sm font-bold text-white">Bank Soal & Kunci Jawaban</h3>
              <button onClick={() => setViewQuestionsModule(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="overflow-y-auto pr-1 space-y-4 flex-1 text-xs">
              {viewQuestionsModule.questions?.map((q: any, qIdx: number) => (
                <div key={qIdx} className="p-3 bg-[#080d19] border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px]">
                      {qIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={q.question}
                      onChange={e => {
                        const qs = [...viewQuestionsModule.questions];
                        qs[qIdx].question = e.target.value;
                        setViewQuestionsModule({ ...viewQuestionsModule, questions: qs });
                      }}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div className="pl-7 space-y-1">
                    {q.options?.map((opt: string, optIdx: number) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`ans-${qIdx}`}
                          checked={q.correctAnswer === optIdx}
                          onChange={() => handleCorrectAnswerChange(qIdx, optIdx)}
                          className="accent-emerald-500 cursor-pointer"
                        />
                        <span className="w-4 font-bold text-slate-400">{String.fromCharCode(65 + optIdx)}.</span>
                        <input
                          type="text"
                          value={opt}
                          onChange={e => {
                            const qs = [...viewQuestionsModule.questions];
                            qs[qIdx].options[optIdx] = e.target.value;
                            setViewQuestionsModule({ ...viewQuestionsModule, questions: qs });
                          }}
                          className="flex-1 bg-transparent text-white border-b border-slate-800 focus:border-cyan-500 px-1 py-0.5"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-800 flex gap-2 mt-3">
              <button
                onClick={() => setViewQuestionsModule(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleSaveQuestionsEdit}
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                Simpan Perubahan Kunci
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Mahasiswa */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1527] border border-slate-800 rounded-2xl w-full max-w-xl p-6 max-h-[85vh] flex flex-col text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="font-bold text-white">Analisis Jawaban: {selectedStudentDetail.studentName || selectedStudentDetail.name}</h3>
              <button onClick={() => setSelectedStudentDetail(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {Array.isArray(selectedStudentDetail.answersSummary) ? (
                selectedStudentDetail.answersSummary.map((ans: any, i: number) => (
                  <div key={i} className={`p-2.5 rounded-xl border ${ans.isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Soal #{i + 1}</span>
                      <span className={ans.isCorrect ? 'text-emerald-400' : 'text-red-400'}>
                        {ans.isCorrect ? '✓ Benar' : '✗ Salah'}
                      </span>
                    </div>
                    <p className="text-slate-300 mb-1">{ans.questionText}</p>
                    <div className="text-[11px] text-slate-400">
                      Jawab: <span className={ans.isCorrect ? 'text-emerald-400' : 'text-red-400'}>{ans.selectedAnswerText || '-'}</span> | Kunci: <span className="text-emerald-400">{ans.correctAnswerText || '-'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-6">
                  {selectedStudentDetail.wrongQuestions?.length > 0 
                    ? `Salah di nomor: ${selectedStudentDetail.wrongQuestions.join(', ')}` 
                    : 'Tidak ada catatan salah.'}
                </p>
              )}
            </div>
            <div className="pt-3 border-t border-slate-800 text-right mt-2">
              <button onClick={() => setSelectedStudentDetail(null)} className="px-4 py-1.5 bg-slate-800 text-white rounded-xl">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAdminDosen;
