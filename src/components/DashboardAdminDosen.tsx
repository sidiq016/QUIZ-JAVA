const handleUpload = async () => {
    if (!file || !title || !code || !classes) {
      setError('Harap isi semua field dan pilih file');
      return;
    }
    setLoading(true); setError('');

    try {
      // 1. Baca teks file langsung di browser
      const text = await file.text();
      const cleanText = text.substring(0, 30000);

      // 2. Minta AI Gemini bikin soal langsung dari browser
      const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (window as any).GEMINI_API_KEY || '';
      
      const promptText = `Buat 10 soal pilihan ganda berdasarkan materi berikut dalam format JSON Array murni:
      [{"question": "pertanyaan", "options": ["A", "B", "C", "D"], "correctAnswer": 0}].
      Materi: ${cleanText}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const data = await res.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      const questions = JSON.parse(rawJson);

      // 3. Simpan modul kuis
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
      setFile(null); setTitle(''); setCode(''); setClasses('');
      setActiveTab('modules');
    } catch (err: any) {
      setError('Gagal memproses AI. Pastikan API key aktif.');
    } finally {
      setLoading(false);
    }
  };
