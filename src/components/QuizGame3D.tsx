import { useState, useEffect, useRef } from 'react';
import { User, QuizModule, QuizQuestion } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { LogOut, CheckCircle, XCircle, AlertTriangle, Clock, Activity, ChevronRight, Award } from 'lucide-react';
import { saveResult } from '../lib/localDb';


interface Props {
  user: User;
  module: QuizModule;
  onExit: () => void;
}

export default function QuizGame3D({ user, module, onExit }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(module.settings.timePerQuestion);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerDetails, setAnswerDetails] = useState<{ questionIdx: number, selectedIdx: number, correctIdx: number }[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  // Anti-cheat
  const cheatingFlags = useRef(0);
  
  // Slice questions based on settings
  const activeQuestions = module.questions.slice(0, module.settings.questionCount || module.questions.length);
  const currentQ = activeQuestions[currentIndex];

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isFinished) {
        cheatingFlags.current += 1;
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isFinished]);

  useEffect(() => {
    if (isFinished || selectedOption !== null) return;
    
    setTimeLeft(module.settings.timePerQuestion);
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentIndex, isFinished, module.settings.timePerQuestion, selectedOption]);

  const handleTimeout = () => {
    handleAnswer(-1); // -1 means timeout/wrong
  };

  const handleAnswer = (selectedIdx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(selectedIdx);

    const isCorrect = selectedIdx === currentQ.correctAnswer;
    
    setAnswerDetails(prev => [...prev, {
      questionIdx: currentIndex,
      selectedIdx,
      correctIdx: currentQ.correctAnswer
    }]);

    if (isCorrect) {
      setCorrectCount(c => c + 1);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#ffffff']
      });
    } else {
      setWrongCount(w => w + 1);
    }
    
    setTimeout(() => {
      goToNext();
    }, 2000); // 2 second delay to show the correct/wrong state
  };

  const goToNext = () => {
    setSelectedOption(null);
    if (currentIndex + 1 < activeQuestions.length) {
      setCurrentIndex(i => i + 1);
    } else {
      setIsFinished(true);
    }
  };

  useEffect(() => {
    if (isFinished) {
      // Calculate final score using custom points or default to 100-base if not set
      const ptsCorrect = module.settings.pointsCorrect ?? 10;
      const ptsWrong = module.settings.pointsWrong ?? 0;
      const finalScore = (correctCount * ptsCorrect) + (wrongCount * ptsWrong);
      
      const resultId = crypto.randomUUID();
      const resultData = {
          quizId: module.id,
          studentId: user.id,
          studentName: user.name,
          studentNim: user.nim,
          studentKelas: user.kelas,
          score: finalScore,
          correctAnswers: correctCount,
          wrongAnswers: wrongCount,
          cheatingFlags: cheatingFlags.current,
          submittedAt: Date.now(),
          details: answerDetails
      };
      
      saveResult({ ...resultData, id: resultId } as any)
        
    }
  }, [isFinished, correctCount, wrongCount, activeQuestions.length, user, module.id, answerDetails, module.settings.pointsCorrect, module.settings.pointsWrong]);

  if (isFinished) {
    const ptsCorrect = module.settings.pointsCorrect ?? 10;
    const ptsWrong = module.settings.pointsWrong ?? 0;
    const finalScore = (correctCount * ptsCorrect) + (wrongCount * ptsWrong);
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center p-4 z-50 overflow-hidden">
        {/* Background Animation */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-blue-600/20 to-emerald-600/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-2xl border border-white/20 p-10 rounded-[40px] shadow-2xl max-w-lg w-full text-center relative z-10"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-xl shadow-emerald-500/30 transform rotate-12">
            <Award className="w-12 h-12 text-white -rotate-12" />
          </div>
          
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Kuis Selesai! 🎉</h1>
          <p className="text-slate-400 font-medium mb-8">Kerja bagus, {user.name.split(' ')[0]}!</p>
          
          <div className="bg-black/40 rounded-3xl p-8 mb-8 border border-white/5">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Skor Akhir</div>
            <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-lg">
              {finalScore}
            </div>
          </div>
          
          <div className="flex justify-center gap-4 mb-8">
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-4 rounded-2xl flex flex-col items-center flex-1">
              <CheckCircle className="w-6 h-6 text-emerald-400 mb-2" />
              <div className="text-2xl font-bold text-white">{correctCount}</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Benar</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 px-6 py-4 rounded-2xl flex flex-col items-center flex-1">
              <XCircle className="w-6 h-6 text-red-400 mb-2" />
              <div className="text-2xl font-bold text-white">{wrongCount}</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Salah</div>
            </div>
          </div>
          
          {cheatingFlags.current > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 p-4 rounded-2xl mb-8 flex items-center justify-center gap-3 text-sm font-bold">
              <AlertTriangle className="w-5 h-5" />
              Terditeksi {cheatingFlags.current}x Pindah Tab
            </div>
          )}

          <button 
            onClick={onExit}
            className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold text-lg py-5 rounded-2xl transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            Kembali ke Dasbor
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#050505] text-white flex flex-col overflow-hidden z-50">
      {/* Gen-Z Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-rose-600/10 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] bg-blue-500/15 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-6 lg:p-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowExitConfirm(true)}
            className="p-3 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full transition-colors backdrop-blur-md"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 px-6 py-2.5 rounded-full">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Modul</div>
            <div className="text-sm font-bold text-white">{module.title}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-5 py-3 rounded-full">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-sm tracking-wide">
              {currentIndex + 1} / {activeQuestions.length}
            </span>
          </div>
          <div className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold backdrop-blur-md border border-white/10 transition-colors ${timeLeft <= 5 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/5 text-white'}`}>
            <Clock className="w-4 h-4" />
            00:{timeLeft.toString().padStart(2, '0')}
          </div>
        </div>
      </header>

      {/* Main Quiz Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 max-w-5xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -20 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
            className="w-full flex flex-col items-center"
          >
            {/* Question Card */}
            <div className="w-full bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[3rem] p-8 md:p-12 shadow-2xl mb-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500" />
              <h2 dir="auto" className="text-3xl md:text-5xl font-bold leading-tight text-center text-white drop-shadow-md">
                {currentQ.question}
              </h2>
            </div>

            {/* Options Grid */}
            <div className="w-full grid md:grid-cols-2 gap-4 md:gap-6">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrectAnswer = currentQ.correctAnswer === idx;
                
                // Determine styling based on state
                let stateStyles = "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10 hover:border-white/30";
                
                if (selectedOption !== null) {
                  if (isCorrectAnswer) {
                    stateStyles = "bg-emerald-500/20 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] text-emerald-100";
                  } else if (isSelected && !isCorrectAnswer) {
                    stateStyles = "bg-red-500/20 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)] text-red-100";
                  } else {
                    stateStyles = "bg-white/5 border-white/5 text-slate-500 opacity-50";
                  }
                }

                return (
                  <motion.button
                    key={idx}
                    disabled={selectedOption !== null}
                    onClick={() => handleAnswer(idx)}
                    whileHover={selectedOption === null ? { scale: 1.02 } : {}}
                    whileTap={selectedOption === null ? { scale: 0.98 } : {}}
                    className={`relative p-6 md:p-8 rounded-[2rem] border-2 backdrop-blur-xl text-left flex items-center gap-6 transition-all duration-300 group ${stateStyles}`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 transition-colors ${
                      selectedOption !== null
                        ? isCorrectAnswer 
                          ? 'bg-emerald-500 text-white' 
                          : isSelected 
                            ? 'bg-red-500 text-white' 
                            : 'bg-white/10 text-slate-500'
                        : 'bg-white/10 text-white group-hover:bg-white/20'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    
                    <span dir="auto" className="text-xl md:text-2xl font-semibold leading-snug flex-1">
                      {opt}
                    </span>

                    {selectedOption !== null && isCorrectAnswer && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-6">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                      </motion.div>
                    )}
                    {selectedOption !== null && isSelected && !isCorrectAnswer && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-6">
                        <XCircle className="w-8 h-8 text-red-400" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="relative z-10 w-full py-6 text-center">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest pointer-events-none drop-shadow-sm">
          &copy; Property By Jawa X Java's Studios Company
        </p>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#0f0f0f] border border-white/10 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-500/30">
                  <LogOut className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="font-bold text-xl text-white mb-2">Keluar Kuis?</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Apakah Anda yakin ingin keluar? Semua progres Anda pada kuis ini akan hilang dan tidak disimpan.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors">
                    Lanjut Kuis
                  </button>
                  <button 
                    onClick={onExit} 
                    className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors"
                  >
                    Ya, Keluar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
