import React, { useState, useEffect } from 'react';
import { getModules, saveModule, deleteModule, getResults } from '../lib/localDb';

interface Props {
  user: any;
  onLogout: () => void;
  onStartProjector: (module: any) => void;
}

// 10 Karakter 3D (5 Pria, 5 Wanita Berhijab) dengan representasi SVG 3D clay/chibi
export const CHARACTERS_3D = [
  // 5 Pria
  {
    id: 'male-1',
    gender: 'pria',
    name: 'Ahmad (Koko Modern)',
    role: 'Mahasiswa / Dosen Muda',
    badge: 'Pria #1',
    bgGradient: 'from-cyan-500/20 to-blue-600/30',
    borderColor: 'border-cyan-400',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <circle cx="50" cy="50" r="46" fill="#0f172a" />
        {/* Peci Hitam */}
        <path d="M30 35 Q50 31 70 35 L68 25 Q50 22 32 25 Z" fill="#1e293b" stroke="#0284c7" strokeWidth="1" />
        {/* Wajah */}
        <circle cx="50" cy="46" r="18" fill="#fbd5b5" />
        {/* Mata 3D Chibi & Senyum */}
        <ellipse cx="44" cy="45" rx="2.5" ry="3.5" fill="#0f172a" />
        <ellipse cx="56" cy="45" rx="2.5" ry="3.5" fill="#0f172a" />
        <circle cx="45" cy="44" r="1" fill="#ffffff" />
        <circle cx="57" cy="44" r="1" fill="#ffffff" />
        <path d="M47 52 Q50 55 53 52" stroke="#d97706" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Baju Koko Cyan */}
        <path d="M28 85 L33 62 Q50 58 67 62 L72 85 Z" fill="#0284c7" />
        <path d="M48 62 L48 85" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />
      </svg>
    )
  },
  {
    id: 'male-2',
    gender: 'pria',
    name: 'Ustadz Farhan (Kopiah Putih)',
    role: 'Dosen Syari\'ah',
    badge: 'Pria #2',
    bgGradient: 'from-emerald-500/20 to-teal-700/30',
    borderColor: 'border-emerald-400',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <circle cx="50" cy="50" r="46" fill="#064e3b" />
        {/* Kopiah Putih */}
        <path d="M32 34 Q50 30 68 34 L67 24 Q50 20 33 24 Z" fill="#f8fafc" />
        <circle cx="50" cy="46" r="18" fill="#fcd34d" opacity="0.9" />
        {/* Kacamata */}
        <rect x="39" y="42" width="9" height="7" rx="2" fill="none" stroke="#0f172a" strokeWidth="1.5" />
        <rect x="52" y="42" width="9" height="7" rx="2" fill="none" stroke="#0f172a" strokeWidth="1.5" />
        <path d="M48 45 L52 45" stroke="#0f172a" strokeWidth="1.5" />
        {/* Senyum */}
        <path d="M47 53 Q50 56 53 53" stroke="#b45309" strokeWidth="1.5" fill="none" />
        {/* Jas Hijau Tua */}
        <path d="M26 85 L32 62 Q50 58 68 62 L74 85 Z" fill="#047857" />
        <polygon points="50,62 44,78 56,78" fill="#f8fafc" />
      </svg>
    )
  },
  {
    id: 'male-3',
    gender: 'pria',
    name: 'Rayhan (Almamater)',
    role: 'Mahasiswa PMH',
    badge: 'Pria #3',
    bgGradient: 'from-blue-500/20 to-indigo-700/30',
    borderColor: 'border-blue-400',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <circle cx="50" cy="50" r="46" fill="#1e1b4b" />
        {/* Rambut Belah Samping */}
        <path d="M32 38 Q35 24 50 24 Q65 24 68 38 Q58 30 32 38 Z" fill="#0f172a" />
        <circle cx="50" cy="46" r="18" fill="#fed7aa" />
        <ellipse cx="44" cy="45" rx="2" ry="3" fill="#0f172a" />
        <ellipse cx="56" cy="45" rx="2" ry="3" fill="#0f172a" />
        <path d="M46 52 Q50 56 54 52" stroke="#ea580c" strokeWidth="1.5" fill="none" />
        {/* Jas Almamater Biru */}
        <path d="M26 85 L32 62 Q50 58 68 62 L74 85 Z" fill="#2563eb" />
        <polygon points="50,62 43,85 57,85" fill="#ffffff" />
        <polygon points="50,68 47,85 53,85" fill="#dc2626" />
      </svg>
    )
  },
  {
    id: 'male-4',
    gender: 'pria',
    name: 'Dr. Ilham (Kemeja Formal)',
    role: 'Dosen Pembimbing',
    badge: 'Pria #4',
    bgGradient: 'from-amber-500/20 to-orange-700/30',
    borderColor: 'border-amber-400',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <circle cx="50" cy="50" r="46" fill="#451a03" />
        <path d="M32 30 Q50 26 68 30 L66 23 Q50 19 34 23 Z" fill="#1e293b" />
        <circle cx="50" cy="46" r="18" fill="#fde047" opacity="0.8" />
        <ellipse cx="43" cy="45" rx="2.5" ry="3.5" fill="#0f172a" />
        <ellipse cx="57" cy="45" rx="2.5" ry="3.5" fill="#0f172a" />
        {/* Jenggot Tipis Rapi */}
        <path d="M44 56 Q50 60 56 56" stroke="#451a03" strokeWidth="2" fill="none" strokeDasharray="1 1" />
        {/* Batik Coklat */}
        <path d="M26 85 L32 62 Q50 58 68 62 L74 85 Z" fill="#d97706" />
      </svg>
    )
  },
  {
    id: 'male-5',
    gender: 'pria',
    name: 'Fikri (Casual Tech)',
    role: 'Admin Sistem',
    badge: 'Pria #5',
    bgGradient: 'from-purple-500/20 to-indigo-700/30',
    borderColor: 'border-purple-400',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <circle cx="50" cy="50" r="46" fill="#3b0764" />
        {/* Headphone & Hoodie */}
        <path d="M30 46 C30 30 70 30 70 46" stroke="#a855f7" strokeWidth="4" fill="none" />
        <rect x="27" y="42" width="6" height="10" rx="3" fill="#c084fc" />
        <rect x="67" y="42" width="6" height="10" rx="3" fill="#c084fc" />
        <circle cx="50" cy="46" r="18" fill="#ffedd5" />
        <ellipse cx="44" cy="46" rx="2.5" ry="3" fill="#0f172a" />
        <ellipse cx="56" cy="46" rx="2.5" ry="3" fill="#0f172a" />
        {/* Hoodie Ungu */}
        <path d="M26 85 L32 62 Q50 60 68 62 L74 85 Z" fill="#7e22ce" />
      </svg>
    )
  },

  // 5 Wanita Berhijab
  {
    id: 'female-1',
    gender: 'wanita',
    name: 'Aisyah (Hijab Pastel Lilac)',
    role: 'Mahasiswi PMH',
    badge: 'Wanita #1',
    bgGradient: 'from-pink-500/20 to-purple-700/30',
    borderColor: 'border-pink-400',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <circle cx="50" cy="50" r="46" fill="#581c87" />
        {/* Hijab Syar'i Lilac */}
        <path d="M24 75 C24 35 34 22 50 22 C66 22 76 35 76 75 C68 85 32 85 24 75 Z" fill="#d8b4fe" />
        {/* Wajah Bulat Chibi */}
        <ellipse cx="50" cy="48" rx="14" ry="15" fill="#fde68a" opacity="0.95" />
        {/* Mata Berbinar + Bulu Mata */}
        <ellipse cx="44" cy="47" rx="2.8" ry="3.8" fill="#1e1b4b" />
        <ellipse cx="56" cy="47" rx="2.8" ry="3.8" fill="#1e1b4b" />
        <circle cx="45" cy="46" r="1.2" fill="#ffffff" />
        <circle cx="57" cy="46" r="1.2" fill="#ffffff" />
        <path d="M41 43 Q44 41 47 43" stroke="#1e1b4b" strokeWidth="1" fill="none" />
        <path d="M53 43 Q56 41 59 43" stroke="#1e1b4b" strokeWidth="1" fill="none" />
        {/* Senyum Manis & Rona Pipi */}
        <circle cx="40" cy="51" r="3" fill="#f43f5e" opacity="0.35" />
        <circle cx="60" cy="51" r="3" fill="#f43f5e" opacity="0.35" />
        <path d="M47 53 Q50 56 53 53" stroke="#e11d48" strokeWidth="1.2" fill="none" />
      </svg>
    )
  },
  {
    id: 'female-2',
    gender: 'wanita',
    name: 'Fatimah (Hijab Emerald)',
    role: 'Dosen Pembina',
    badge: 'Wanita #2',
    bgGradient: 'from-emerald-500/20 to-teal-800/30',
    borderColor: 'border-emerald-400',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <circle cx="50" cy="50" r="46" fill="#064e3b" />
        <path d="M22 75 C22 32 33 22 50 22 C67 22 78 32 78 75 C70 85 30 85 22 75 Z" fill="#059669" />
        <ellipse cx="50" cy="48" rx="14" ry="15" fill="#fed7aa" />
        {/* Kacamata Elegan */}
        <rect x="40" y="44" width="8" height="6" rx="2" fill="none" stroke="#1e293b" strokeWidth="1.2" />
        <rect x="52" y="44" width="8" height="6" rx="2" fill="none" stroke="#1e293b" strokeWidth="1.2" />
        <path d="M48 47 L52 47" stroke="#1e293b" strokeWidth="1.2" />
        <path d="M47 54 Q50 57 53 54" stroke="#c2410c" strokeWidth="1.2" fill="none" />
      </svg>
    )
  },
  {
    id: 'female-3',
    gender: 'wanita',
    name: 'Zahra (Hijab Navy & Almamater)',
    role: 'Mahasiswi Berprestasi',
    badge: 'Wanita #3',
    bgGradient: 'from-sky-500/20 to-blue-800/30',
    borderColor: 'border-sky-400',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <circle cx="50" cy="50" r="46" fill="#082f49" />
        <path d="M24 75 C24 35 34 23 50 23 C66 23 76 35 76 75 Z" fill="#0369a1" />
        <ellipse cx="50" cy="48" rx="14" ry="15" fill="#fef08a" opacity="0.95" />
        <ellipse cx="44" cy="47" rx="2.5" ry="3.5" fill="#0f172a" />
        <ellipse cx="56" cy="47" rx="2.5" ry="3.5" fill="#0f172a" />
        <circle cx="45" cy="46" r="1" fill="#ffffff" />
        <circle cx="57" cy="46" r="1" fill="#ffffff" />
        <circle cx="40" cy="52" r="2.5" fill="#f43f5e" opacity="0.4" />
        <circle cx="60" cy="52" r="2.5" fill="#f43f5e" opacity="0.4" />
        <path d="M47 54 Q50 57 53 54" stroke="#be123c" strokeWidth="1.2" fill="none" />
        {/* Almamater Biru */}
        <path d="M30 85 L36 68 Q50 66 64 68 L70 85 Z" fill="#1d4ed8" />
      </svg>
    )
  },
  {
    id: 'female-4',
    gender: 'wanita',
    name: 'Khadijah (Hijab Mocca Modern)',
    role: 'Admin Akademik',
    badge: 'Wanita #4',
    bgGradient: 'from-amber-600/20 to-stone-800/30',
    borderColor: 'border-amber-500',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <circle cx="50" cy="50" r="46" fill="#292524" />
        {/* Hijab Warna Mocca / Nude */}
        <path d="M23 75 C23 33 33 22 50 22 C67 22 77 33 77 75 C68 85 32 85 23 75 Z" fill="#b45309" />
        <ellipse cx="50" cy="48" rx="14" ry="15" fill="#ffedd5" />
        <ellipse cx="44" cy="47" rx="2.5" ry="3.5" fill="#1c1917" />
        <ellipse cx="56" cy="47" rx="2.5" ry="3.5" fill="#1c1917" />
        <circle cx="45" cy="46" r="1" fill="#ffffff" />
        <circle cx="57" cy="46" r="1" fill="#ffffff" />
        <path d="M47 54 Q50 57 53 54" stroke="#78350f" strokeWidth="1.5" fill="none" />
      </svg>
    )
  },
  {
    id: 'female-5',
    gender: 'wanita',
    name: 'Maryam (Pashmina Putih Gading)',
    role: 'Dosen Hukum Islam',
    badge: 'Wanita #5',
    bgGradient: 'from-slate-300/20 to-slate-700/30',
    borderColor: 'border-slate-300',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <circle cx="50" cy="50" r="46" fill="#0f172a" />
        {/* Hijab Putih Bersih */}
        <path d="M24 75 C24 32 33 21 50 21 C67 21 76 32 76 75 C68 85 32 85 24 75 Z" fill="#f8fafc" />
        <ellipse cx="50" cy="48" rx="14" ry="15" fill="#fed7aa" />
        <ellipse cx="44" cy="47" rx="2.5" ry="3.5" fill="#0f172a" />
        <ellipse cx="56" cy="47" rx="2.5" ry="3.5" fill="#0f172a" />
        <circle cx="45" cy="46" r="1" fill="#ffffff" />
        <circle cx="57" cy="46" r="1" fill="#ffffff" />
        <circle cx="40" cy="52" r="3" fill="#fb7185" opacity="0.3" />
        <circle cx="60" cy="52" r="3" fill="#fb7185" opacity="0.3" />
        <path d="M47 54 Q50 57 53 54" stroke="#be123c" strokeWidth="1.2" fill="none" />
      </svg>
    )
  }
];

