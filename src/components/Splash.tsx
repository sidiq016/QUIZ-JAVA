import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

export default function Splash() {
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-blue-600/20 to-purple-600/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
        className="text-center relative z-10 flex flex-col items-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="relative w-24 h-24 mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl blur-xl opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl shadow-2xl shadow-purple-500/20 border border-white/20 flex items-center justify-center backdrop-blur-xl">
             <span className="text-4xl">🚀</span>
          </div>
        </motion.div>

        <motion.h1 
          className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{ backgroundSize: "200% auto" }}
        >
          JAVA'S
        </motion.h1>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-6 flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 shadow-xl">
             <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
             <span className="text-sm font-semibold text-blue-100 tracking-wide uppercase">Memuat Platform...</span>
          </div>
        </motion.div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        className="absolute bottom-8 left-0 w-full text-center pointer-events-none"
      >
        <p className="text-[10px] font-bold text-slate-500/80 uppercase tracking-[0.2em] drop-shadow-sm">
          &copy; Property By Jawa X Java's Studios Company
        </p>
      </motion.div>
    </div>
  );
}
