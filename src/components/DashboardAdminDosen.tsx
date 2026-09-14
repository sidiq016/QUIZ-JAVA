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

  // Simpan perubahan kunci jawaban / soal
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

  // Export Excel CSV
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex items-center justify-between border-b border-slate-800 pb-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            JAVA'S
          </span>
          <span className="text-sm font-medium text-slate-400">Panel Dosen</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-xs">
            <span className="block text-slate-400">DOSEN</span>
            <span className="font-semibold text-emerald-400">{user?.name || 'Firman'}</span>
          </div>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition border border-red-500/20"
          >
            Keluar
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setActiveTab('modules')}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'modules' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Modul
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'results' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hasil
            </button>
          </div>
        </div>

        {activeTab === 'modules' ? (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">Manajemen Modul Kuis</h1>
              <p className="text-sm text-slate-400">Buat kuis baru atau atur modul yang sudah ada.</p>
            </div>

            {/* Form Upload Dokumen AI */}
            <div className="max-w-xl mx-auto bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl mb-12">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <span>📄</span> Buat Modul Baru dari Dokumen
              </h2>

              {error && (
                <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Judul Modul</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Contoh: Fikih Jinayah"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Kode Akses Kuis</label>
                    <input
                      type="text"
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      placeholder="Contoh: 1528"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Rombel / Kelas (Pisahkan dengan koma)</label>
                  <input
                    type="text"
                    value={classes}
                    onChange={e => setClasses(e.target.value)}
                    placeholder="PMH, HES, AS"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Dokumen Materi (.pdf / .docx)</label>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 cursor-pointer"
                  />
                </div>

                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'AI Sedang Menelaah Dokumen & Menyusun Kuis...' : '⚡ Generate Soal Kuis (AI)'}
                </button>
              </div>
            </div>

            {/* Daftar Modul */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Modul Aktif</h3>
              {modules.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400 text-sm">
                  Belum ada modul kuis. Unggah dokumen materi di atas untuk membuat modul otomatis.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {modules.map(mod => (
                    <div key={mod.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold">
                            Kode: {mod.code}
                          </span>
                          <span className="text-xs text-slate-400">
                            {mod.settings?.questionCount || mod.questions?.length || 0} Soal • {mod.settings?.timePerQuestion || 30}s/soal
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-white mb-1">{mod.title}</h4>
                        <p className="text-xs text-slate-400 mb-2">Kelas: {Array.isArray(mod.classes) ? mod.classes.join(', ') : mod.classes}</p>
                        
                        <div className="flex flex-wrap gap-2 text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                          <span className="text-emerald-400 font-medium">+{mod.settings?.pointsCorrect ?? 10} Benar</span>
                          <span>•</span>
                          <span className="text-red-400 font-medium">-{Math.abs(mod.settings?.pointsWrong ?? 0)} Salah</span>
                          <span>•</span>
                          <span className="text-amber-400 font-medium">{mod.settings?.pointsUnanswered ?? 0} Kosong</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-5">
                        <button
                          onClick={() => onStartProjector(mod)}
                          className="flex-1 py-2 px-3 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-semibold transition border border-emerald-500/30"
                        >
                          Mulai Proyektor
                        </button>
                        <button
                          onClick={() => setViewQuestionsModule(JSON.parse(JSON.stringify(mod)))}
                          className="py-2 px-3 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs font-semibold transition border border-indigo-500/20"
                        >
                          📝 Bank Soal / Kunci
                        </button>
                        <button
                          onClick={() => openEditModal(mod)}
                          className="py-2 px-3 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-semibold transition border border-cyan-500/20"
                        >
                          ⚙️ Atur
                        </button>
                        <button
                          onClick={() => handleDeleteModule(mod.id)}
                          className="py-2 px-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition border border-red-500/20"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* TAB HASIL */
          <div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Hasil & Nilai Mahasiswa</h1>
                <p className="text-sm text-slate-400">Daftar rekapan hasil dan analisis detail pengerjaan mahasiswa.</p>
              </div>
              <button
                onClick={handleExportExcel}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              >
                <span>📊</span> Export Excel / CSV
              </button>
            </div>

            {results.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400 text-sm">
                Belum ada mahasiswa yang menyelesaikan kuis.
              </div>
            ) : (
              <div className="overflow-x-auto bg-slate-900/60 border border-slate-800 rounded-xl shadow-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Nama Mahasiswa</th>
                      <th className="py-3.5 px-4">NIM</th>
                      <th className="py-3.5 px-4">Kelas</th>
                      <th className="py-3.5 px-4 text-center">Skor</th>
                      <th className="py-3.5 px-4 text-center">Benar / Salah</th>
                      <th className="py-3.5 px-4 text-center">Salah di No.</th>
                      <th className="py-3.5 px-4 text-center">Indikasi Nyontek</th>
                      <th className="py-3.5 px-4 text-right">Waktu Selesai</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
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
                        <tr key={idx} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 font-medium text-white">{res.studentName || res.name || '-'}</td>
                          <td className="py-3 px-4 text-slate-400 text-xs">{res.nim || '-'}</td>
                          <td className="py-3 px-4 text-slate-400 text-xs">{res.className || '-'}</td>
                          <td className="py-3 px-4 text-center font-bold text-cyan-400">{res.score ?? 0}</td>
                          <td className="py-3 px-4 text-center text-xs">
                            <span className="text-emerald-400 font-semibold">{res.correctAnswers ?? 0}</span>
                            <span className="text-slate-500"> / </span>
                            <span className="text-red-400 font-semibold">
                              {res.wrongAnswers ?? (res.totalQuestions ? res.totalQuestions - (res.correctAnswers || 0) : 0)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-xs text-red-400 font-mono font-medium">
                            {wrongNumbers}
                          </td>
                          <td className="py-3 px-4 text-center text-xs">
                            {isCheating ? (
                              <span className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-semibold">
                                {res.tabSwitchCount ? `${res.tabSwitchCount}x Keluar Tab` : 'Terindikasi'}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                                Aman
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-xs text-slate-400">
                            {res.completedAt ? new Date(res.completedAt).toLocaleString('id-ID') : (res.timeFinished || '-')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => setSelectedStudentDetail(res)}
                              className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-semibold border border-cyan-500/20 transition cursor-pointer"
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
      </div>

      {/* POPUP 1: LIHAT BANK SOAL & RUBAH KUNCI JAWABAN */}
      {viewQuestionsModule && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>📝</span> Bank Soal & Kunci Jawaban: {viewQuestionsModule.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Pilih radio button untuk menentukan kunci jawaban yang benar.</p>
              </div>
              <button
                onClick={() => setViewQuestionsModule(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto pr-2 space-y-6 flex-1">
              {viewQuestionsModule.questions?.map((q: any, qIdx: number) => (
                <div key={qIdx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center">
                      {qIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-2 pl-8">
                    {q.options?.map((opt: string, optIdx: number) => {
                      const isCorrect = q.correctAnswer === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-3 p-2 rounded-lg border transition ${
                            isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300'
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
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-semibold">
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
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveQuestionsEdit}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                Simpan Perubahan Kunci
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP 2: DETAIL JAWABAN PER NOMOR MAHASISWA */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl my-8 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>👤</span> Analisis Pengerjaan: {selectedStudentDetail.studentName || selectedStudentDetail.name || 'Mahasiswa'}
                </h3>
                <p className="text-xs text-slate-400">
                  NIM: {selectedStudentDetail.nim || '-'} • Kelas: {selectedStudentDetail.className || '-'} • Skor: {selectedStudentDetail.score}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto pr-2 space-y-3 flex-1">
              {Array.isArray(selectedStudentDetail.answersSummary) && selectedStudentDetail.answersSummary.length > 0 ? (
                selectedStudentDetail.answersSummary.map((ans: any, i: number) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-xl border ${
                      ans.isCorrect
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-white">
                        Soal #{ans.questionNumber || i + 1}
                      </span>
                      {ans.isCorrect ? (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          ✓ Benar (+{ans.points ?? 10})
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                          ✗ Salah ({ans.points ?? 0})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mb-2">{ans.questionText || `Pertanyaan nomor ${i + 1}`}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                      <div>
                        <span className="block text-[10px] text-slate-400">Jawaban Mahasiswa:</span>
                        <span className={`font-semibold ${ans.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                          {ans.selectedAnswerText || (ans.selectedAnswer != null ? `Opsi ${String.fromCharCode(65 + ans.selectedAnswer)}` : 'Tidak dijawab')}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400">Kunci Jawaban Asli:</span>
                        <span className="font-semibold text-emerald-400">
                          {ans.correctAnswerText || (ans.correctAnswer != null ? `Opsi ${String.fromCharCode(65 + ans.correctAnswer)}` : '-')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
                  {selectedStudentDetail.wrongQuestions?.length > 0 ? (
                    <p className="text-red-400 font-semibold">
                      Mahasiswa ini tercatat salah pada nomor: {selectedStudentDetail.wrongQuestions.join(', ')}
                    </p>
                  ) : (
                    <p>Mahasiswa ini belum mengirimkan rincian per butir soal.</p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 mt-3 text-right">
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP 3: EDIT PENGATURAN MODUL */}
      {editingModule && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>⚙️</span> Edit Modul & Pengaturan Kuis
              </h3>
              <button
                onClick={() => setEditingModule(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Judul Modul</label>
                  <input
                    type="text"
                    value={editingModule.title}
                    onChange={e => setEditingModule({ ...editingModule, title: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Kode Verifikasi Ruang</label>
                  <input
                    type="text"
                    value={editingModule.code}
                    onChange={e => setEditingModule({ ...editingModule, code: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Rombel / Kelas (Pisahkan koma)</label>
                <input
                  type="text"
                  value={editingModule.classesStr}
                  onChange={e => setEditingModule({ ...editingModule, classesStr: e.target.value })}
                  placeholder="PMH, HES, AS"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-3">
                <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Aturan Poin & Soal</h4>

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
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Waktu Jawab (Detik/Soal)</label>
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={editingModule.settings.timePerQuestion}
                      onChange={e => setEditingModule({
                        ...editingModule,
                        settings: { ...editingModule.settings, timePerQuestion: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs text-emerald-400 mb-1">Poin Benar (+)</label>
                    <input
                      type="number"
                      value={editingModule.settings.pointsCorrect}
                      onChange={e => setEditingModule({
                        ...editingModule,
                        settings: { ...editingModule.settings, pointsCorrect: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-red-400 mb-1">Poin Salah (-)</label>
                    <input
                      type="number"
                      value={editingModule.settings.pointsWrong}
                      onChange={e => setEditingModule({
                        ...editingModule,
                        settings: { ...editingModule.settings, pointsWrong: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-amber-400 mb-1">Poin Kosong (0)</label>
                    <input
                      type="number"
                      value={editingModule.settings.pointsUnanswered}
                      onChange={e => setEditingModule({
                        ...editingModule,
                        settings: { ...editingModule.settings, pointsUnanswered: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingModule(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-cyan-500 hover:bg-cyan-600 text-slate-950 transition shadow-lg shadow-cyan-500/20"
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
