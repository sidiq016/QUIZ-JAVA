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

      // Daftar model yang akan dicoba secara berurutan
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
          pointsWrong: 0
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
                  className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'AI Sedang Menelaah Dokumen & Menyusun Kuis...' : '⚡ Generate Soal Kuis (AI)'}
                </button>
              </div>
            </div>

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
                          <span className="text-xs text-slate-400">{mod.questions?.length || 0} Soal</span>
                        </div>
                        <h4 className="text-base font-semibold text-white mb-1">{mod.title}</h4>
                        <p className="text-xs text-slate-400">Kelas: {mod.classes?.join(', ')}</p>
                      </div>

                      <div className="flex items-center gap-2 mt-5">
                        <button
                          onClick={() => onStartProjector(mod)}
                          className="flex-1 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-semibold transition border border-emerald-500/30"
                        >
                          Mulai Proyektor
                        </button>
                        <button
                          onClick={() => handleDeleteModule(mod.id)}
                          className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition border border-red-500/20"
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
          <div>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">Hasil & Nilai Mahasiswa</h1>
              <p className="text-sm text-slate-400">Daftar rekapan hasil pengerjaan kuis.</p>
            </div>

            {results.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400 text-sm">
                Belum ada mahasiswa yang menyelesaikan kuis.
              </div>
            ) : (
              <div className="overflow-x-auto bg-slate-900/60 border border-slate-800 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Nama</th>
                      <th className="py-3.5 px-4">NIM</th>
                      <th className="py-3.5 px-4">Kelas</th>
                      <th className="py-3.5 px-4">Modul</th>
                      <th className="py-3.5 px-4 text-center">Benar</th>
                      <th className="py-3.5 px-4 text-right">Skor Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {results.map((res: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-medium text-white">{res.studentName}</td>
                        <td className="py-3 px-4 text-slate-400 text-xs">{res.nim}</td>
                        <td className="py-3 px-4 text-slate-400 text-xs">{res.className}</td>
                        <td className="py-3 px-4 text-slate-300">{res.moduleTitle || '-'}</td>
                        <td className="py-3 px-4 text-center text-slate-300">
                          {res.correctAnswers} / {res.totalQuestions}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400">{res.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardAdminDosen;
