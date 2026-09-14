const handleUpload = async () => {
    if (!file || !title || !code || !classes) {
      setError('Harap isi semua field dan pilih file');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // 1. Ambil API Key Gemini (dari environment Vite)
      const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        throw new Error('API Key Gemini belum diatur di Vercel (VITE_GEMINI_API_KEY).');
      }

      // 2. Ubah file dokumen (PDF/Word) menjadi Base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
      });

      const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      // 3. Prompt instruksi ke Gemini AI
      const promptText = `Anda adalah pembuat soal kuis akademik profesional.
Buatlah 10 soal pilihan ganda dari isi dokumen materi terlampir ini.
Format jawaban HARUS berupa JSON Array murni tanpa format markdown seperti contoh berikut:
[
  {
    "question": "Pertanyaan soal",
    "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
    "correctAnswer": 0
  }
]
Ketentuan:
- Gunakan bahasa yang sama dengan dokumen materi.
- correctAnswer berupa angka index (0 untuk A, 1 untuk B, 2 untuk C, 3 untuk D).`;

      // 4. Kirim langsung ke Google AI Studio (Gemini 2.5 Flash)
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptText },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error?.message || `Gagal menghubungi AI Gemini (Status: ${response.status})`);
      }

      const resData = await response.json();
      const rawJson = resData.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      const questions = JSON.parse(rawJson);

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('AI tidak berhasil mengekstrak soal dari materi.');
      }

      // 5. Simpan langsung ke database lokal browser
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
        createdBy: user.name || user.username || 'Dosen',
        createdAt: Date.now()
      };

      saveModule(newModule as any);
      setFile(null);
      setTitle('');
      setCode('');
      setClasses('');
      setActiveTab('modules');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memproses dokumen dengan AI.');
    } finally {
      setLoading(false);
    }
  };