const DashboardAdminDosen: React.FC<Props> = ({ user, onLogout, onStartProjector }) => {
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('java_quiz_active_user');
    return saved ? JSON.parse(saved) : (user || { name: 'Firman Sidiq', role: 'admin', username: 'firman', avatarId: 'male-1' });
  });

  const [activeTab, setActiveTab] = useState<'modules' | 'results'>('modules');
  const [modules, setModules] = useState<any[]>(getModules());
  const [results, setResults] = useState<any[]>(getResults());
  
  // State Dokumen Kuis
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [classes, setClasses] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sidebar Drawer (Garis Tiga ☰)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'profile' | 'users' | 'branding'>('profile');
  const [characterFilter, setCharacterFilter] = useState<'semua' | 'pria' | 'wanita'>('semua');

  // Modal State Kuis
  const [editingModule, setEditingModule] = useState<any | null>(null);
  const [viewQuestionsModule, setViewQuestionsModule] = useState<any | null>(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);

  // State Manajemen Branding Logo
  const [customLogo, setCustomLogo] = useState<string>(() => localStorage.getItem('app_custom_logo') || '');

  // State Manajemen Pengguna (Dosen & Mahasiswa)
  const [userList, setUserList] = useState<any[]>(() => {
    const saved = localStorage.getItem('app_user_list');
    return saved ? JSON.parse(saved) : [
      { id: '1', username: 'dosen1', name: 'Dosen Pengampu', role: 'dosen', password: '123', avatarId: 'male-2' },
      { id: '2', username: '1253040007', name: 'Firman sidiq', role: 'mahasiswa', password: '123', class: 'PMH 3A', avatarId: 'male-1' }
    ];
  });
  const [newUser, setNewUser] = useState({ username: '', name: '', password: '', role: 'mahasiswa', class: '', avatarId: 'male-1' });
  const [editingUser, setEditingUser] = useState<any | null>(null);

  useEffect(() => {
    localStorage.setItem('app_user_list', JSON.stringify(userList));
  }, [userList]);

  const refreshData = () => {
    setModules(getModules());
    setResults(getResults());
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (uploaded) {
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = reader.result as string;
        setCustomLogo(b64);
        localStorage.setItem('app_custom_logo', b64);
      };
      reader.readAsDataURL(uploaded);
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('java_quiz_active_user', JSON.stringify(currentUser));
    alert('Profil dan karakter 3D berhasil disimpan!');
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.name) return;
    const added = { ...newUser, id: crypto.randomUUID() };
    setUserList([...userList, added]);
    setNewUser({ username: '', name: '', password: '', role: 'mahasiswa', class: '', avatarId: 'male-1' });
  };

  const handleUpdateUserData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUserList(userList.map(u => u.id === editingUser.id ? editingUser : u));
    setEditingUser(null);
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Hapus akun ini dari sistem?')) {
      setUserList(userList.filter(u => u.id !== id));
    }
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

  const activeChar = CHARACTERS_3D.find(c => c.id === (currentUser.avatarId || 'male-1')) || CHARACTERS_3D[0];
  const filteredCharacters = CHARACTERS_3D.filter(c => characterFilter === 'semua' ? true : c.gender === characterFilter);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden font-sans">
      {/* Background Ambient Glow dengan transisi lembut */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[750px] h-[400px] bg-gradient-to-b from-cyan-600/15 via-indigo-600/10 to-transparent blur-3xl opacity-75 transition-opacity duration-1000"></div>
      </div>

      {/* Header Bar */}
      <header className="relative z-20 border-b border-slate-800/80 bg-[#0c1220]/80 backdrop-blur-xl px-4 sm:px-8 py-3.5 transition-all duration-700 ease-out">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Tombol Garis Tiga (Sidebar Trigger) dengan Efek Hover 3D */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/70 text-cyan-400 hover:text-white hover:bg-cyan-500/20 hover:border-cyan-500/40 shadow-lg shadow-cyan-500/10 transition-all duration-500 ease-out transform hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center group"
              title="Menu Pengaturan, Profil, & User"
            >
              <svg className="w-5 h-5 transition-transform duration-500 ease-out group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo Dinamis */}
            <div className="flex items-center gap-3">
              {customLogo ? (
                <img
                  src={customLogo}
                  alt="Logo Web"
                  className="h-10 w-10 object-contain rounded-2xl border border-cyan-500/30 shadow-md shadow-cyan-500/20 transition-all duration-500 ease-out hover:scale-115 hover:rotate-3"
                />
              ) : (
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/25 transition-all duration-500 ease-out hover:scale-115 hover:rotate-3">
                  <div className="w-full h-full bg-[#080d19] rounded-[15px] flex items-center justify-center font-black text-cyan-400 text-sm">
                    J3D
                  </div>
                </div>
              )}
              <div>
                <span className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                  JAVA'S
                </span>
                <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60 uppercase">
                  {currentUser.role || 'Admin'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Karakter Avatar Mini Aktif di Pojok Kanan Atas */}
            <div 
              onClick={() => { setIsSidebarOpen(true); setSidebarTab('profile'); }}
              className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 px-3.5 py-1.5 rounded-2xl cursor-pointer transition-all duration-500 ease-out hover:scale-105 shadow-md hover:shadow-cyan-500/10"
              title="Klik untuk ubah profil & karakter 3D"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-400/40 p-0.5 bg-[#090e1a]">
                {activeChar.svg}
              </div>
              <div className="text-right hidden sm:block">
                <span className="block text-[10px] font-semibold text-slate-500 uppercase">{currentUser.role}</span>
                <span className="font-semibold text-xs text-emerald-400">{currentUser.name}</span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-all duration-500 ease-out border border-red-500/20 hover:scale-105 active:scale-95 cursor-pointer shadow-sm shadow-red-500/10"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-[#0e1628]/90 p-1.5 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md flex gap-2">
            <button
              onClick={() => setActiveTab('modules')}
              className={`px-8 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-700 ease-out cursor-pointer ${
                activeTab === 'modules'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              📚 Modul Kuis
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-8 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-700 ease-out cursor-pointer ${
                activeTab === 'results'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              📊 Hasil Mahasiswa
            </button>
          </div>
        </div>

        {activeTab === 'modules' ? (
          <div className="space-y-10">
            <div className="text-center max-w-lg mx-auto">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                Manajemen Modul Kuis
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Otomatisasi pembuatan butir soal dengan AI atau kelola konfigurasi kuis.
              </p>
            </div>

            {/* AI Generator Card (3D Tilt & Glow Effect) */}
            <div className="max-w-2xl mx-auto bg-[#0d1527]/75 border border-slate-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-all duration-700 ease-out hover:border-cyan-500/40 hover:shadow-cyan-500/20 hover:-translate-y-2 hover:rotate-[-0.3deg]">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/60">
                <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 text-xl shadow-inner">📄</div>
                <div>
                  <h2 className="text-base font-bold text-white">Buat Modul dari Dokumen (Gemini AI)</h2>
                  <p className="text-xs text-slate-400">Unggah file PDF atau Word materi ajar.</p>
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
                      className="w-full bg-[#080d19]/90 border border-slate-800 focus:border-cyan-500 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-all duration-500 ease-out"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kode Akses Ruang</label>
                    <input
                      type="text"
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      placeholder="Contoh: 1528"
                      className="w-full bg-[#080d19]/90 border border-slate-800 focus:border-cyan-500 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-all duration-500 ease-out"
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
                    className="w-full bg-[#080d19]/90 border border-slate-800 focus:border-cyan-500 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-all duration-500 ease-out"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Dokumen Materi (.pdf / .docx)</label>
                  <div className="border border-dashed border-slate-700 hover:border-cyan-500/50 rounded-2xl p-3 sm:p-4 bg-[#080d19]/60 transition-all duration-500 ease-out flex items-center">
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={e => setFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 cursor-pointer transition-all duration-500 ease-out"
                    />
                  </div>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="w-full mt-2 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-1 active:translate-y-0 transition-all duration-500 ease-out disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>AI Sedang Memproses Materi & Menyusun Kuis...</span>
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
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
                <span>📂</span> Modul Aktif ({modules.length})
              </h3>

              {modules.length === 0 ? (
                <div className="p-12 text-center bg-[#0d1527]/50 border border-slate-800/80 rounded-3xl text-slate-400 text-xs sm:text-sm backdrop-blur-sm">
                  Belum ada modul kuis. Unggah dokumen materi di atas untuk membuat modul.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {modules.map(mod => (
                    <div
                      key={mod.id}
                      className="group bg-[#0d1527]/70 hover:bg-[#0e172c]/90 border border-slate-800/90 hover:border-cyan-500/40 rounded-3xl p-6 backdrop-blur-sm shadow-xl hover:shadow-cyan-500/15 hover:-translate-y-2 hover:rotate-[0.3deg] transition-all duration-700 ease-out flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-3 py-1 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-black font-mono">
                            KODE: {mod.code}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {mod.settings?.questionCount || mod.questions?.length || 0} Soal • {mod.settings?.timePerQuestion || 30}s
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors duration-500 ease-out mb-1 line-clamp-1">
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
                          className="w-full py-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-bold transition-all duration-500 ease-out hover:shadow-lg hover:shadow-emerald-500/15 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>📺</span> Mulai Proyektor
                        </button>

                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setViewQuestionsModule(JSON.parse(JSON.stringify(mod)))}
                            className="py-2 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 text-xs font-semibold transition-all duration-500 ease-out active:scale-95 cursor-pointer text-center"
                          >
                            📝 Kunci
                          </button>
                          <button
                            onClick={() => openEditModal(mod)}
                            className="py-2 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 text-xs font-semibold transition-all duration-500 ease-out active:scale-95 cursor-pointer text-center"
                          >
                            ⚙️ Atur
                          </button>
                          <button
                            onClick={() => handleDeleteModule(mod.id)}
                            className="py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs font-semibold transition-all duration-500 ease-out active:scale-95 cursor-pointer text-center"
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
          /* Tab Hasil */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d1527]/70 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">Hasil & Nilai Mahasiswa</h1>
                <p className="text-xs sm:text-sm text-slate-400">Rekap nilai, analisis pengerjaan, dan deteksi kecurangan.</p>
              </div>
              <button
                onClick={handleExportExcel}
                className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 hover:-translate-y-1 active:translate-y-0 transition-all duration-500 ease-out cursor-pointer w-full sm:w-auto"
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
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors duration-300">
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
                              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-semibold border border-cyan-500/20 transition-all duration-500 ease-out active:scale-95 cursor-pointer"
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

      {/* SIDEBAR DRAWER (Garis Tiga ☰) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay Background */}
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-700 ease-out"
            onClick={() => setIsSidebarOpen(false)}
          ></div>

          {/* Drawer Menu */}
          <div className="absolute inset-y-0 left-0 max-w-full flex">
            <div className="w-screen max-w-md bg-[#0b1120] border-r border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-700 ease-out">
              {/* Header Drawer */}
              <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-[#080d19]/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-2xl bg-cyan-500/10 text-cyan-400 font-bold">⚙️</div>
                  <div>
                    <h3 className="text-base font-bold text-white">Panel Pengaturan</h3>
                    <p className="text-xs text-slate-400">Akun, Pengguna, & Branding Web</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Navigation Tabs Sidebar */}
              <div className="flex border-b border-slate-800 bg-[#070b14]/80 p-2 gap-1">
                <button
                  onClick={() => setSidebarTab('profile')}
                  className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all duration-500 ease-out cursor-pointer ${
                    sidebarTab === 'profile' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 scale-[1.02]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  👤 Profil & Karakter
                </button>
                {currentUser.role === 'admin' && (
                  <>
                    <button
                      onClick={() => setSidebarTab('users')}
                      className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all duration-500 ease-out cursor-pointer ${
                        sidebarTab === 'users' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 scale-[1.02]' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      👥 User
                    </button>
                    <button
                      onClick={() => setSidebarTab('branding')}
                      className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all duration-500 ease-out cursor-pointer ${
                        sidebarTab === 'branding' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 scale-[1.02]' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🎨 Logo Web
                    </button>
                  </>
                )}
              </div>

              {/* Drawer Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* TAB 1: BIO DATA & PILIH 10 KARAKTER 3D (5 PRIA & 5 WANITA BERHIJAB) */}
                {sidebarTab === 'profile' && (
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Koleksi Karakter 3D (10 Pilihan)</h4>
                        {/* Filter Pria / Wanita */}
                        <div className="flex gap-1 bg-[#080d19] p-1 rounded-xl border border-slate-800">
                          <button
                            type="button"
                            onClick={() => setCharacterFilter('semua')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors ${characterFilter === 'semua' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
                          >
                            Semua
                          </button>
                          <button
                            type="button"
                            onClick={() => setCharacterFilter('pria')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors ${characterFilter === 'pria' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
                          >
                            5 Pria
                          </button>
                          <button
                            type="button"
                            onClick={() => setCharacterFilter('wanita')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors ${characterFilter === 'wanita' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
                          >
                            5 Hijab
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                        {filteredCharacters.map(char => {
                          const isSelected = (currentUser.avatarId || 'male-1') === char.id;
                          return (
                            <div
                              key={char.id}
                              onClick={() => setCurrentUser({ ...currentUser, avatarId: char.id })}
                              className={`p-3 rounded-2xl border text-center cursor-pointer transition-all duration-500 ease-out transform hover:-translate-y-1.5 hover:rotate-[0.5deg] ${
                                isSelected
                                  ? `bg-gradient-to-b ${char.bgGradient} ${char.borderColor} shadow-xl shadow-cyan-500/20 scale-102`
                                  : 'bg-[#080d19]/90 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="w-16 h-16 mx-auto mb-2 relative">
                                {char.svg}
                              </div>
                              <span className="block text-xs font-bold text-white truncate">{char.name}</span>
                              <span className="block text-[10px] text-slate-400 truncate">{char.role}</span>
                              <span className="mt-1 inline-block text-[9px] px-2 py-0.5 rounded-full bg-slate-900/80 text-cyan-300 font-mono">
                                {char.badge}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-slate-800/80">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Lengkap</label>
                        <input
                          type="text"
                          value={currentUser.name}
                          onChange={e => setCurrentUser({ ...currentUser, name: e.target.value })}
                          required
                          className="w-full bg-[#080d19] border border-slate-800 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all duration-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username / NIM</label>
                        <input
                          type="text"
                          value={currentUser.username}
                          onChange={e => setCurrentUser({ ...currentUser, username: e.target.value })}
                          required
                          className="w-full bg-[#080d19] border border-slate-800 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all duration-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password Baru</label>
                        <input
                          type="password"
                          value={currentUser.password || ''}
                          onChange={e => setCurrentUser({ ...currentUser, password: e.target.value })}
                          placeholder="Kosongkan jika tidak ingin diubah"
                          className="w-full bg-[#080d19] border border-slate-800 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all duration-300"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3 rounded-2xl font-bold text-xs text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all duration-500 ease-out shadow-lg shadow-cyan-400/20 active:scale-95 cursor-pointer"
                      >
                        Simpan Profil & Karakter 3D
                      </button>
                    </div>
                  </form>
                )}

                {/* TAB 2: MANAJEMEN USER DOSEN & MAHASISWA */}
                {sidebarTab === 'users' && currentUser.role === 'admin' && (
                  <div className="space-y-6">
                    <form onSubmit={handleAddUser} className="bg-[#080d19]/90 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Tambah Pengguna Baru</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Nama Lengkap"
                          value={newUser.name}
                          onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                          required
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                        <input
                          type="text"
                          placeholder="Username / NIM"
                          value={newUser.username}
                          onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                          required
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="password"
                          placeholder="Password"
                          value={newUser.password}
                          onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                          required
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                        <select
                          value={newUser.role}
                          onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="mahasiswa">Mahasiswa</option>
                          <option value="dosen">Dosen</option>
                        </select>
                      </div>
                      {newUser.role === 'mahasiswa' && (
                        <input
                          type="text"
                          placeholder="Kelas (contoh: PMH 3A)"
                          value={newUser.class}
                          onChange={e => setNewUser({ ...newUser, class: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      )}
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-500 ease-out cursor-pointer"
                      >
                        + Tambahkan Pengguna
                      </button>
                    </form>

                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daftar Akun Terdaftar</h4>
                      {userList.map(u => (
                        <div key={u.id} className="p-3 bg-[#080d19]/90 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white block">{u.name}</span>
                            <span className="text-slate-400 text-[11px] block">{u.username} • {u.role} {u.class ? `(${u.class})` : ''}</span>
                            <span className="text-cyan-400 font-mono text-[10px]">Pass: {u.password}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setEditingUser(u)}
                              className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="px-2.5 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: CUSTOM LOGO WEB */}
                {sidebarTab === 'branding' && currentUser.role === 'admin' && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">Logo Website Kustom</h4>
                      <p className="text-xs text-slate-400 mb-4">
                        Logo ini otomatis muncul di sudut kiri atas website dan di layar tunggu/loading screen kuis mahasiswa.
                      </p>

                      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 hover:border-cyan-500/40 rounded-3xl bg-[#080d19]/60 transition-all duration-500 ease-out mb-4">
                        {customLogo ? (
                          <div className="text-center space-y-3">
                            <img src={customLogo} alt="Logo" className="h-20 w-20 object-contain mx-auto rounded-2xl border border-cyan-500/30 shadow-lg shadow-cyan-500/20" />
                            <span className="block text-xs text-emerald-400 font-semibold">✓ Logo Sedang Aktif</span>
                          </div>
                        ) : (
                          <div className="text-center space-y-2 text-slate-500">
                            <span className="text-3xl">🖼️</span>
                            <span className="block text-xs">Belum ada logo kustom (Default 3D Java)</span>
                          </div>
                        )}
                      </div>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-2xl file:border-0 file:text-xs file:font-bold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 cursor-pointer transition-all duration-500 ease-out"
                      />

                      {customLogo && (
                        <button
                          onClick={() => {
                            setCustomLogo('');
                            localStorage.removeItem('app_custom_logo');
                          }}
                          className="w-full mt-3 py-2 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition cursor-pointer"
                        >
                          Reset ke Logo Bawaan
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1527] border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Edit Data & Password Pengguna</h3>
            <form onSubmit={handleUpdateUserData} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Username / NIM</label>
                <input
                  type="text"
                  value={editingUser.username}
                  onChange={e => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Password Baru</label>
                <input
                  type="text"
                  value={editingUser.password}
                  onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="w-full bg-[#080d19] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-cyan-500 text-slate-950 rounded-xl text-xs font-bold"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: BANK SOAL & KUNCI */}
      {viewQuestionsModule && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0d1527] border border-slate-800 rounded-3xl w-full max-w-3xl p-6 sm:p-7 shadow-2xl my-8 max-h-[88vh] flex flex-col">
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
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-500 ease-out ${
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
                          <span className="text-xs font-bold w-4">{String.fromCharCode(65 + optIdx)}.</span>
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

      {/* MODAL 2: ANALISIS DETAIL SISWA */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0d1527] border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl my-8 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>👤</span> Analisis Pengerjaan Mahasiswa
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
                    className={`p-3.5 rounded-2xl border transition-all duration-500 ease-out ${
                      ans.isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white">Soal #{ans.questionNumber || i + 1}</span>
                      {ans.isCorrect ? (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">✓ Benar (+{ans.points ?? 10})</span>
                      ) : (
                        <span className="text-[11px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">✗ Salah ({ans.points ?? 0})</span>
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

      {/* MODAL 3: PENGATURAN MODUL */}
      {editingModule && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
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
