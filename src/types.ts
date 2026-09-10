export type Role = 'mahasiswa' | 'dosen' | 'admin';

export interface User {
  id: string;
  role: Role;
  name?: string;
  nim?: string;
  kelas?: string;
  username?: string;
  email?: string;
  password?: string;
  avatar?: string;
}

export interface QuizSettings {
  questionCount: number;
  timePerQuestion: number;
  projectorMode: boolean;
  pointsCorrect?: number;
  pointsWrong?: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface QuizModule {
  id: string;
  title: string;
  code: string;
  classes: string[];
  questions: QuizQuestion[];
  settings: QuizSettings;
  createdBy: string;
  createdAt: number;
}

export interface QuizResult {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  studentNim: string;
  studentKelas: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  cheatingFlags: number;
  submittedAt: number;
  details?: { questionIdx: number, selectedIdx: number, correctIdx: number }[];
}
