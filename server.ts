import express from "express";
import path from "path";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { User, QuizModule, QuizResult } from "./src/types.js";

dotenv.config();

const app = express();
const PORT = 3000;
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

// IN-MEMORY DATABASE
let users: User[] = [
  { id: uuidv4(), role: 'admin', username: 'F1R6M6N6', password: 'F1R6M6N6', name: 'Super Admin' },
  { id: uuidv4(), role: 'dosen', username: 'D0S3N26', password: 'D0S3N26', name: 'Dosen Pengampu' }
];

let modules: QuizModule[] = [];
let results: QuizResult[] = [];

// API ROUTES

// Auth & Users
app.post("/api/login", (req, res) => {
  const { role, username, password, name, nim, kelas } = req.body;

  if (role === 'admin' || role === 'dosen') {
    const user = users.find(u => u.role === role && u.username === username && u.password === password);
    if (user) {
      return res.json({ success: true, user });
    }
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (role === 'mahasiswa') {
    // Check if Mahasiswa exists by NIM
    let user = users.find(u => u.role === 'mahasiswa' && u.nim === nim);
    if (!user) {
      // Auto-register for convenience, but admin can manage
      user = { id: uuidv4(), role: 'mahasiswa', name, nim, kelas };
      users.push(user);
    } else {
      // Update info just in case
      user.name = name;
      user.kelas = kelas;
    }
    return res.json({ success: true, user });
  }

  return res.status(400).json({ error: "Invalid role" });
});

app.get("/api/users", (req, res) => {
  res.json({ users });
});

app.post("/api/users", (req, res) => {
  const newUser = { ...req.body, id: uuidv4() };
  users.push(newUser);
  res.json({ success: true, user: newUser });
});

app.delete("/api/users/:id", (req, res) => {
  users = users.filter(u => u.id !== req.params.id);
  res.json({ success: true });
});

app.put("/api/users/:id", (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index > -1) {
    users[index] = { ...users[index], ...req.body };
    res.json({ success: true, user: users[index] });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

app.get("/api/available-classes", (req, res) => {
  const classes = new Set<string>();
  modules.forEach(m => {
    m.classes.forEach(c => classes.add(c));
  });
  res.json({ classes: Array.from(classes) });
});

// Modules
app.get("/api/modules", (req, res) => {
  res.json({ modules });
});

app.post("/api/modules", upload.single("file"), async (req, res) => {
  try {
    const { title, code, classes, createdBy } = req.body;
    let extractedText = "";

    if (req.file) {
      const { originalname, buffer } = req.file;
      if (originalname.endsWith(".pdf")) {
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        extractedText = data.text;
      } else if (originalname.endsWith(".docx")) {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } else {
        return res.status(400).json({ error: "Unsupported file type" });
      }
    } else {
       return res.status(400).json({ error: "No file uploaded" });
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ error: "No text could be extracted from the file" });
    }

    let cleanText = extractedText
      .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, "")
      .replace(/page\s*\d+\s*of\s*\d+/gi, "")
      .replace(/^\s*\d+\s*$/gm, "")
      .substring(0, 40000);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `Anda adalah AI pembuat kuis akademik profesional. Tugas Anda adalah membuat 10 soal pilihan ganda berdasarkan teks dokumen yang diberikan.

ATURAN SANGAT PENTING (CRITICAL):
1. BACA ISI KONTEN TEKS. Soal harus relevan, akurat, dan berasal dari "SUBSTANSI MATERI" dokumen tersebut (misalnya ilmu pengetahuan, teori, konsep, sejarah yang dibahas di dalamnya). Pastikan pilihan jawaban yang benar (correctAnswer) secara faktual sesuai dengan teks.
2. Setiap soal HARUS memiliki tepat 4 pilihan jawaban (options).
3. "correctAnswer" HARUS berupa angka indeks (0, 1, 2, atau 3) yang menunjukkan posisi jawaban yang benar di dalam array "options".
4. Anda HARUS MENDETEKSI bahasa utama yang digunakan dalam teks sumber materi tersebut (misalnya Arab, Latin, Indonesia, Inggris).
5. Anda HARUS menulis "question" (soal) dan "options" (pilihan jawaban) MENGGUNAKAN BAHASA DAN AKSARA YANG SAMA PERSIS dengan teks sumber materi.
6. Jika materi membahas teks Arab (huruf Hijaiyah), maka soal dan jawaban HARUS ditulis full dalam aksara Arab (العربية).
7. JANGAN MENERJEMAHKAN ke bahasa Indonesia jika teks sumbernya materi aslinya adalah bahasa Arab atau Latin. Tetap pertahankan bahasa aslinya.
8. Buang segala meta-data atau teks header/footer saat membaca materi. Fokus hanya pada ISI.

Teks Sumber:
${cleanText}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              question: { type: "STRING" },
              options: { type: "ARRAY", items: { type: "STRING" } },
              correctAnswer: { type: "INTEGER" }
            },
            required: ["question", "options", "correctAnswer"]
          }
        }
      }
    });

    let questions = [];
    try {
      let parsed = JSON.parse(response.text || "[]");
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Invalid JSON format generated by AI");
      }
      
      // Sanitize output to ensure consistency
      questions = parsed.map(q => {
        let opts = Array.isArray(q.options) ? q.options : [];
        while (opts.length < 4) opts.push("Pilihan tidak tersedia");
        opts = opts.slice(0, 4);
        
        let correct = Number(q.correctAnswer);
        if (isNaN(correct) || correct < 0 || correct > 3) {
           correct = 0; // fallback
        }
        
        return {
           question: String(q.question || "Pertanyaan tidak valid"),
           options: opts.map(String),
           correctAnswer: correct
        };
      });
    } catch (err) {
      console.error("AI JSON Parse Error:", err, response.text);
      return res.status(500).json({ error: "Gagal memproses teks dari AI, silakan coba dokumen yang berbeda." });
    }

    const newModule: QuizModule = {
      id: uuidv4(),
      title,
      code,
      classes: classes.split(",").map((c: string) => c.trim()),
      questions,
      settings: {
        questionCount: questions.length,
        timePerQuestion: 30,
        projectorMode: false,
        pointsCorrect: 10,
        pointsWrong: 0
      },
      createdBy,
      createdAt: Date.now()
    };

    return res.json({ success: true, module: newModule });
  } catch (error) {
    console.error("Error generating quiz:", error);
    return res.status(500).json({ error: "Failed to generate quiz from document." });
  }
});

app.post("/api/modules/manual", (req, res) => {
  try {
    const { title, code, classes, createdBy, questions } = req.body;
    
    if (!title || !code || !classes || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newModule: QuizModule = {
      id: uuidv4(),
      title,
      code,
      classes: classes.split(",").map((c: string) => c.trim()),
      questions,
      settings: {
        questionCount: questions.length,
        timePerQuestion: 30,
        projectorMode: false,
        pointsCorrect: 10,
        pointsWrong: 0
      },
      createdBy: createdBy || "admin",
      createdAt: Date.now()
    };
    
    return res.json({ success: true, module: newModule });
  } catch (error) {
    console.error("Error creating manual module:", error);
    return res.status(500).json({ error: "Failed to create manual module." });
  }
});

app.put("/api/modules/:id", (req, res) => {
  const modIndex = modules.findIndex(m => m.id === req.params.id);
  if (modIndex > -1) {
    modules[modIndex] = { ...modules[modIndex], ...req.body };
    res.json({ success: true, module: modules[modIndex] });
  } else {
    res.status(404).json({ error: "Module not found" });
  }
});

app.delete("/api/modules/:id", (req, res) => {
  modules = modules.filter(m => m.id !== req.params.id);
  res.json({ success: true });
});


app.post("/api/users-sync", express.json(), (req, res) => {
  const user = req.body;
  const idx = users.findIndex(u => u.id === user.id);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  res.json({ success: true });
});

app.post("/api/modules-sync", express.json(), (req, res) => {
  const mod = req.body;
  const idx = modules.findIndex(m => m.id === mod.id);
  if (idx >= 0) modules[idx] = mod;
  else modules.push(mod);
  res.json({ success: true });
});

app.post("/api/results-sync", express.json(), (req, res) => {
  const resData = req.body;
  const idx = results.findIndex(r => r.id === resData.id);
  if (idx >= 0) results[idx] = resData;
  else results.push(resData);
  res.json({ success: true });
});

// Student Actions
app.post("/api/join-quiz", (req, res) => {
  const { code, kelas } = req.body;
  const mod = modules.find(m => m.code === code);
  
  if (!mod) {
    return res.status(404).json({ error: "Kode kuis tidak ditemukan" });
  }
  
  if (!mod.classes.includes(kelas)) {
    return res.status(403).json({ error: "Kelas Anda tidak terdaftar pada modul ini" });
  }

  res.json({ success: true, module: mod });
});

app.post("/api/results", (req, res) => {
  const newResult = { ...req.body, id: uuidv4(), submittedAt: Date.now() };
  results.push(newResult);
  res.json({ success: true, result: newResult });
});

app.get("/api/results", (req, res) => {
  res.json({ results });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
