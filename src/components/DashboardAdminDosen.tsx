import React, { useState } from 'react';
import { getModules, saveModule, deleteModule, getResults } from '../lib/localDb';
import SidebarDrawer from './SidebarDrawer';

interface Props {
  user: any;
  onLogout: () => void;
  onStartProjector: (module: any) => void;
}

const DashboardAdminDosen: React.FC<Props> = ({ user, onLogout, onStartProjector }) => {
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('java_quiz_active_user');
    return saved ? JSON.parse(saved) : (user || { name: 'firman', role: 'dosen', username: '1253040007', nim: '1253040007', class: 'pmh' });
  });

  const [activeTab, setActiveTab] = useState<'modules' | 'results'>('modules');
  const [modules, setModules] = useState<any[]>(getModules());
  const [results, setResults] = useState<any[]>(getResults());
  
  // State Input Pembuat Kuis AI
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [classes, setClasses] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sidebar Drawer (Garis Tiga ☰)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal State
  const [editingModule, setEditingModule] = useState<any | null>(null);
  const [viewQuestionsModule, setViewQuestionsModule] = useState<any | null>(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);

  const refreshData = () => {
    setModules(getModules());
    setResults(getResults());
  };

  const handleUpdateUser = (updatedData: any) => {
    setCurrentUser(updatedData);
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

  const handleQuestionTextChange = (qIndex: number, newText: string) => {
    if (!viewQuestionsModule) return;
    const updatedQuestions = [...viewQuestionsModule.questions];
    updatedQuestions[qIndex].question = newText;
    setViewQuestionsModule({ ...viewQuestionsModule, questions: updatedQuestions });
  };

  const handleOptionChange = (qIndex: number, optIndex: number, newText: string) => {
    if (!viewQuestionsModule) return;
    const updatedQuestions = [...viewQuestionsModule.questions];
    updatedQuestions[qIndex].options[optIndex] = newText;
    setViewQuestionsModule({ ...viewQuestionsModule, questions: updatedQuestions });
  };

  const handleExportExcel = () => {
    if (results.length === 0) {
      alert('Belum ada data nilai mahasiswa untuk diexport.');
      return;
    }
    const headers = [
      'Nama Mahasiswa', 'NIM', 'Kelas', 'Modul Kuis', 'Skor Akhir', 
      'Jawaban Benar', 'Jawaban Salah', 'Nomor Soal Salah', 'Indikasi Nyontek', 'Waktu Selesai'
    ];
    const rows = results.map((r: any) => {
      let wrongList = '-';
      if (Array.isArray(r.wrongQuestions) && r.wrongQuestions.length > 0) {
        wrongList = r.wrongQuestions.join('; ');
      } else if (Array.isArray(r.answersSummary)) {
        const wrongs = r.answersSummary.filter((a: any) => !a.isCorrect).map((a: any) => `No.${a.questionNumber}`);
        wrongList = wrongs.length > 0 ? wrongs.join('; ') : 'Tidak ada';
      }
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
    link.setAttribute('download', `Hasil_Kuis_Mahasiswa_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    if (!file || !title || !code || !classes) {
      setError('Harap isi semua field dan pilih file');
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

      const promptText = `Anda adalah pembuat kuis akademik profesional. Buat 10 soal pilihan ganda dari teks materi dokumen terlampir dalam format JSON Array murni:
[
  {
    "question": "pertanyaan",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0
  }
]
Ketentuan:
- Gunakan bahasa dan format yang sama persis dengan materi.
- correctAnswer berupa index integer (0, 1, 2, atau 3).`;

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
      setActiveTab('modules');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kendala pemrosesan AI.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Topbar Persis Video Asli */}
      <header className="border-b border-slate-800/80 bg-[#0c1220]/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Tombol ☰ yang Membuka SidebarDrawer Asli Proyek */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
            title="Pengaturan"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-wider text-cyan-400">JAVA'S</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              Panel Dosen
            </span>
          </div>
        </div>

        {/* Profil Mini Kanan Atas */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition"
          >
            <div className="text-right hidden sm:block">
              <span className="font-bold text-xs text-white block">{currentUser?.name || 'firman'}</span>
              <span className="block text-[10px] text-cyan-400 font-medium">
                {currentUser?.role === 'dosen' ? 'Dosen' : 'Mahasiswa'} • {currentUser?.class || 'pmh'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-sm font-bold text-cyan-400">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                currentUser?.name?.charAt(0)?.toUpperCase() || 'F'
              )}
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

      {/* Konten Dashboard */}
      <main className="max-w-6xl mx-auto w-full px-4 py-8 flex-1">
        <div className="flex justify-center mb-8">
          <div className="bg-[#0e1628] p-1 rounded-2xl border border-slate-800 flex gap-1">
            <button
              onClick={() => setActiveTab('modules')}
              className={`px-7 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === 'modules' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Modul
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-7 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === 'results' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hasil
            </button>
          </div>
        </div>

        {activeTab === 'modules' ? (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white">Manajemen Modul Kuis</h1>
              <p className="text-xs text-slate-400">Buat kuis baru atau atur modul yang sudah ada.</p>
            </div>

            {/* Form Generator AI */}
            <div className="max-w-xl mx-auto bg-[#0d1527]/80 border border-slate-800 rounded-2xl p-6 shadow-xl mb-10">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <span>📄</span> Buat Modul Baru dari Dokumen
              </h2>

              {error && (
                <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Judul Modul</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Contoh: Fikih Jinayah"
                      className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Kode Akses Kuis</label>
                    <input
                      type="text"
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      placeholder="Contoh: 1528"
                      className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Rombel / Kelas (Pisahkan koma)</label>
                  <input
                    type="text"
                    value={classes}
                    onChange={e => setClasses(e.target.value)}
                    placeholder="PMH, HES, AS"
                    className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Dokumen Materi (.pdf / .docx)</label>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 cursor-pointer"
                  />
                </div>

                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'AI Sedang Memproses...' : '⚡ Generate Soal Kuis (AI)'}
                </button>
              </div>
            </div>

            {/* List Modul Aktif */}
            <div>
              <h3 className="text-base font-bold text-white mb-4">Modul Aktif</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {modules.map(mod => (
                  <div key={mod.id} className="bg-[#0d1527]/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-mono font-bold">
                          Kode: {mod.code}
                        </span>
                        <span className="text-[11px] text-slate-400">{mod.questions?.length || 0} Soal • {mod.settings?.timePerQuestion || 30}s</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">{mod.title}</h4>
                      <p className="text-xs text-slate-400 mb-3">Kelas: {Array.isArray(mod.classes) ? mod.classes.join(', ') : mod.classes}</p>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => onStartProjector(mod)}
                        className="w-full py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-semibold border border-emerald-500/30 transition cursor-pointer"
                      >
                        Mulai Proyektor
                      </button>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setViewQuestionsModule(JSON.parse(JSON.stringify(mod)))}
                          className="py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs font-medium border border-indigo-500/20 transition cursor-pointer"
                        >
                          📝 Kunci
                        </button>
                        <button
                          onClick={() => openEditModal(mod)}
                          className="py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-medium border border-cyan-500/20 transition cursor-pointer"
                        >
                          ⚙️ Atur
                        </button>
                        <button
                          onClick={() => handleDeleteModule(mod.id)}
                          className="py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium border border-red-500/20 transition cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Tab Hasil */
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-white">Hasil & Nilai Mahasiswa</h1>
                <p className="text-xs text-slate-400">Daftar rekapan hasil pengerjaan kuis.</p>
              </div>
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-md transition cursor-pointer"
              >
                <span>📊</span> Export Excel / CSV
              </button>
            </div>

            <div className="overflow-x-auto bg-[#0d1527] border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#080d19] text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Nama Mahasiswa</th>
                    <th className="py-3 px-3">NIM</th>
                    <th className="py-3 px-3">Kelas</th>
                    <th className="py-3 px-3 text-center">Skor</th>
                    <th className="py-3 px-3 text-center">Benar/Salah</th>
                    <th className="py-3 px-3 text-center">Salah di No.</th>
                    <th className="py-3 px-3 text-center">Nyontek</th>
                    <th className="py-3 px-4 text-right">Waktu</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {results.map((res: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-semibold text-white">{res.studentName || res.name || '-'}</td>
                      <td className="py-3 px-3 text-slate-400">{res.nim || '-'}</td>
                      <td className="py-3 px-3 text-slate-400">{res.className || '-'}</td>
                      <td className="py-3 px-3 text-center font-bold text-cyan-400">{res.score ?? 0}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-emerald-400">{res.correctAnswers ?? 0}</span> / <span className="text-red-400">{res.wrongAnswers ?? 0}</span>
                      </td>
                      <td className="py-3 px-3 text-center text-red-400 font-mono">
                        {Array.isArray(res.wrongQuestions) && res.wrongQuestions.length > 0 ? res.wrongQuestions.join(', ') : '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {res.tabSwitchCount ? (
                          <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[10px]">
                            {res.tabSwitchCount}x Tab
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                            Aman
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                        {res.completedAt ? new Date(res.completedAt).toLocaleTimeString('id-ID') : '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedStudentDetail(res)}
                          className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[11px] hover:bg-cyan-500/20 transition cursor-pointer"
                        >
                          🔍 Periksa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Memanggil Komponen SidebarDrawer Asli Proyek */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
        onLogout={onLogout}
      />

      {/* Modal Edit Pengaturan Modul */}
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

      {/* Modal Bank Soal / Ubah Kunci */}
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
                      onChange={e => handleQuestionTextChange(qIdx, e.target.value)}
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
                          className="accent-emerald-500"
                        />
                        <span className="w-4 font-bold text-slate-400">{String.fromCharCode(65 + optIdx)}.</span>
                        <input
                          type="text"
                          value={opt}
                          onChange={e => handleOptionChange(qIdx, optIdx, e.target.value)}
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
