import React, { useState } from 'react';
import { getModules, saveModule, deleteModule, getResults } from '../lib/localDb';

interface Props {
  user: any;
  onLogout: () => void;
  onStartProjector: (module: any) => void;
}

const DashboardAdminDosen: React.FC<Props> = ({ user, onLogout, onStartProjector }) => {
  const [activeTab, setActiveTab] = useState<'modules' | 'results'>('modules');
  const [modules, setModules] = useState<any[]>(getModules());
  const [results, setResults] = useState<any[]>(getResults());
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [classes, setClasses] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal State
  const [editingModule, setEditingModule] = useState<any | null>(null);
  const [viewQuestionsModule, setViewQuestionsModule] = useState<any | null>(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);

  const refreshData = () => {
    setModules(getModules());
    setResults(getResults());
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

    const updatedModule = {
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
    delete updatedModule.classesStr;

    saveModule(updatedModule);
    setEditingModule(null);
    refreshData();
  };

  const handleSaveQuestionsEdit = () => {
    if (!viewQuestionsModule) return;
    saveModule(viewQuestionsModule);
    setViewQuestionsModule(null);
    refreshData();
    alert('Kunci jawaban dan daftar soal berhasil diperbarui!');
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
      alert('Belum ada data pengerjaan mahasiswa untuk diexport.');
      return;
    }

    const headers = [
      'Nama Mahasiswa',
      'NIM',
      'Kelas',
      'Modul Kuis',
      'Skor Akhir',
      'Jawaban Benar',
      'Jawaban Salah',
      'Nomor Soal Salah',
      'Indikasi Nyontek',
      'Waktu Selesai'
    ];

    const rows = results.map((r: any) => {
      let wrongList = '-';
      if (Array.isArray(r.wrongQuestions) && r.wrongQuestions.length > 0) {
        wrongList = r.wrongQuestions.join('; ');
      } else if (Array.isArray(r.answersSummary)) {
        const wrongs = r.answersSummary.filter((a: any) => !a.isCorrect).map((a: any) => `No.${a.questionNumber}`);
        wrongList = wrongs.length > 0 ? wrongs.join('; ') : 'Tidak ada';
      }

      const cheatStatus = (r.tabSwitchCount && r.tabSwitchCount > 0)
        ? `Terdeteksi (${r.tabSwitchCount}x Keluar Tab)` 
        : (r.cheatingStatus || 'Aman');

      const completedTime = r.completedAt 
        ? new Date(r.completedAt).toLocaleString('id-ID') 
        : (r.timeFinished || '-');

      return [
        `"${r.studentName || '-'}"`,
        `"${r.nim || '-'}"`,
        `"${r.className || '-'}"`,
        `"${r.moduleTitle || '-'}"`,
        r.score ?? 0,
        r.correctAnswers ?? 0,
        r.wrongAnswers ?? (r.totalQuestions ? r.totalQuestions - (r.correctAnswers || 0) : 0),
        `"${wrongList}"`,
        `"${cheatStatus}"`,
        `"${completedTime}"`
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
      if (!apiKey) {
        throw new Error('API Key belum terbaca. Pastikan VITE_GEMINI_API_KEY sudah disetel di Vercel.');
      }

      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const res = reader.result as string;
          resolve(res.split(',')[1]);
        };
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
- Gunakan bahasa dan aksara yang persis sama dengan materi.
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
              contents: [
                {
                  parts: [
                    { text: promptText },
                    { inline_data: { mime_type: mimeType, data: base64Data } }
                  ]
                }
              ],
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

      if (!resData) {
        throw new Error(lastErrorMessage || 'Gagal memanggil layanan Gemini AI.');
      }

      const rawJson = resData.candidates[0].content.parts[0].text;
      const questions = JSON.parse(rawJson);

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('AI tidak berhasil menyusun format soal.');
      }

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
        createdBy: user?.name || user?.username || 'Dosen',
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
      setError(err.message || 'Terjadi kesalahan saat memproses materi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Glow Ambient Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-b from-cyan-600/10 via-indigo-600/5 to-transparent blur-3xl opacity-70"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-[#0c1220]/70 backdrop-blur-md px-6 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 p-[1px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#090e1a] rounded-[11px] flex items-center justify-center font-black text-cyan-400 text-sm">
                J3D
              </div>
            </div>
            <div>
              <span className="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                JAVA'S
              </span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60">
                Panel Dosen & Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="block text-[10px] font-semibold text-slate-500 tracking-wider uppercase">Pengguna Aktif</span>
              <span className="font-semibold text-xs text-emerald-400">{user?.name || 'Firman'}</span>
            </div>
            <button
              onClick={onLogout}
              className="px-3.5 py-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-all duration-200 border border-red-500/20 hover:scale-105 active:scale-95 cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-[#0e1628]/90 p-1 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md flex gap-1.5">
            <button
              onClick={() => setActiveTab('modules')}
              className={`px-7 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'modules'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              📚 Modul Kuis
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-7 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'results'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              📊 Hasil Mahasiswa
            </button>
          </div>
        </div>

        {activeTab === 'modules' ? (
          <div className="space-y-10 animate-fade-in">
            {/* Header Title */}
            <div className="text-center max-w-lg mx-auto">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                Manajemen Modul Kuis
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Unggah bahan ajar untuk generate soal AI instan atau modifikasi modul kuis yang sudah dibuat.
              </p>
            </div>

            {/* AI Generator Card */}
            <div className="max-w-2xl mx-auto bg-[#0d1527]/70 border border-slate-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl hover:border-slate-700/80 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/60">
                <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 text-lg">📄</span>
                <div>
                  <h2 className="text-base font-bold text-white">Buat Modul Otomatis (Gemini AI)</h2>
                  <p className="text-xs text-slate-400">Ekstraksi 10 soal pilihan ganda langsung dari file dokumen.</p>
                </div>
              </div>

              {error && (
                <div className="p-3.5 mb-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Judul Modul</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Contoh: Fikih Jinayah"
                      className="w-full bg-[#080d19]/90 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kode Akses Masuk Ruang</label>
                    <input
                      type="text"
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      placeholder="Contoh: 1528"
                      className="w-full bg-[#080d19]/90 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Rombel / Kelas (Pisahkan koma)</label>
                  <input
                    type="text"
                    value={classes}
                    onChange={e => setClasses(e.target.value)}
                    placeholder="PMH, HES, AS"
                    className="w-full bg-[#080d19]/90 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Dokumen Materi (.pdf / .docx)</label>
                  <div className="relative border border-dashed border-slate-700 hover:border-cyan-500/50 rounded-2xl p-3 sm:p-4 bg-[#080d19]/60 transition-all duration-200 flex items-center">
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={e => setFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 cursor-pointer transition-all duration-200"
                    />
                  </div>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="w-full mt-2 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>AI Sedang Menelaah Materi & Membuat Kuis...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      <span>Generate Soal Kuis (AI)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Active Modules Section */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>📂</span> Modul Aktif ({modules.length})
                </h3>
              </div>

              {modules.length === 0 ? (
                <div className="p-12 text-center bg-[#0d1527]/50 border border-slate-800/80 rounded-3xl text-slate-400 text-xs sm:text-sm backdrop-blur-sm">
                  Belum ada modul kuis. Silakan unggah dokumen materi di atas untuk membuat modul baru.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {modules.map(mod => (
                    <div
                      key={mod.id}
                      className="group bg-[#0d1527]/70 hover:bg-[#0e172c]/90 border border-slate-800/90 hover:border-cyan-500/40 rounded-3xl p-5 sm:p-6 backdrop-blur-sm shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-3 py-1 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold font-mono">
                            KODE: {mod.code}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {mod.settings?.questionCount || mod.questions?.length || 0} Soal • {mod.settings?.timePerQuestion || 30}s
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors duration-200 mb-1 line-clamp-1">
                          {mod.title}
                        </h4>
                        <p className="text-xs text-slate-400 mb-4">
                          Kelas: <span className="text-slate-300 font-medium">{Array.isArray(mod.classes) ? mod.classes.join(', ') : mod.classes}</span>
                        </p>

                        <div className="flex items-center justify-between text-[11px] bg-[#070b14]/80 p-2.5 rounded-xl border border-slate-800/60 mb-5">
                          <span className="text-emerald-400 font-semibold">+{mod.settings?.pointsCorrect ?? 10} Benar</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-red-400 font-semibold">-{Math.abs(mod.settings?.pointsWrong ?? 0)} Salah</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-amber-400 font-semibold">{mod.settings?.pointsUnanswered ?? 0} Kosong</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => onStartProjector(mod)}
                          className="w-full py-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-bold transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>📺</span> Mulai Proyektor
                        </button>

                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setViewQuestionsModule(JSON.parse(JSON.stringify(mod)))}
                            className="py-2 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer text-center"
                            title="Lihat & Ubah Kunci Jawaban"
                          >
                            📝 Kunci
                          </button>
                          <button
                            onClick={() => openEditModal(mod)}
                            className="py-2 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer text-center"
                            title="Edit Pengaturan Modul"
                          >
                            ⚙️ Atur
                          </button>
                          <button
                            onClick={() => handleDeleteModule(mod.id)}
                            className="py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer text-center"
                            title="Hapus Modul"
                          >
                            🗑️ Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Results Tab */
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d1527]/70 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">Hasil & Nilai Mahasiswa</h1>
                <p className="text-xs sm:text-sm text-slate-400">Rekap nilai, analisis pengerjaan, dan deteksi kecurangan.</p>
              </div>
              <button
                onClick={handleExportExcel}
                className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer w-full sm:w-auto"
              >
                <span>📊</span> Export Excel (.CSV)
              </button>
            </div>

            {results.length === 0 ? (
              <div className="p-12 text-center bg-[#0d1527]/50 border border-slate-800/80 rounded-3xl text-slate-400 text-xs sm:text-sm backdrop-blur-sm">
                Belum ada mahasiswa yang menyelesaikan kuis.
              </div>
            ) : (
              <div className="overflow-x-auto bg-[#0d1527]/70 border border-slate-800/80 rounded-3xl shadow-2xl backdrop-blur-md">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#080d19]/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-4 px-5">Nama Mahasiswa</th>
                      <th className="py-4 px-4">NIM</th>
                      <th className="py-4 px-4">Kelas</th>
                      <th className="py-4 px-4 text-center">Skor</th>
                      <th className="py-4 px-4 text-center">Benar / Salah</th>
                      <th className="py-4 px-4 text-center">Salah di No.</th>
                      <th className="py-4 px-4 text-center">Status Nyontek</th>
                      <th className="py-4 px-5 text-right">Waktu Selesai</th>
                      <th className="py-4 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {results.map((res: any, idx: number) => {
                      let wrongNumbers = '-';
                      if (Array.isArray(res.wrongQuestions) && res.wrongQuestions.length > 0) {
                        wrongNumbers = res.wrongQuestions.join(', ');
                      } else if (Array.isArray(res.answersSummary)) {
                        const wrongs = res.answersSummary.filter((a: any) => !a.isCorrect).map((a: any) => `No.${a.questionNumber}`);
                        wrongNumbers = wrongs.length > 0 ? wrongs.join(', ') : 'Tidak ada';
                      }

                      const isCheating = (res.tabSwitchCount && res.tabSwitchCount > 0) || res.cheatingStatus === 'Nyontek';

                      return (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors duration-150">
                          <td className="py-3.5 px-5 font-semibold text-white">{res.studentName || res.name || '-'}</td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">{res.nim || '-'}</td>
                          <td className="py-3.5 px-4 text-slate-400 text-xs">{res.className || '-'}</td>
                          <td className="py-3.5 px-4 text-center font-black text-sm text-cyan-400">{res.score ?? 0}</td>
                          <td className="py-3.5 px-4 text-center text-xs">
                            <span className="text-emerald-400 font-semibold">{res.correctAnswers ?? 0}</span>
                            <span className="text-slate-500"> / </span>
                            <span className="text-red-400 font-semibold">
                              {res.wrongAnswers ?? (res.totalQuestions ? res.totalQuestions - (res.correctAnswers || 0) : 0)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center text-xs text-red-400 font-mono font-medium">
                            {wrongNumbers}
                          </td>
                          <td className="py-3.5 px-4 text-center text-xs">
                            {isCheating ? (
                              <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                                ⚠️ {res.tabSwitchCount ? `${res.tabSwitchCount}x Pindah Tab` : 'Terdeteksi'}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                                ✓ Aman
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-right text-xs text-slate-400">
                            {res.completedAt ? new Date(res.completedAt).toLocaleString('id-ID') : (res.timeFinished || '-')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => setSelectedStudentDetail(res)}
                              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-semibold border border-cyan-500/20 transition-all duration-200 active:scale-95 cursor-pointer"
                            >
                              🔍 Periksa
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* POPUP 1: BANK SOAL & RUBAH KUNCI JAWABAN */}
      {viewQuestionsModule && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto transition-opacity duration-300">
          <div className="bg-[#0d1527] border border-slate-800 rounded-3xl w-full max-w-3xl p-6 sm:p-7 shadow-2xl my-8 max-h-[88vh] flex flex-col scale-100 transition-transform duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>📝</span> Bank Soal & Kunci Jawaban
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{viewQuestionsModule.title}</p>
              </div>
              <button
                onClick={() => setViewQuestionsModule(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto pr-2 space-y-5 flex-1">
              {viewQuestionsModule.questions?.map((q: any, qIdx: number) => (
                <div key={qIdx} className="bg-[#080d19]/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {qIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-2 pl-8">
                    {q.options?.map((opt: string, optIdx: number) => {
                      const isCorrect = q.correctAnswer === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 ${
                            isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-900/50 border-slate-800 text-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`correct-${qIdx}`}
                            checked={isCorrect}
                            onChange={() => handleCorrectAnswerChange(qIdx, optIdx)}
                            className="w-4 h-4 accent-emerald-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold w-4">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                            className="flex-1 bg-transparent border-none text-xs text-inherit focus:outline-none"
                          />
                          {isCorrect && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                              Kunci Benar
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800 mt-4">
              <button
                type="button"
                onClick={() => setViewQuestionsModule(null)}
                className="flex-1 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveQuestionsEdit}
                className="flex-1 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                Simpan Perubahan Kunci
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP 2: DETAIL JAWABAN MAHASISWA */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto transition-opacity duration-300">
          <div className="bg-[#0d1527] border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl my-8 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>👤</span> Analisis Pengerjaan
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedStudentDetail.studentName || selectedStudentDetail.name || 'Mahasiswa'} • NIM: {selectedStudentDetail.nim || '-'} • Skor: {selectedStudentDetail.score}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto pr-2 space-y-3 flex-1">
              {Array.isArray(selectedStudentDetail.answersSummary) && selectedStudentDetail.answersSummary.length > 0 ? (
                selectedStudentDetail.answersSummary.map((ans: any, i: number) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-2xl border transition-all duration-200 ${
                      ans.isCorrect
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white">
                        Soal #{ans.questionNumber || i + 1}
                      </span>
                      {ans.isCorrect ? (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          ✓ Benar (+{ans.points ?? 10})
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                          ✗ Salah ({ans.points ?? 0})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mb-2">{ans.questionText || `Pertanyaan nomor ${i + 1}`}</p>
                    <div className="grid sm:grid-cols-2 gap-2 text-xs bg-[#080d19]/80 p-3 rounded-xl border border-slate-800/80">
                      <div>
                        <span className="block text-[10px] text-slate-500 font-semibold uppercase">Jawaban Mahasiswa:</span>
                        <span className={`font-semibold ${ans.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                          {ans.selectedAnswerText || (ans.selectedAnswer != null ? `Opsi ${String.fromCharCode(65 + ans.selectedAnswer)}` : 'Tidak dijawab')}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500 font-semibold uppercase">Kunci Jawaban Asli:</span>
                        <span className="font-semibold text-emerald-400">
                          {ans.correctAnswerText || (ans.correctAnswer != null ? `Opsi ${String.fromCharCode(65 + ans.correctAnswer)}` : '-')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs bg-[#080d19]/60 rounded-2xl border border-slate-800/80">
                  {selectedStudentDetail.wrongQuestions?.length > 0 ? (
                    <p className="text-red-400 font-semibold">
                      Mahasiswa ini tercatat salah pada nomor: {selectedStudentDetail.wrongQuestions.join(', ')}
                    </p>
                  ) : (
                    <p>Rincian butir soal mahasiswa ini sudah tersimpan pada data rekap skor.</p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 mt-3 text-right">
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP 3: EDIT PENGATURAN MODUL */}
      {editingModule && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto transition-opacity duration-300">
          <div className="bg-[#0d1527] border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>⚙️</span> Edit Modul & Pengaturan Kuis
              </h3>
              <button
                onClick={() => setEditingModule(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Judul Modul</label>
                  <input
                    type="text"
                    value={editingModule.title}
                    onChange={e => setEditingModule({ ...editingModule, title: e.target.value })}
                    required
                    className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kode Masuk Ruang</label>
                  <input
                    type="text"
                    value={editingModule.code}
                    onChange={e => setEditingModule({ ...editingModule, code: e.target.value })}
                    required
                    className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Rombel / Kelas (Pisahkan koma)</label>
                <input
                  type="text"
                  value={editingModule.classesStr}
                  onChange={e => setEditingModule({ ...editingModule, classesStr: e.target.value })}
                  placeholder="PMH, HES, AS"
                  required
                  className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div className="p-4 bg-[#080d19]/80 border border-slate-800/80 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Aturan Poin & Soal</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Jumlah Soal <span className="text-slate-500">(Maks {editingModule.questions?.length || 0})</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={editingModule.questions?.length || 50}
                      value={editingModule.settings.questionCount}
                      onChange={e => setEditingModule({
                        ...editingModule,
                        settings: { ...editingModule.settings, questionCount: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Waktu (Detik/Soal)</label>
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={editingModule.settings.timePerQuestion}
                      onChange={e => setEditingModule({
                        ...editingModule,
                        settings: { ...editingModule.settings, timePerQuestion: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-400 mb-1">Poin Benar (+)</label>
                    <input
                      type="number"
                      value={editingModule.settings.pointsCorrect}
                      onChange={e => setEditingModule({
                        ...editingModule,
                        settings: { ...editingModule.settings, pointsCorrect: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-red-400 mb-1">Poin Salah (-)</label>
                    <input
                      type="number"
                      value={editingModule.settings.pointsWrong}
                      onChange={e => setEditingModule({
                        ...editingModule,
                        settings: { ...editingModule.settings, pointsWrong: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-400 mb-1">Poin Kosong (0)</label>
                    <input
                      type="number"
                      value={editingModule.settings.pointsUnanswered}
                      onChange={e => setEditingModule({
                        ...editingModule,
                        settings: { ...editingModule.settings, pointsUnanswered: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingModule(null)}
                  className="flex-1 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition shadow-lg shadow-cyan-500/20 active:scale-98 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAdminDosen;
